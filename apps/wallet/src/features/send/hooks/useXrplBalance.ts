import { useQuery } from '@tanstack/react-query';
import { fetchXrplAccountState, type XrplAccountState } from '~/lib/explorers/xrplAccount';

export interface UseXrplBalanceResult {
  /** Реальный баланс с цепи, если доступен; иначе null. */
  state: XrplAccountState | null;
  loading: boolean;
  error: boolean;
}

/**
 * Реальный баланс XRPL через public RPC.
 * Используется как primary-источник; mock useMockedAccountState остаётся
 * как fallback для случаев, когда сеть недоступна или адрес отсутствует.
 */
export function useXrplBalance(address: string | null): UseXrplBalanceResult {
  const q = useQuery({
    queryKey: ['xrpl-account', address],
    queryFn: () => (address ? fetchXrplAccountState(address) : Promise.resolve(null)),
    enabled: Boolean(address),
    staleTime: 20_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
  return {
    state: q.data ?? null,
    loading: q.isLoading,
    error: q.isError,
  };
}
