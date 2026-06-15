import { create } from 'zustand';

interface SentTx {
  txHash: string;
  toAddress: string;
  amountDrops: string;
  feeDrops: string;
  memo?: string;
  destinationTag?: number;
  createdAt: string;
  status: 'pending' | 'completed' | 'failed';
}

interface MockedAccountState {
  /** Mock balance fallback (использовался до live XRPL). Скоро удалится; пока 0. */
  balanceDrops: string;
  /** Per-profile recent sends: profileId → tx[]. */
  recentTxsByProfile: Record<string, SentTx[]>;
  /** Per-profile recent recipients для first-time banner. */
  recentRecipientsByProfile: Record<string, Set<string>>;

  applySend(
    profileId: string,
    input: {
      toAddress: string;
      amountDrops: string;
      feeDrops: string;
      memo?: string;
      destinationTag?: number;
      txHash: string;
    },
  ): void;

  reset(): void;
}

const DEFAULT_BALANCE_DROPS = '0';

export const useMockedAccountState = create<MockedAccountState>((set) => ({
  balanceDrops: DEFAULT_BALANCE_DROPS,
  recentTxsByProfile: {},
  recentRecipientsByProfile: {},
  applySend: (profileId, input) => {
    set((s) => {
      const tx: SentTx = {
        txHash: input.txHash,
        toAddress: input.toAddress,
        amountDrops: input.amountDrops,
        feeDrops: input.feeDrops,
        memo: input.memo,
        destinationTag: input.destinationTag,
        createdAt: new Date().toISOString(),
        // Только отправленная tx ещё не подтверждена в validated ledger.
        // `useEffectiveXrpBalance` опирается на это, чтобы скрытно вычесть
        // pending-сумму из «Available» (security audit M8).
        status: 'pending',
      };
      const prevTxs = s.recentTxsByProfile[profileId] ?? [];
      const prevRecipients = s.recentRecipientsByProfile[profileId] ?? new Set();
      const nextRecipients = new Set(prevRecipients);
      nextRecipients.add(input.toAddress);
      return {
        recentTxsByProfile: {
          ...s.recentTxsByProfile,
          [profileId]: [tx, ...prevTxs].slice(0, 20),
        },
        recentRecipientsByProfile: {
          ...s.recentRecipientsByProfile,
          [profileId]: nextRecipients,
        },
      };
    });
    // Через ~30 секунд (типичное окно подтверждения XRPL) переключаем tx
    // на `completed`. Это упрощение — реальный confirm-poll отложен.
    if (typeof setTimeout !== 'undefined') {
      setTimeout(() => {
        useMockedAccountState.setState((s) => {
          const list = s.recentTxsByProfile[profileId];
          if (!list) return s;
          const next = list.map((t) =>
            t.txHash === input.txHash ? { ...t, status: 'completed' as const } : t,
          );
          return {
            ...s,
            recentTxsByProfile: { ...s.recentTxsByProfile, [profileId]: next },
          };
        });
      }, 30_000);
    }
  },
  reset: () =>
    set({
      balanceDrops: DEFAULT_BALANCE_DROPS,
      recentTxsByProfile: {},
      recentRecipientsByProfile: {},
    }),
}));

// Стабильные пустые ссылки — иначе селектор возвращает новые [] / new Set() на каждом
// рендере, что превращается в бесконечный цикл setState ↔ subscribe.
const EMPTY_TXS: SentTx[] = [];
const EMPTY_RECIPIENTS: Set<string> = new Set();

/** Hook: список tx активного профиля. */
export function useRecentTxsForProfile(profileId: string | null): SentTx[] {
  return useMockedAccountState((s) => {
    if (!profileId) return EMPTY_TXS;
    return s.recentTxsByProfile[profileId] ?? EMPTY_TXS;
  });
}

/** Hook: set адресов получателей активного профиля. */
export function useRecentRecipientsForProfile(profileId: string | null): Set<string> {
  return useMockedAccountState((s) => {
    if (!profileId) return EMPTY_RECIPIENTS;
    return s.recentRecipientsByProfile[profileId] ?? EMPTY_RECIPIENTS;
  });
}
