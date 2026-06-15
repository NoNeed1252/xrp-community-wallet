/**
 * Вынесенные mutations vault — импортируются только страницами Settings /
 * Onboarding (все lazy). При сборке попадают в чанки этих фич, а не в main.
 */
import { __vaultInternals, getAllSubAccounts, getActiveAccount, getPreferences, getProfiles } from './vault';
import type {
  AddAccountInput,
  AddLedgerInput,
  CreateInput,
  UserPreferences,
  WalletProfile,
} from './types';

const {
  STORE,
  KEY_PROFILES,
  KEY_PREFERENCES,
  KEY_SUB_ACCOUNTS,
  KEY_LOCKOUT,
  DEFAULT_PREFERENCES,
  getDb,
  ensureLockoutHydrated,
  persistLockoutState,
  unlockedSlot,
  notify,
  getFailedAttempts,
  setFailedAttempts,
  getCooldownUntil,
  setCooldownUntil,
  encryptSecret,
  decryptBlob,
  buildProfileFromSecretMaterial,
  nextId,
} = __vaultInternals;

const KEY_LEGACY_PRIMARY = 'primary';

export async function createWallet(input: CreateInput): Promise<WalletProfile> {
  const existing = await getProfiles();
  if (existing.length > 0) throw new Error('vault: already initialised; reset first');

  const { profile, blobMaterial, slot } = await buildProfileFromSecretMaterial(
    input.kind,
    input.secretMaterial,
  );
  const blob = await encryptSecret(blobMaterial, input.password);
  const full: WalletProfile = { ...profile, label: input.label ?? profile.label, encryptedBlob: blob };

  const db = await getDb();
  await db.put(STORE, [full], KEY_PROFILES);
  const prefs: UserPreferences = { activeAccountId: full.id, ...DEFAULT_PREFERENCES };
  await db.put(STORE, prefs, KEY_PREFERENCES);
  await db.put(STORE, {}, KEY_SUB_ACCOUNTS);

  const verify = (await db.get(STORE, KEY_PROFILES)) as WalletProfile[] | undefined;
  if (!verify || verify.length === 0 || verify[0]?.address !== full.address) {
    throw new Error('vault: write verification failed');
  }
  unlockedSlot.set(full.id, slot);
  setFailedAttempts(0);
  setCooldownUntil(0);
  await persistLockoutState();
  notify();
  return full;
}

export async function addAccount(input: AddAccountInput & { password: string }): Promise<WalletProfile> {
  if (unlockedSlot.size === 0) throw new Error('vault: locked');
  const profiles = await getProfiles();
  if (profiles.length === 0) throw new Error('vault: empty');

  // Валидируем пароль против действующего vault. Без этого опечатка
  // зашифрует новый профиль чужим ключом и при следующем unlock уронит весь
  // vault (см. security audit C2).
  const anchor = profiles.find((p) => Boolean(p.encryptedBlob));
  if (!anchor?.encryptedBlob) {
    throw new Error('vault: no encrypted profile to verify password against');
  }
  try {
    await decryptBlob(anchor.encryptedBlob, input.password);
  } catch {
    throw new Error('vault: password does not match existing vault');
  }

  const { profile, blobMaterial, slot } = await buildProfileFromSecretMaterial(
    input.kind,
    input.secretMaterial,
  );
  if (profiles.some((p) => p.address === profile.address)) {
    throw new Error('vault: account already exists');
  }
  const blob = await encryptSecret(blobMaterial, input.password);
  const full: WalletProfile = {
    ...profile,
    label: input.label ?? `Wallet ${profiles.length + 1}`,
    encryptedBlob: blob,
  };
  const db = await getDb();
  await db.put(STORE, [...profiles, full], KEY_PROFILES);
  unlockedSlot.set(full.id, slot);
  notify();
  return full;
}

export async function addLedgerAccount(input: AddLedgerInput): Promise<WalletProfile> {
  const profiles = await getProfiles();
  if (profiles.length === 0) throw new Error('vault: empty');
  if (profiles.some((p) => p.address === input.address)) {
    throw new Error('vault: account already exists');
  }
  const id = await nextId();
  const profile: WalletProfile = {
    id,
    label: input.label ?? `Ledger ${profiles.filter((p) => p.kind === 'ledger_hardware').length + 1}`,
    address: input.address,
    publicKey: input.publicKey,
    kind: 'ledger_hardware',
    createdAt: new Date().toISOString(),
    activated: false,
    derivationPath: input.derivationPath,
  };
  const db = await getDb();
  await db.put(STORE, [...profiles, profile], KEY_PROFILES);
  notify();
  return profile;
}

export async function unlock(password: string): Promise<void> {
  await ensureLockoutHydrated();
  if (Date.now() < getCooldownUntil()) throw new Error('vault: cooldown');
  const profiles = await getProfiles();
  if (profiles.length === 0) throw new Error('vault: empty');

  const keypairMod = await import('./keypair');
  const newSlot = new Map<string, (typeof __vaultInternals)['unlockedSlot'] extends Map<string, infer V> ? V : never>();

  try {
    for (const profile of profiles) {
      if (!profile.encryptedBlob) continue;
      const material = await decryptBlob(profile.encryptedBlob, password);
      if (profile.kind === 'multi_chain') {
        const xrpl = keypairMod.deriveFromMnemonic(material);
        if (xrpl.address !== profile.address) {
          throw new Error('vault: corrupted profile (address mismatch)');
        }
        const { deriveEvm } = await import('./hd');
        const evm = await deriveEvm(material);
        newSlot.set(profile.id, {
          address: xrpl.address,
          publicKey: xrpl.publicKey,
          secret: xrpl.secret,
          mnemonic: material,
          evm: {
            address: evm.address,
            privateKey: evm.privateKey,
            publicKey: evm.publicKey,
          },
        });
      } else {
        const derived = keypairMod.deriveFromFamilySeed(material);
        if (derived.address !== profile.address) {
          throw new Error('vault: corrupted profile (address mismatch)');
        }
        newSlot.set(profile.id, {
          address: derived.address,
          publicKey: derived.publicKey,
          secret: derived.secret,
        });
      }
    }
    unlockedSlot.clear();
    for (const [k, v] of newSlot) unlockedSlot.set(k, v);
    setFailedAttempts(0);
    setCooldownUntil(0);
    await persistLockoutState();
    notify();
  } catch (err) {
    const attempts = getFailedAttempts() + 1;
    setFailedAttempts(attempts);
    if (attempts >= 5) setCooldownUntil(Date.now() + 30_000);
    await persistLockoutState();
    throw err instanceof Error ? err : new Error(String(err));
  }
}

export async function reset(): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, KEY_PROFILES);
  await db.delete(STORE, KEY_PREFERENCES);
  await db.delete(STORE, KEY_SUB_ACCOUNTS);
  await db.delete(STORE, KEY_LEGACY_PRIMARY);
  await db.delete(STORE, KEY_LOCKOUT);
  unlockedSlot.clear();
  setFailedAttempts(0);
  setCooldownUntil(0);

  // Полный wipe: custom-tokens DB + in-memory tx state + access-token.
  try {
    const { deleteDB } = await import('idb');
    await deleteDB('rc-wallet-tokens');
  } catch {
    // ignore — DB may not exist yet
  }
  try {
    const { useMockedAccountState } = await import('~/features/send/hooks/useMockedAccountState');
    useMockedAccountState.getState().reset();
  } catch {
    // ignore
  }
  try {
    const { clearAccessToken } = await import('~/lib/api/client');
    clearAccessToken();
  } catch {
    // ignore
  }
  notify();
}

export async function renameAccount(id: string, label: string): Promise<void> {
  const profiles = await getProfiles();
  const next = profiles.map((p) => (p.id === id ? { ...p, label: label.trim() || p.label } : p));
  const db = await getDb();
  await db.put(STORE, next, KEY_PROFILES);
  notify();
}

export async function deleteAccount(id: string): Promise<void> {
  const profiles = await getProfiles();
  if (profiles.length <= 1) throw new Error('vault: cannot delete last account');
  const prefs = await getPreferences();
  if (prefs?.activeAccountId === id) {
    throw new Error('vault: cannot delete active account; switch first');
  }
  const next = profiles.filter((p) => p.id !== id);
  const db = await getDb();
  await db.put(STORE, next, KEY_PROFILES);
  const subs = await getAllSubAccounts();
  if (subs[id]) {
    const nextSubs = { ...subs };
    delete nextSubs[id];
    await db.put(STORE, nextSubs, KEY_SUB_ACCOUNTS);
  }
  unlockedSlot.delete(id);
  notify();
}

export async function setActiveAccount(id: string): Promise<void> {
  const profiles = await getProfiles();
  if (!profiles.some((p) => p.id === id)) throw new Error('vault: unknown account id');
  const current = (await getPreferences()) ?? { activeAccountId: id, ...DEFAULT_PREFERENCES };
  const db = await getDb();
  await db.put(STORE, { ...current, activeAccountId: id }, KEY_PREFERENCES);
  notify();
}

export async function setPreferences(patch: Partial<UserPreferences>): Promise<void> {
  const current =
    (await getPreferences()) ?? ({ activeAccountId: '', ...DEFAULT_PREFERENCES } as UserPreferences);
  const next: UserPreferences = { ...current, ...patch };
  const db = await getDb();
  await db.put(STORE, next, KEY_PREFERENCES);
  notify();
}

export async function changePassword(oldPwd: string, newPwd: string): Promise<void> {
  if (unlockedSlot.size === 0) throw new Error('vault: locked');
  const profiles = await getProfiles();
  if (profiles.length === 0) throw new Error('vault: empty');

  const secrets = new Map<string, string>();
  for (const p of profiles) {
    if (!p.encryptedBlob) continue;
    const s = await decryptBlob(p.encryptedBlob, oldPwd);
    secrets.set(p.id, s);
  }

  const newProfiles: WalletProfile[] = [];
  for (const p of profiles) {
    if (!p.encryptedBlob) {
      newProfiles.push(p);
      continue;
    }
    const secret = secrets.get(p.id);
    if (!secret) throw new Error('vault: missing decrypted secret during rotate');
    const blob = await encryptSecret(secret, newPwd);
    newProfiles.push({ ...p, encryptedBlob: blob });
  }
  const db = await getDb();
  await db.put(STORE, newProfiles, KEY_PROFILES);
  for (const key of secrets.keys()) secrets.delete(key);
  notify();
}

export async function viewSeed(password: string, accountId?: string): Promise<string> {
  if (unlockedSlot.size === 0) throw new Error('vault: locked');
  const profiles = await getProfiles();
  const active = await getActiveAccount();
  const target = accountId
    ? profiles.find((p) => p.id === accountId)
    : active ?? profiles[0];
  if (!target?.encryptedBlob) throw new Error('vault: account has no encrypted blob');
  return decryptBlob(target.encryptedBlob, password);
}
