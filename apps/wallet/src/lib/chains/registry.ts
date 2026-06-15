import type { Asset, ChainId, ChainMeta, EvmChainId, NativeAsset, TokenAsset } from './types';
import { ERC20_TOKENS } from './tokens';

export type { Asset, ChainId, ChainMeta, EvmChainId, NativeAsset, TokenAsset };

export const NATIVE_XRP: NativeAsset = {
  kind: 'native',
  chain: 'xrpl',
  id: 'xrpl:xrp',
  symbol: 'XRP',
  name: 'XRP',
  decimals: 6,
  coingeckoId: 'ripple',
  iconPath: 'ripple/info/logo.png',
};

export const NATIVE_ETH: NativeAsset = {
  kind: 'native',
  chain: 'eth',
  id: 'eth:eth',
  symbol: 'ETH',
  name: 'Ether',
  decimals: 18,
  coingeckoId: 'ethereum',
  iconPath: 'ethereum/info/logo.png',
};

export const NATIVE_BNB: NativeAsset = {
  kind: 'native',
  chain: 'bsc',
  id: 'bsc:bnb',
  symbol: 'BNB',
  name: 'BNB',
  decimals: 18,
  coingeckoId: 'binancecoin',
  iconPath: 'smartchain/info/logo.png',
};

export const NATIVE_MATIC: NativeAsset = {
  kind: 'native',
  chain: 'pol',
  id: 'pol:matic',
  symbol: 'MATIC',
  name: 'Polygon',
  decimals: 18,
  coingeckoId: 'matic-network',
  iconPath: 'polygon/info/logo.png',
};

export const NATIVES: Readonly<Record<ChainId, NativeAsset>> = {
  xrpl: NATIVE_XRP,
  eth: NATIVE_ETH,
  bsc: NATIVE_BNB,
  pol: NATIVE_MATIC,
};

export const CHAINS: Readonly<Record<ChainId, ChainMeta>> = {
  xrpl: {
    id: 'xrpl',
    label: 'XRP Ledger',
    shortLabel: 'XRPL',
    addressPrefix: 'r',
    explorer: 'https://livenet.xrpl.org',
    native: NATIVE_XRP,
  },
  eth: {
    id: 'eth',
    label: 'Ethereum',
    shortLabel: 'ETH',
    addressPrefix: '0x',
    explorer: 'https://etherscan.io',
    native: NATIVE_ETH,
  },
  bsc: {
    id: 'bsc',
    label: 'BNB Smart Chain',
    shortLabel: 'BSC',
    addressPrefix: '0x',
    explorer: 'https://bscscan.com',
    native: NATIVE_BNB,
  },
  pol: {
    id: 'pol',
    label: 'Polygon',
    shortLabel: 'POL',
    addressPrefix: '0x',
    explorer: 'https://polygonscan.com',
    native: NATIVE_MATIC,
  },
};

export const EVM_CHAINS: readonly EvmChainId[] = ['eth', 'bsc', 'pol'];

export const ALL_ASSETS: readonly Asset[] = [
  ...Object.values(NATIVES),
  ...ERC20_TOKENS,
];

export function findAsset(id: string): Asset | undefined {
  return ALL_ASSETS.find((a) => a.id === id);
}

export function nativeOf(chain: ChainId): NativeAsset {
  return NATIVES[chain];
}

export function isEvm(chain: ChainId): chain is EvmChainId {
  return chain !== 'xrpl';
}

export function assetsByChain(chain: ChainId): readonly Asset[] {
  if (chain === 'xrpl') return [NATIVE_XRP];
  const tokens: readonly TokenAsset[] = ERC20_TOKENS.filter((t) => t.chain === chain);
  return [NATIVES[chain], ...tokens];
}
