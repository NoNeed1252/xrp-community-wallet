import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import * as vault from '../vault';
import * as vm from '../vaultMutations';
import * as vsa from '../vaultSubAccounts';
import { generateSeedPhrase } from '../seed';

const PASSWORD = 'TestPwd-123-strong';

beforeAll(() => {
  // Минимальные параметры Argon2 для скорости тестов. Боевые — в DEFAULT_KDF.
  vault.__setKdfParamsForTesting({ name: 'argon2id', t: 1, m: 256, p: 1 });
});

async function freshDb() {
  // Полностью пересоздаём IndexedDB между тестами через новый IDBFactory.
  (globalThis as { indexedDB: IDBFactory }).indexedDB = new IDBFactory();
  vault.__internal.__forceResetDbPromise();
  vault.__internal.resetFailureCounter();
  vault.lock();
}

describe('vault — happy path', () => {
  beforeEach(async () => freshDb());

  it('starts empty', async () => {
    expect(await vault.getStatus()).toBe('empty');
    expect(await vault.getProfile()).toBeNull();
  });

  it('creates profile from generated seed and is unlocked immediately', async () => {
    const phrase = generateSeedPhrase();
    const profile = await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: phrase,
      password: PASSWORD,
    });
    expect(profile.address.startsWith('r')).toBe(true);
    expect(profile.activated).toBe(false);
    expect(await vault.getStatus()).toBe('unlocked');
  });

  it('lock then unlock with correct password restores access', async () => {
    const phrase = generateSeedPhrase();
    await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: phrase,
      password: PASSWORD,
    });
    vault.lock();
    expect(await vault.getStatus()).toBe('locked');
    await vm.unlock(PASSWORD);
    expect(await vault.getStatus()).toBe('unlocked');
  });

  it('reset removes profile', async () => {
    await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: generateSeedPhrase(),
      password: PASSWORD,
    });
    await vm.reset();
    expect(await vault.getStatus()).toBe('empty');
  });
});

describe('vault — wrong password / cooldown', () => {
  beforeEach(async () => freshDb());

  it('wrong password rejects and increments failure counter', async () => {
    await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: generateSeedPhrase(),
      password: PASSWORD,
    });
    vault.lock();
    await expect(vm.unlock('wrong')).rejects.toThrow();
    await expect(vm.unlock('wrong-again')).rejects.toThrow();
    expect(vault.getCooldownRemainingMs()).toBe(0); // no cooldown yet
  });

  it('after 5 failures triggers cooldown', async () => {
    await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: generateSeedPhrase(),
      password: PASSWORD,
    });
    vault.lock();
    for (let i = 0; i < 5; i++) {
      await expect(vm.unlock('wrong')).rejects.toThrow();
    }
    expect(vault.getCooldownRemainingMs()).toBeGreaterThan(0);
    await expect(vm.unlock(PASSWORD)).rejects.toThrow(/cooldown/);
  }, 60_000);
});

describe('vault v2 — multi-account', () => {
  beforeEach(async () => freshDb());

  it('createWallet seeds preferences with activeAccountId', async () => {
    const profile = await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: generateSeedPhrase(),
      password: PASSWORD,
    });
    const prefs = await vault.getPreferences();
    expect(prefs?.activeAccountId).toBe(profile.id);
    expect(prefs?.autoLockMinutes).toBe(15);
  });

  it('addAccount требует unlocked и создаёт второй профиль', async () => {
    await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: generateSeedPhrase(),
      password: PASSWORD,
    });
    const second = await vm.addAccount({
      kind: 'seed_generated',
      secretMaterial: generateSeedPhrase(),
      password: PASSWORD,
      label: 'Second',
    });
    const all = await vault.getProfiles();
    expect(all).toHaveLength(2);
    expect(second.label).toBe('Second');
  });

  it('addAccount отказывается на дубликат адреса', async () => {
    const phrase = generateSeedPhrase();
    await vm.createWallet({ kind: 'seed_generated', secretMaterial: phrase, password: PASSWORD });
    await expect(
      vm.addAccount({ kind: 'seed_generated', secretMaterial: phrase, password: PASSWORD }),
    ).rejects.toThrow();
  });

  it('renameAccount меняет label', async () => {
    const p = await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: generateSeedPhrase(),
      password: PASSWORD,
    });
    await vm.renameAccount(p.id, 'New name');
    const all = await vault.getProfiles();
    expect(all[0]?.label).toBe('New name');
  });

  it('deleteAccount: cannot delete last', async () => {
    const p = await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: generateSeedPhrase(),
      password: PASSWORD,
    });
    await expect(vm.deleteAccount(p.id)).rejects.toThrow(/last/);
  });

  it('deleteAccount: cannot delete active; switch first', async () => {
    const a = await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: generateSeedPhrase(),
      password: PASSWORD,
    });
    const b = await vm.addAccount({
      kind: 'seed_generated',
      secretMaterial: generateSeedPhrase(),
      password: PASSWORD,
    });
    await expect(vm.deleteAccount(a.id)).rejects.toThrow(/active/);
    await vm.setActiveAccount(b.id);
    await vm.deleteAccount(a.id);
    expect(await vault.getProfiles()).toHaveLength(1);
  });

  it('changePassword re-encrypts and old password стопает', async () => {
    await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: generateSeedPhrase(),
      password: PASSWORD,
    });
    await vm.changePassword(PASSWORD, 'NewPwd-456-strong');
    vault.lock();
    await expect(vm.unlock(PASSWORD)).rejects.toThrow();
    await expect(vm.unlock('NewPwd-456-strong')).resolves.toBeUndefined();
  });

  it('viewSeed возвращает mnemonic для multi_chain профиля', async () => {
    const phrase = generateSeedPhrase();
    await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: phrase,
      password: PASSWORD,
    });
    const material = await vm.viewSeed(PASSWORD);
    expect(material.split(' ')).toHaveLength(12);
    expect(material).toBe(phrase);
  });

  it('viewSeed бросает на неверный пароль', async () => {
    await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: generateSeedPhrase(),
      password: PASSWORD,
    });
    await expect(vm.viewSeed('wrong')).rejects.toThrow();
  });

  it('setActiveAccount переключает active', async () => {
    const a = await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: generateSeedPhrase(),
      password: PASSWORD,
    });
    const b = await vm.addAccount({
      kind: 'seed_generated',
      secretMaterial: generateSeedPhrase(),
      password: PASSWORD,
    });
    await vm.setActiveAccount(b.id);
    const active = await vault.getActiveAccount();
    expect(active?.id).toBe(b.id);
    // Возврат
    await vm.setActiveAccount(a.id);
    expect((await vault.getActiveAccount())?.id).toBe(a.id);
  });

  it('preferences patch persistence', async () => {
    await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: generateSeedPhrase(),
      password: PASSWORD,
    });
    await vm.setPreferences({ autoLockMinutes: 30, locale: 'es' });
    const prefs = await vault.getPreferences();
    expect(prefs?.autoLockMinutes).toBe(30);
    expect(prefs?.locale).toBe('es');
  });
});

describe('vault v2 — sub-accounts', () => {
  beforeEach(async () => freshDb());

  it('add/rename/delete sub-account', async () => {
    const p = await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: generateSeedPhrase(),
      password: PASSWORD,
    });
    const s = await vsa.addSubAccount(p.id, { label: 'Trading', destinationTag: 1001 });
    expect(s.label).toBe('Trading');
    expect((await vault.getSubAccounts(p.id))).toHaveLength(1);

    await vsa.renameSubAccount(s.id, 'Trading desk');
    expect((await vault.getSubAccounts(p.id))[0]?.label).toBe('Trading desk');

    await vsa.deleteSubAccount(s.id);
    expect(await vault.getSubAccounts(p.id)).toHaveLength(0);
  });

  it('rejects duplicate destinationTag', async () => {
    const p = await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: generateSeedPhrase(),
      password: PASSWORD,
    });
    await vsa.addSubAccount(p.id, { label: 'A', destinationTag: 1 });
    await expect(vsa.addSubAccount(p.id, { label: 'B', destinationTag: 1 })).rejects.toThrow();
  });

  it('rejects out-of-range destinationTag', async () => {
    const p = await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: generateSeedPhrase(),
      password: PASSWORD,
    });
    await expect(vsa.addSubAccount(p.id, { label: 'X', destinationTag: -1 })).rejects.toThrow();
    await expect(vsa.addSubAccount(p.id, { label: 'X', destinationTag: 4_294_967_296 })).rejects.toThrow();
  });
});

describe('vault — multi_chain (W10)', () => {
  beforeEach(async () => freshDb());

  it('seed_generated создаёт multi_chain профиль с XRPL + EVM адресами', async () => {
    const phrase = generateSeedPhrase();
    const profile = await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: phrase,
      password: PASSWORD,
    });
    expect(profile.kind).toBe('multi_chain');
    expect(profile.chains).toBeDefined();
    const chainIds = profile.chains!.map((c) => c.chain);
    expect(chainIds).toEqual(['xrpl', 'eth', 'bsc', 'pol']);
    const eth = profile.chains!.find((c) => c.chain === 'eth')!;
    expect(eth.address.startsWith('0x')).toBe(true);
    expect(eth.address).toHaveLength(42);
    // EVM-адрес одинаковый для всех EVM-цепей
    const bsc = profile.chains!.find((c) => c.chain === 'bsc')!;
    const pol = profile.chains!.find((c) => c.chain === 'pol')!;
    expect(bsc.address).toBe(eth.address);
    expect(pol.address).toBe(eth.address);
  });

  it('imported_key остаётся XRPL-only (ADR-055)', async () => {
    // Сначала создаём multi_chain seed чтобы получить валидный family seed.
    const phrase = generateSeedPhrase();
    const multi = await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: phrase,
      password: PASSWORD,
    });
    const familySeed = await vm.viewSeed(PASSWORD);
    // viewSeed для multi_chain возвращает mnemonic — нам нужен family seed.
    // Используем deriveFromMnemonic чтобы получить seed.
    const { deriveFromMnemonic } = await import('../keypair');
    const derived = deriveFromMnemonic(familySeed);
    await vm.deleteAccount; // no-op, just touch
    // Reset и заново create через imported_key
    await vm.reset();
    const imported = await vm.createWallet({
      kind: 'imported_key',
      secretMaterial: derived.secret,
      password: PASSWORD,
    });
    expect(imported.kind).toBe('imported_key');
    expect(imported.chains).toBeUndefined();
    expect(imported.address).toBe(multi.address);
  });

  it('unlock multi_chain профиля восстанавливает EVM-адрес', async () => {
    const phrase = generateSeedPhrase();
    const profile = await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: phrase,
      password: PASSWORD,
    });
    vault.lock();
    await vm.unlock(PASSWORD);
    expect(await vault.getStatus()).toBe('unlocked');
    // После unlock у multi_chain профиля должен появиться EVM-адрес.
    const evmAddr = vault.getEvmAddress(profile);
    expect(evmAddr).toMatch(/^0x[0-9a-fA-F]{40}$/u);
  });

  it('sendEvmTransaction отказывается для XRPL-only профиля', async () => {
    // Создаём imported_key (XRPL-only)
    const tmpPhrase = generateSeedPhrase();
    await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: tmpPhrase,
      password: PASSWORD,
    });
    const mnemonic = await vm.viewSeed(PASSWORD);
    const { deriveFromMnemonic } = await import('../keypair');
    const derived = deriveFromMnemonic(mnemonic);
    await vm.reset();
    await vm.createWallet({
      kind: 'imported_key',
      secretMaterial: derived.secret,
      password: PASSWORD,
    });
    const { sendEvmTransaction } = await import('../broadcast');
    await expect(
      sendEvmTransaction({
        chain: 'eth',
        to: '0x0000000000000000000000000000000000000001',
        value: 1n,
      }),
    ).rejects.toThrow(/EVM/);
  });

  it('getChainAddress / getEvmAddress', async () => {
    const phrase = generateSeedPhrase();
    const profile = await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: phrase,
      password: PASSWORD,
    });
    expect(vault.getEvmAddress(profile)).toMatch(/^0x[0-9a-fA-F]{40}$/u);
    expect(vault.getChainAddress(profile, 'xrpl')).toBe(profile.address);
    expect(vault.getChainAddress(profile, 'eth')).toBe(vault.getEvmAddress(profile));
  });
});

describe('vault — Ledger accounts', () => {
  beforeEach(async () => freshDb());

  const LEDGER_PK = 'ED' + '0'.repeat(64);
  const LEDGER_ADDR = 'rEXAMPLE111111111111111111111111111';

  it('addLedgerAccount требует existing seed vault (ADR-047)', async () => {
    // Пустой vault — никакого seed‑аккаунта не создано.
    await expect(
      vm.addLedgerAccount({
        publicKey: LEDGER_PK,
        address: LEDGER_ADDR,
        derivationPath: "44'/144'/0'/0/0",
      }),
    ).rejects.toThrow();
  });

  it('addLedgerAccount создаёт профиль kind=ledger_hardware без encryptedBlob', async () => {
    await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: generateSeedPhrase(),
      password: PASSWORD,
    });
    const ledger = await vm.addLedgerAccount({
      publicKey: LEDGER_PK,
      address: LEDGER_ADDR,
      derivationPath: "44'/144'/0'/0/0",
      label: 'Nano X',
    });
    expect(ledger.kind).toBe('ledger_hardware');
    expect(ledger.derivationPath).toBe("44'/144'/0'/0/0");
    expect(ledger.label).toBe('Nano X');
    // encryptedBlob отсутствует у Ledger‑профиля.
    expect((ledger as { encryptedBlob?: unknown }).encryptedBlob).toBeUndefined();
    const all = await vault.getProfiles();
    expect(all).toHaveLength(2);
  });

  it('addLedgerAccount отказывается на дубликат адреса', async () => {
    await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: generateSeedPhrase(),
      password: PASSWORD,
    });
    await vm.addLedgerAccount({
      publicKey: LEDGER_PK,
      address: LEDGER_ADDR,
      derivationPath: "44'/144'/0'/0/0",
    });
    await expect(
      vm.addLedgerAccount({
        publicKey: LEDGER_PK,
        address: LEDGER_ADDR,
        derivationPath: "44'/144'/0'/0/0",
      }),
    ).rejects.toThrow();
  });

  it('signPayment бросает для active Ledger‑профиля', async () => {
    await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: generateSeedPhrase(),
      password: PASSWORD,
    });
    const ledger = await vm.addLedgerAccount({
      publicKey: LEDGER_PK,
      address: LEDGER_ADDR,
      derivationPath: "44'/144'/0'/0/0",
    });
    await vm.setActiveAccount(ledger.id);
    const { signPayment } = await import('../broadcast');
    await expect(
      signPayment({
        destination: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
        amountDrops: '1000000',
        feeDrops: '12',
        sequence: 1,
        lastLedgerSequence: 80_000_000,
      }),
    ).rejects.toThrow(/ledger/i);
  });
});

describe('vault v2 — migration', () => {
  beforeEach(async () => freshDb());

  it('miграция v1 → v2 на boot идемпотентна', async () => {
    // Write v1-style entry directly
    const db = await (
      await import('idb')
    ).openDB('rc-wallet', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('vault')) db.createObjectStore('vault');
      },
    });
    const v1Profile = {
      id: 'old-id',
      label: 'Legacy',
      address: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
      publicKey: 'ED'.padEnd(66, '0'),
      kind: 'seed_generated' as const,
      createdAt: '2026-01-01T00:00:00Z',
      encryptedBlob: {
        v: 1 as const,
        cipher: 'AES-GCM-256' as const,
        kdf: { name: 'argon2id' as const, t: 1, m: 256, p: 1 },
        salt: 'AAAA',
        nonce: 'AAAA',
        ciphertext: 'AAAA',
      },
    };
    await db.put('vault', v1Profile, 'primary');
    db.close();

    vault.__internal.__forceResetDbPromise();
    const profiles = await vault.getProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0]?.id).toBe('old-id');
    const prefs = await vault.getPreferences();
    expect(prefs?.activeAccountId).toBe('old-id');
    // Идемпотентность
    const profiles2 = await vault.getProfiles();
    expect(profiles2).toHaveLength(1);
  });
});
