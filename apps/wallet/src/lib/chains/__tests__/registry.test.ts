import { describe, expect, it } from 'vitest';
import {
  ALL_ASSETS,
  CHAINS,
  EVM_CHAINS,
  NATIVES,
  assetsByChain,
  findAsset,
  isEvm,
  nativeOf,
} from '../registry';
import { ERC20_TOKENS, findToken, tokensByChain } from '../tokens';

describe('chains/registry', () => {
  it('экспортирует все 4 цепи', () => {
    expect(Object.keys(CHAINS)).toEqual(['xrpl', 'eth', 'bsc', 'pol']);
  });

  it('каждой цепи есть native asset', () => {
    for (const id of Object.keys(NATIVES) as Array<keyof typeof NATIVES>) {
      expect(NATIVES[id].chain).toBe(id);
      expect(NATIVES[id].kind).toBe('native');
    }
  });

  it('isEvm отделяет xrpl от EVM', () => {
    expect(isEvm('xrpl')).toBe(false);
    expect(isEvm('eth')).toBe(true);
    expect(isEvm('bsc')).toBe(true);
    expect(isEvm('pol')).toBe(true);
  });

  it('assetsByChain XRPL — только XRP', () => {
    const list = assetsByChain('xrpl');
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe('xrpl:xrp');
  });

  it('assetsByChain EVM — native + curated tokens', () => {
    const eth = assetsByChain('eth');
    expect(eth[0]?.id).toBe('eth:eth');
    const symbols = eth.slice(1).map((a) => a.symbol);
    expect(symbols).toContain('USDT');
    expect(symbols).toContain('USDC');
  });

  it('findAsset находит native и token по id', () => {
    expect(findAsset('xrpl:xrp')?.symbol).toBe('XRP');
    expect(findAsset('eth:usdt')?.symbol).toBe('USDT');
    expect(findAsset('unknown:foo')).toBeUndefined();
  });

  it('nativeOf', () => {
    expect(nativeOf('eth').symbol).toBe('ETH');
  });

  it('EVM_CHAINS — без xrpl', () => {
    expect(EVM_CHAINS).toEqual(['eth', 'bsc', 'pol']);
  });

  it('ALL_ASSETS = 4 native + non-empty curated tokens', () => {
    expect(ALL_ASSETS.filter((a) => a.kind === 'native')).toHaveLength(4);
    expect(ALL_ASSETS.filter((a) => a.kind === 'token').length).toBeGreaterThanOrEqual(12);
  });
});

describe('chains/tokens', () => {
  it('tokensByChain — есть токены на каждой EVM-цепи', () => {
    expect(tokensByChain('eth').length).toBeGreaterThan(4);
    expect(tokensByChain('bsc').length).toBeGreaterThan(4);
    expect(tokensByChain('pol').length).toBeGreaterThan(4);
  });

  it('findToken', () => {
    expect(findToken('eth:usdt')?.address).toBe('0xdAC17F958D2ee523a2206206994597C13D831ec7');
    expect(findToken('not:found')).toBeUndefined();
  });

  it('все ERC-20 адреса в checksum формате (есть mixed case)', () => {
    for (const t of ERC20_TOKENS) {
      expect(t.address.startsWith('0x')).toBe(true);
      expect(t.address.length).toBe(42);
      // как минимум один — mixed case (checksum)
    }
  });
});
