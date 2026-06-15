import { openDB, type IDBPDatabase } from 'idb';
import { DEFAULT_KDF, type KdfParams } from '../crypto/kdf';
import type {
  AddAccountInput,
  AddLedgerInput,
  CreateInput,
  EncryptedBlob,
  SubAccount,
  UserPreferences,
  VaultStatus,
  WalletProfile,
} from './types';

/**
 * KeyVault v2.
 *
 * IndexedDB structure (один store `vault`, разные keys):
 *   - 'profiles'   → WalletProfile[]
 *   - 'preferences'→ UserPreferences
 *   - 'subAccounts'→ Record<accountId, SubAccount[]>
 *
 * Legacy v1 key 'primary' → WalletProfile. На boot мигрируется в v2.
 */

const DB_NAME = 'rc-wallet';
const STORE = 'vault';

const KEY_LEGACY_PRIMARY = 'primary';
const KEY_PROFILES = 'profiles';
const KEY_PREFERENCES = 'preferences';
const KEY_SUB_ACCOUNTS = 'subAccounts';
// Сохранённый счётчик неудач + срок cooldown. Перезагрузка страницы не должна
// сбрасывать защиту (security audit M1).
const KEY_LOCKOUT = 'lockout';

const DEFAULT_PREFERENCES: Omit<UserPreferences, 'activeAccountId'> = {
  autoLockMinutes: 15,
  // Дефолт: лочим vault при скрытии вкладки — стандарт MetaMask и аппаратных
  // кошельков (security audit L2). Юзер может отключить в Settings → Security.
  lockOnHidden: true,
  locale: 'en',
  theme: 'light',
  compactNumbers: true,
};

let dbPromise: Promise<IDBPDatabase> | null = null;
let migrationPromise: Promise<void> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      },
    });
  }
  return dbPromise;
}

/** Один-раз миграция v1 → v2 на app boot. Идемпотентна. */
async function ensureMigrated(): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = (async () => {
      const db = await getDb();
      const profiles = (await db.get(STORE, KEY_PROFILES)) as WalletProfile[] | undefined;
      if (profiles && profiles.length > 0) return;

      const legacy = (await db.get(STORE, KEY_LEGACY_PRIMARY)) as WalletProfile | undefined;
      if (!legacy) return;

      const v2Profile: WalletProfile = { ...legacy, activated: legacy.activated ?? false };
      const v2Preferences: UserPreferences = {
        activeAccountId: legacy.id,
        ...DEFAULT_PREFERENCES,
      };
      await db.put(STORE, [v2Profile], KEY_PROFILES);
      await db.put(STORE, v2Preferences, KEY_PREFERENCES);
      await db.put(STORE, {}, KEY_SUB_ACCOUNTS);
      await db.delete(STORE, KEY_LEGACY_PRIMARY);
    })();
  }
  return migrationPromise;
}

let kdfOverride: KdfParams | null = null;
export function __setKdfParamsForTesting(p: KdfParams | null): void {
  kdfOverride = p;
}
function activeKdf(): KdfParams {
  return kdfOverride ?? DEFAULT_KDF;
}

export interface UnlockedSlot {
  address: string;
  publicKey: string;
  /** XRPL family seed `s…` / `sEd…`. */
  secret: string;
  /** Только для multi_chain — расшифрованная mnemonic. Никогда не покидает память. */
  mnemonic?: string;
  /** EVM keypair (derived при unlock из mnemonic). */
  evm?: {
    address: `0x${string}`;
    privateKey: string;
    publicKey: string;
  };
}
const unlockedSlot = new Map<string, UnlockedSlot>();

/**
 * Низкоуровневый аксессор unlocked slot — используется только модулем
 * `lib/wallet/broadcast.ts` для подписи tx. Не покидает рамки этого app.
 */
export function getUnlockedSlot(profileId: string): UnlockedSlot | undefined {
  return unlockedSlot.get(profileId);
}
let failedAttempts = 0;
let cooldownUntil = 0;
let lockoutHydrationPromise: Promise<void> | null = null;

async function ensureLockoutHydrated(): Promise<void> {
  if (!lockoutHydrationPromise) {
    lockoutHydrationPromise = (async () => {
      try {
        const db = await getDb();
        const stored = (await db.get(STORE, KEY_LOCKOUT)) as
          | { failedAttempts?: number; cooldownUntil?: number }
          | undefined;
        if (stored) {
          failedAttempts = Number.isFinite(stored.failedAttempts) ? stored.failedAttempts! : 0;
          cooldownUntil = Number.isFinite(stored.cooldownUntil) ? stored.cooldownUntil! : 0;
        }
      } catch {
        // IDB unavailable — fall back to in-memory state only.
      }
    })();
  }
  return lockoutHydrationPromise;
}

async function persistLockoutState(): Promise<void> {
  try {
    const db = await getDb();
    await db.put(STORE, { failedAttempts, cooldownUntil }, KEY_LOCKOUT);
  } catch {
    // ignore — best-effort persistence
  }
}

const subscribers = new Set<() => void>();
function notify(): void {
  for (const cb of [...subscribers]) {
    try {
      cb();
    } catch {
      // ignore
    }
  }
}
export function subscribe(cb: () => void): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

export const __internal = {
  __forceResetDbPromise: () => {
    dbPromise = null;
    migrationPromise = null;
    lockoutHydrationPromise = null;
    unlockedSlot.clear();
    failedAttempts = 0;
    cooldownUntil = 0;
  },
  resetFailureCounter: () => {
    failedAttempts = 0;
    cooldownUntil = 0;
  },
  isUnlocked: () => unlockedSlot.size > 0,
};

/**
 * Низкоуровневые helpers для сиблинг-модулей `vaultMutations.ts` и
 * `vaultSubAccounts.ts`. Не предназначены для прямого использования из UI.
 */
export const __vaultInternals = {
  STORE,
  KEY_PROFILES,
  KEY_PREFERENCES,
  KEY_SUB_ACCOUNTS,
  KEY_LOCKOUT,
  DEFAULT_PREFERENCES,
  getDb,
  ensureMigrated,
  ensureLockoutHydrated,
  persistLockoutState,
  unlockedSlot,
  notify,
  getFailedAttempts: () => failedAttempts,
  setFailedAttempts: (n: number) => {
    failedAttempts = n;
  },
  getCooldownUntil: () => cooldownUntil,
  setCooldownUntil: (n: number) => {
    cooldownUntil = n;
  },
  activeKdf,
  encryptSecret,
  decryptBlob,
  buildProfileFromSecretMaterial,
  nextId,
};

function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += bytes[i]!.toString(16).padStart(2, '0');
  return out;
}

async function nextId(): Promise<string> {
  const { randomBytes } = await import('../crypto/random');
  return bytesToHex(randomBytes(12));
}

// ───────── Queries ─────────

export async function getProfiles(): Promise<WalletProfile[]> {
  await ensureMigrated();
  const db = await getDb();
  return ((await db.get(STORE, KEY_PROFILES)) as WalletProfile[] | undefined) ?? [];
}

export async function getPreferences(): Promise<UserPreferences | null> {
  await ensureMigrated();
  const db = await getDb();
  const prefs = (await db.get(STORE, KEY_PREFERENCES)) as UserPreferences | undefined;
  return prefs ?? null;
}

export async function getActiveAccount(): Promise<WalletProfile | null> {
  const [profiles, prefs] = await Promise.all([getProfiles(), getPreferences()]);
  if (!prefs || profiles.length === 0) return null;
  return profiles.find((p) => p.id === prefs.activeAccountId) ?? profiles[0] ?? null;
}

export async function getAllSubAccounts(): Promise<Record<string, SubAccount[]>> {
  await ensureMigrated();
  const db = await getDb();
  return ((await db.get(STORE, KEY_SUB_ACCOUNTS)) as Record<string, SubAccount[]> | undefined) ?? {};
}

export async function getSubAccounts(accountId: string): Promise<SubAccount[]> {
  const all = await getAllSubAccounts();
  return all[accountId] ?? [];
}

export async function getStatus(): Promise<VaultStatus> {
  const profiles = await getProfiles();
  if (profiles.length === 0) return 'empty';
  if (unlockedSlot.size > 0) return 'unlocked';
  return 'locked';
}

export async function getActiveAddress(): Promise<string | null> {
  const active = await getActiveAccount();
  return active?.address ?? null;
}

export function getEvmAddress(profile: WalletProfile): `0x${string}` | null {
  if (profile.kind !== 'multi_chain' || !profile.chains) return null;
  const eth = profile.chains.find((c) => c.chain === 'eth');
  return (eth?.address as `0x${string}`) ?? null;
}

export function getChainAddress(
  profile: WalletProfile,
  chain: 'xrpl' | 'eth' | 'bsc' | 'pol',
): string | null {
  if (chain === 'xrpl') return profile.address;
  if (profile.kind !== 'multi_chain' || !profile.chains) return null;
  const entry = profile.chains.find((c) => c.chain === chain);
  return entry?.address ?? null;
}

/** Backward-compat: используется некоторыми W3 hooks. */
export async function getProfile(): Promise<WalletProfile | null> {
  return getActiveAccount();
}

export function getCooldownRemainingMs(): number {
  return Math.max(0, cooldownUntil - Date.now());
}

// ───────── Crypto helpers ─────────

async function encryptSecret(secret: string, password: string): Promise<EncryptedBlob> {
  const [{ aesEncrypt }, { deriveKeyAsync }, { randomBytes, toBase64 }] = await Promise.all([
    import('../crypto/aes'),
    import('../crypto/kdf'),
    import('../crypto/random'),
  ]);
  const salt = randomBytes(16);
  const kdfParams = activeKdf();
  const key = await deriveKeyAsync(password, salt, kdfParams);
  try {
    const { ciphertext, nonce } = await aesEncrypt(key, secret);
    return {
      v: 1,
      cipher: 'AES-GCM-256',
      kdf: kdfParams,
      salt: toBase64(salt),
      nonce,
      ciphertext,
    };
  } finally {
    key.fill(0);
  }
}

async function decryptBlob(blob: EncryptedBlob, password: string): Promise<string> {
  const [{ aesDecrypt }, { deriveKeyAsync }, { fromBase64 }] = await Promise.all([
    import('../crypto/aes'),
    import('../crypto/kdf'),
    import('../crypto/random'),
  ]);
  const salt = fromBase64(blob.salt);
  const key = await deriveKeyAsync(password, salt, blob.kdf);
  try {
    return await aesDecrypt(key, { ciphertext: blob.ciphertext, nonce: blob.nonce });
  } finally {
    key.fill(0);
  }
}

interface BuiltProfile {
  profile: Omit<WalletProfile, 'encryptedBlob'>;
  /** Что мы шифруем в blob: для multi_chain — mnemonic, для imported_key — family seed. */
  blobMaterial: string;
  slot: UnlockedSlot;
}

async function buildProfileFromSecretMaterial(
  kind: 'seed_generated' | 'imported_seed' | 'imported_key',
  secretMaterial: string,
): Promise<BuiltProfile> {
  const keypairMod = await import('./keypair');
  const id = await nextId();
  const createdAt = new Date().toISOString();

  if (kind === 'imported_key') {
    const derived = keypairMod.deriveFromFamilySeed(secretMaterial);
    const profile: Omit<WalletProfile, 'encryptedBlob'> = {
      id,
      label: 'Main wallet',
      address: derived.address,
      publicKey: derived.publicKey,
      kind: 'imported_key',
      createdAt,
      activated: false,
    };
    return {
      profile,
      blobMaterial: derived.secret,
      slot: {
        address: derived.address,
        publicKey: derived.publicKey,
        secret: derived.secret,
      },
    };
  }

  // ADR-055: любая новая mnemonic-based запись = multi_chain.
  const { normalizePhrase } = await import('./seed');
  const mnemonic = normalizePhrase(secretMaterial);
  const xrpl = keypairMod.deriveFromMnemonic(mnemonic);
  const { deriveEvm } = await import('./hd');
  const evm = await deriveEvm(mnemonic);

  const profile: Omit<WalletProfile, 'encryptedBlob'> = {
    id,
    label: 'Main wallet',
    address: xrpl.address,
    publicKey: xrpl.publicKey,
    kind: 'multi_chain',
    createdAt,
    activated: false,
    chains: [
      { chain: 'xrpl', address: xrpl.address, publicKey: xrpl.publicKey },
      { chain: 'eth', address: evm.address, publicKey: evm.publicKey },
      { chain: 'bsc', address: evm.address, publicKey: evm.publicKey },
      { chain: 'pol', address: evm.address, publicKey: evm.publicKey },
    ],
  };
  return {
    profile,
    blobMaterial: mnemonic,
    slot: {
      address: xrpl.address,
      publicKey: xrpl.publicKey,
      secret: xrpl.secret,
      mnemonic,
      evm: {
        address: evm.address,
        privateKey: evm.privateKey,
        publicKey: evm.publicKey,
      },
    },
  };
}


// ───────── lock (lightweight, остаётся в core) ─────────

export function lock(): void {
  unlockedSlot.clear();
  notify();
}

// ───────── Mutations / Sub-accounts / Signing ─────────
//
// Перенесено в `vaultMutations.ts`, `vaultSubAccounts.ts` и `broadcast.ts` —
// эти модули импортируются только lazy‑роутами (Settings / Onboarding /
// ReviewPage), чтобы их код не попадал в main bundle.

