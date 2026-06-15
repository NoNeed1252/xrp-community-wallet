import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import * as vault from '~/lib/wallet/vault';
import * as vm from '~/lib/wallet/vaultMutations';
import * as broadcast from '~/lib/wallet/broadcast';
import { generateSeedPhrase } from '~/lib/wallet/seed';

const PASSWORD = 'TestPwd-123-strong';

async function freshDb() {
  (globalThis as { indexedDB: IDBFactory }).indexedDB = new IDBFactory();
  vault.__internal.__forceResetDbPromise();
  vault.__internal.resetFailureCounter();
  vault.lock();
}

const SAMPLE_INPUT = {
  destination: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
  amountDrops: '1000000',
  feeDrops: '12',
  sequence: 100,
  lastLedgerSequence: 80_000_000,
};

describe('signPayment (real XRPL signing)', () => {
  beforeEach(async () => {
    vault.__setKdfParamsForTesting({ name: 'argon2id', t: 1, m: 256, p: 1 });
    await freshDb();
  });

  it('бросает если vault locked', async () => {
    await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: generateSeedPhrase(),
      password: PASSWORD,
    });
    vault.lock();
    await expect(broadcast.signPayment(SAMPLE_INPUT)).rejects.toThrow(/locked/);
  });

  it('подписывает и возвращает tx_blob + hash', async () => {
    await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: generateSeedPhrase(),
      password: PASSWORD,
    });
    const result = await broadcast.signPayment(SAMPLE_INPUT);
    expect(result.txHex).toMatch(/^[0-9A-F]+$/u);
    expect(result.txHash).toMatch(/^[0-9A-F]{64}$/u);
    expect(result.txHex.length).toBeGreaterThan(100);
  });

  it('требует sequence + lastLedgerSequence', async () => {
    await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: generateSeedPhrase(),
      password: PASSWORD,
    });
    await expect(
      broadcast.signPayment({
        destination: SAMPLE_INPUT.destination,
        amountDrops: SAMPLE_INPUT.amountDrops,
        feeDrops: SAMPLE_INPUT.feeDrops,
      }),
    ).rejects.toThrow(/sequence/);
  });

  it('детерминирован — два одинаковых input дают одинаковый hash', async () => {
    await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: generateSeedPhrase(),
      password: PASSWORD,
    });
    const a = await broadcast.signPayment(SAMPLE_INPUT);
    const b = await broadcast.signPayment(SAMPLE_INPUT);
    expect(a.txHash).toBe(b.txHash);
  });

  it('не утекает секретный материал в результат', async () => {
    const phrase = generateSeedPhrase();
    await vm.createWallet({
      kind: 'seed_generated',
      secretMaterial: phrase,
      password: PASSWORD,
    });
    const result = await broadcast.signPayment(SAMPLE_INPUT);
    const seed = await vm.viewSeed(PASSWORD);
    expect(result.txHex.toLowerCase()).not.toContain(seed.toLowerCase());
    expect(result.txHex.toLowerCase()).not.toContain(phrase.toLowerCase());
  });
});
