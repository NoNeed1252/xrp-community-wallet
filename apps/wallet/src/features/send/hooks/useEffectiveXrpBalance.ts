import { useMemo } from 'react';
import { useWalletProfile } from '~/lib/wallet/useWallet';
import { useXrplBalance } from './useXrplBalance';
import { useMockedAccountState, useRecentTxsForProfile } from './useMockedAccountState';

export interface EffectiveXrpBalance {
  /** Текущий показываемый баланс в drops (live минус pending user sends). */
  balanceDrops: string;
  /** Активирован ли аккаунт on-chain. */
  activated: boolean;
  /** OwnerCount × 200_000 drops (резерв за каждый owned object). */
  ownerReserveDrops: string;
  /** True пока идёт первый запрос live state. */
  loading: boolean;
  /** True если RPC недоступен и мы fallback'нулись на mock. */
  fallback: boolean;
}

/**
 * Унифицированный источник XRP баланса для UI.
 *
 * Логика:
 *  1. Запрашиваем live state у XRPL public RPC.
 *  2. balance = liveBalance − sum(pending user sends, ещё не подтверждённые сетью).
 *  3. Если RPC упал — fallback на чистый mock balance из useMockedAccountState
 *     (нужно для оффлайн-демо).
 *
 * activated приходит из live; profile.activated больше не считается источником истины.
 */
export function useEffectiveXrpBalance(): EffectiveXrpBalance {
  const { profile } = useWalletProfile();
  const address = profile?.address ?? null;
  const live = useXrplBalance(address);
  const mockBalance = useMockedAccountState((s) => s.balanceDrops);
  const recentTxs = useRecentTxsForProfile(profile?.id ?? null);

  return useMemo(() => {
    // Pending = недавние user-sends, которые ещё могли не попасть в validated ledger.
    const pendingDrops = recentTxs
      .filter((t) => t.status === 'pending')
      .reduce((acc, t) => acc + BigInt(t.amountDrops) + BigInt(t.feeDrops), 0n);

    if (live.state) {
      const remaining = BigInt(live.state.balanceDrops) - pendingDrops;
      return {
        balanceDrops: (remaining > 0n ? remaining : 0n).toString(),
        activated: live.state.activated,
        ownerReserveDrops: live.state.ownerReserveDrops,
        loading: false,
        fallback: false,
      };
    }
    return {
      balanceDrops: mockBalance,
      activated: false,
      ownerReserveDrops: '0',
      loading: live.loading,
      fallback: live.error,
    };
  }, [live.state, live.loading, live.error, mockBalance, recentTxs]);
}
