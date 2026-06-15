import { useQuery } from '@tanstack/react-query';
import { fetchMarkets } from '~/lib/chains/prices';

export interface MarketAsset {
  symbol: string;
  name: string;
  iconKey: string;
  iconUrl?: string;
  priceUsd: string;
  change24hPct: string;
  marketCapUsd: string;
  marketCapUsdCompact: string;
  volume24hUsd: string;
  sparkline24h: number[];
}

function compactMarketCap(v: number): string {
  if (!Number.isFinite(v)) return '—';
  if (v >= 1e12) return `${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  return v.toFixed(0);
}

const FEATURED_IDS = ['ripple', 'bitcoin', 'ethereum', 'binancecoin', 'matic-network', 'tether', 'usd-coin', 'solana'];

export interface UseMarketDataResult {
  assets: MarketAsset[];
  loading: boolean;
  error: boolean;
}

export function useMarketData(): UseMarketDataResult {
  const live = useQuery({
    queryKey: ['markets', FEATURED_IDS.sort().join(',')],
    queryFn: () => fetchMarkets({ ids: FEATURED_IDS, perPage: 20, sparkline: true }),
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const assets: MarketAsset[] = (live.data ?? [])
    .filter((row) => typeof row.priceUsd === 'number' && Number.isFinite(row.priceUsd))
    .map((row) => ({
      symbol: row.symbol,
      name: row.name,
      iconKey: row.symbol.toLowerCase(),
      iconUrl: row.image,
      priceUsd: row.priceUsd.toString(),
      change24hPct: (row.change24h ?? 0).toFixed(2),
      marketCapUsd: (row.marketCap ?? 0).toString(),
      marketCapUsdCompact: compactMarketCap(row.marketCap ?? 0),
      volume24hUsd: '0',
      sparkline24h: (row.sparkline ?? []).slice(-24) as number[],
    }));

  return {
    assets,
    loading: live.isLoading,
    error: live.isError,
  };
}
