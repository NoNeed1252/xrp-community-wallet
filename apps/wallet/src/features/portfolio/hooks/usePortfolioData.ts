import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dropsToXrp } from '@rc/types';
import { useEffectiveXrpBalance } from '~/features/send/hooks/useEffectiveXrpBalance';
import { fetchPrices } from '~/lib/chains/prices';
import { nativeIconUrl } from '~/lib/chains/assets/iconUrl';
import { computeUsdValue, type AssetHolding } from '../lib/compute';

export function usePortfolioData(): {
  xrp: AssetHolding;
} {
  const { balanceDrops } = useEffectiveXrpBalance();

  const priceQ = useQuery({
    queryKey: ['prices', 'ripple'],
    queryFn: () => fetchPrices(['ripple']),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  return useMemo(() => {
    const xrpPriceQuote = priceQ.data?.get('ripple');
    const xrpPrice = xrpPriceQuote ? xrpPriceQuote.usd.toString() : '0';
    const xrpChange = xrpPriceQuote?.change24h != null ? xrpPriceQuote.change24h.toString() : '0';
    const xrpBalanceFormatted = dropsToXrp(balanceDrops);

    const xrp: AssetHolding = {
      symbol: 'XRP',
      name: 'XRP',
      iconKey: 'xrp',
      iconUrl: nativeIconUrl('xrpl'),
      balanceRaw: balanceDrops,
      balance: xrpBalanceFormatted,
      priceUsd: xrpPrice,
      valueUsd: computeUsdValue(xrpBalanceFormatted, xrpPrice),
      change24hPct: xrpChange,
    };

    return { xrp };
  }, [balanceDrops, priceQ.data]);
}
