export type ChainId = 'xrpl' | 'eth' | 'bsc' | 'pol';

export type EvmChainId = Exclude<ChainId, 'xrpl'>;

export interface NativeAsset {
  readonly kind: 'native';
  readonly chain: ChainId;
  readonly id: string;
  readonly symbol: string;
  readonly name: string;
  readonly decimals: number;
  readonly coingeckoId: string;
  readonly iconPath: string;
}

export interface TokenAsset {
  readonly kind: 'token';
  readonly chain: EvmChainId;
  readonly id: string;
  readonly symbol: string;
  readonly name: string;
  readonly decimals: number;
  readonly address: `0x${string}`;
  readonly coingeckoId: string;
}

export type Asset = NativeAsset | TokenAsset;

export type AssetId = Asset['id'];

export interface ChainMeta {
  readonly id: ChainId;
  readonly label: string;
  readonly shortLabel: string;
  readonly addressPrefix: string;
  readonly explorer: string | null;
  readonly native: NativeAsset;
}

export interface AssetBalance {
  readonly assetId: AssetId;
  readonly chain: ChainId;
  readonly amount: bigint;
  readonly decimals: number;
}

export interface AssetBalanceDecimal extends AssetBalance {
  readonly amountDecimal: string;
}

export interface PriceQuote {
  readonly coingeckoId: string;
  readonly usd: number;
  readonly change24h: number | null;
  readonly fetchedAt: number;
}

export type MarketRow = {
  readonly id: string;
  readonly symbol: string;
  readonly name: string;
  readonly image: string;
  readonly priceUsd: number;
  readonly change24h: number | null;
  readonly marketCap: number | null;
  readonly sparkline: readonly number[];
};
