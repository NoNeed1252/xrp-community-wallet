import { useQuery } from '@tanstack/react-query';
import { fetchBalances, formatDecimal } from '~/lib/chains/balances';
import { fetchPrices } from '~/lib/chains/prices';
import { EVM_CHAINS, NATIVES } from '~/lib/chains/registry';
import { useAllAssets, useAllEvmTokens } from '~/lib/chains/useAllAssets';
import type { Asset } from '~/lib/chains/types';
import { useWalletProfile } from '~/lib/wallet/useWallet';

export interface EvmHolding {
  asset: Asset;
  amountRaw: bigint;
  amountHuman: string;
  priceUsd: number | null;
  valueUsd: number;
  change24h: number | null;
}

export interface UseEvmAssetsResult {
  holdings: EvmHolding[];
  loading: boolean;
  error: boolean;
}

export function useEvmAssets(): UseEvmAssetsResult {
  const { profile } = useWalletProfile();
  const allAssets = useAllAssets();
  const allTokens = useAllEvmTokens();
  const evmEntries =
    profile?.kind === 'multi_chain'
      ? (profile.chains ?? [])
          .filter((c) => EVM_CHAINS.includes(c.chain as (typeof EVM_CHAINS)[number]))
          .map((c) => ({ chain: c.chain as (typeof EVM_CHAINS)[number], address: c.address }))
      : [];

  const balanceKey = evmEntries.map((e) => `${e.chain}:${e.address}`).join('|');
  const customTokensKey = allTokens.map((t) => t.id).join('|');

  const balancesQ = useQuery({
    queryKey: ['evm-balances', balanceKey, customTokensKey],
    queryFn: () =>
      fetchBalances({
        chains: evmEntries,
        includeTokens: true,
        extraTokens: allTokens,
      }),
    enabled: evmEntries.length > 0,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const priceIds = allAssets.map((a) => a.coingeckoId).filter((id) => id.length > 0);
  const pricesQ = useQuery({
    queryKey: ['prices', priceIds.sort().join(',')],
    queryFn: () => fetchPrices(priceIds),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const balances = balancesQ.data;
  const prices = pricesQ.data;
  const holdings: EvmHolding[] = [];

  if (balances) {
    for (const asset of allAssets) {
      if (asset.chain === 'xrpl') continue;
      const b = balances.get(asset.id);
      const amountRaw = b?.amount ?? 0n;
      // Native всегда показываем; ERC-20 (curated + custom) — только если > 0.
      if (asset.kind === 'token' && amountRaw === 0n) continue;
      const priceUsd = asset.coingeckoId ? prices?.get(asset.coingeckoId)?.usd ?? null : null;
      const change24h = asset.coingeckoId ? prices?.get(asset.coingeckoId)?.change24h ?? null : null;
      const amountHuman = formatDecimal(amountRaw, asset.decimals);
      const valueUsd = priceUsd !== null ? Number(amountHuman) * priceUsd : 0;
      holdings.push({
        asset,
        amountRaw,
        amountHuman,
        priceUsd,
        valueUsd,
        change24h,
      });
    }
  } else if (evmEntries.length > 0) {
    for (const chain of EVM_CHAINS) {
      const asset = NATIVES[chain];
      holdings.push({
        asset,
        amountRaw: 0n,
        amountHuman: '0',
        priceUsd: null,
        valueUsd: 0,
        change24h: null,
      });
    }
  }

  return {
    holdings,
    loading: balancesQ.isLoading || pricesQ.isLoading,
    error: balancesQ.isError && evmEntries.length > 0,
  };
}
