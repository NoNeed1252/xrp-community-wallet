import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '../../../lib/api/client';

const KEYS = {
  me: ['me'] as const,
  position: ['staking', 'position'] as const,
  deposits: ['staking', 'deposits'] as const,
  withdrawals: ['staking', 'withdrawals'] as const,
  accruals: (from?: string, to?: string) => ['staking', 'accruals', from ?? '', to ?? ''] as const,
  policy: ['staking', 'policy'] as const,
  stats: ['staking', 'stats'] as const,
};

export function useMe() {
  const api = getApiClient();
  return useQuery({
    queryKey: KEYS.me,
    queryFn: async () => (await api.getMe()).data,
  });
}

export function useStakingPolicy() {
  const api = getApiClient();
  return useQuery({
    queryKey: KEYS.policy,
    queryFn: async () => (await api.getStakingPolicy()).data,
    staleTime: 60_000,
  });
}

export function useStakingStats() {
  const api = getApiClient();
  return useQuery({
    queryKey: KEYS.stats,
    queryFn: async () => (await api.getStakingStats()).data,
    staleTime: 60_000,
  });
}

export function useStakingDeposits() {
  const api = getApiClient();
  return useQuery({
    queryKey: KEYS.deposits,
    queryFn: async () => (await api.listDeposits()).data,
  });
}

export function useStakingWithdrawals() {
  const api = getApiClient();
  return useQuery({
    queryKey: KEYS.withdrawals,
    queryFn: async () => (await api.listWithdrawals()).data,
  });
}

export function useStakingAccruals(params: { from?: string; to?: string } = {}) {
  const api = getApiClient();
  return useQuery({
    queryKey: KEYS.accruals(params.from, params.to),
    queryFn: async () => (await api.listAccruals(params)).data,
  });
}

export function useCreateDepositIntent() {
  const api = getApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amountDrops: string) => (await api.createDepositIntent(amountDrops)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEYS.deposits });
      void qc.invalidateQueries({ queryKey: KEYS.me });
    },
  });
}

export function useCreateWithdrawalIntent() {
  const api = getApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { amountDrops: string; destinationAddress: string }) =>
      (await api.createWithdrawalIntent(input)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEYS.withdrawals });
      void qc.invalidateQueries({ queryKey: KEYS.me });
    },
  });
}

export const stakingQueryKeys = KEYS;
