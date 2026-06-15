import { beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import {
  __internal,
  addCustomToken,
  customTokenToAsset,
  getCustomTokens,
  removeCustomToken,
  tokenIdOf,
} from '../customTokensStore';

beforeEach(async () => {
  (globalThis as { indexedDB: IDBFactory }).indexedDB = new IDBFactory();
  __internal.resetDbForTesting();
});

const SAMPLE = {
  chain: 'eth' as const,
  symbol: 'WETH',
  name: 'Wrapped Ether',
  decimals: 18,
  address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as `0x${string}`,
};

describe('customTokensStore', () => {
  it('empty store returns []', async () => {
    expect(await getCustomTokens()).toEqual([]);
  });

  it('addCustomToken persists и assigns id + addedAt', async () => {
    const t = await addCustomToken(SAMPLE);
    expect(t.id).toBe(tokenIdOf('eth', SAMPLE.address));
    expect(t.addedAt).toMatch(/T/u);
    const list = await getCustomTokens();
    expect(list).toHaveLength(1);
    expect(list[0]?.symbol).toBe('WETH');
  });

  it('id case-insensitive (lowercase address)', () => {
    expect(tokenIdOf('eth', SAMPLE.address)).toBe(
      `eth:${SAMPLE.address.toLowerCase()}`,
    );
  });

  it('addCustomToken отвергает дубликат', async () => {
    await addCustomToken(SAMPLE);
    await expect(addCustomToken(SAMPLE)).rejects.toThrow(/already added/u);
  });

  it('тот же address на другой цепи допустим', async () => {
    await addCustomToken(SAMPLE);
    await addCustomToken({ ...SAMPLE, chain: 'bsc' });
    expect(await getCustomTokens()).toHaveLength(2);
  });

  it('removeCustomToken удаляет по id', async () => {
    const t = await addCustomToken(SAMPLE);
    await removeCustomToken(t.id);
    expect(await getCustomTokens()).toEqual([]);
  });

  it('removeCustomToken идемпотентен на отсутствующий id', async () => {
    await removeCustomToken('eth:0xfake');
    expect(await getCustomTokens()).toEqual([]);
  });

  it('customTokenToAsset собирает TokenAsset', async () => {
    const t = await addCustomToken(SAMPLE);
    const a = customTokenToAsset(t);
    expect(a.kind).toBe('token');
    expect(a.chain).toBe('eth');
    expect(a.symbol).toBe('WETH');
    expect(a.decimals).toBe(18);
    expect(a.address).toBe(SAMPLE.address);
    expect(a.coingeckoId).toBe('');
  });
});
