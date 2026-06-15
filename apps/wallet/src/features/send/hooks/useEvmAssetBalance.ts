import { useQuery } from '@tanstack/react-query';
import { getNativeBalance, getTokenBalance } from '~/lib/chains/balances';
import type { Asset } from '~/lib/chains/types';
import { isEvm } from '~/lib/chains/registry';

export interface UseEvmAssetBalanceResult {
  amountRaw: bigint | null;
  loading: boolean;
  error: boolean;
}

export function useEvmAssetBalance(
  asset: Asset,
  fromAddress: `0x${string}` | null,
): UseEvmAssetBalanceResult {
  const evm = isEvm(asset.chain);
  const enabled = Boolean(evm && fromAddress);
  const q = useQuery({
    queryKey: ['evm-asset-balance', asset.id, fromAddress],
    queryFn: async () => {
      if (!fromAddress || !evm) throw new Error('disabled');
      const chain = asset.chain as 'eth' | 'bsc' | 'pol';
      if (asset.kind === 'native') {
        return getNativeBalance(chain, fromAddress);
      }
      return getTokenBalance(chain, asset.address, fromAddress);
    },
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  return {
    amountRaw: q.data ?? null,
    loading: q.isLoading,
    error: q.isError,
  };
}
