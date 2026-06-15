import type { Asset, ChainId } from '../types';

const TW_BASE = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains';

const TW_CHAIN_SLUG: Readonly<Record<ChainId, string>> = {
  xrpl: 'ripple',
  eth: 'ethereum',
  bsc: 'smartchain',
  pol: 'polygon',
};

export function nativeIconUrl(chain: ChainId): string {
  return `${TW_BASE}/${TW_CHAIN_SLUG[chain]}/info/logo.png`;
}

export function tokenIconUrl(chain: 'eth' | 'bsc' | 'pol', checksumAddress: string): string {
  return `${TW_BASE}/${TW_CHAIN_SLUG[chain]}/assets/${checksumAddress}/logo.png`;
}

export function assetIconUrl(asset: Asset): string {
  if (asset.kind === 'native') return nativeIconUrl(asset.chain);
  return tokenIconUrl(asset.chain, asset.address);
}
