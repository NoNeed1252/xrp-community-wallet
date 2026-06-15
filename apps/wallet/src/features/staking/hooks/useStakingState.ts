import { create } from 'zustand';

export type StakingStatus = 'active' | 'pending' | 'withdrawing' | 'closed';

export interface StakingPosition {
  id: string;
  depositDrops: string;
  openedAt: string;
  status: StakingStatus;
}

interface StakingState {
  positions: StakingPosition[];
  open(input: { depositDrops: string }): StakingPosition;
  close(id: string): void;
}

function randomId(): string {
  return `stk_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export const useStakingState = create<StakingState>((set, get) => ({
  positions: [],
  open: (input) => {
    const pos: StakingPosition = {
      id: randomId(),
      depositDrops: input.depositDrops,
      openedAt: new Date().toISOString(),
      status: 'pending',
    };
    set((s) => ({ positions: [pos, ...s.positions] }));
    // Через короткий timeout помечаем как active (имитация подтверждения сети).
    window.setTimeout(() => {
      set((s) => ({
        positions: s.positions.map((p) =>
          p.id === pos.id ? { ...p, status: 'active' as const } : p,
        ),
      }));
    }, 4_000);
    return pos;
  },
  close: (id) => set((s) => ({ positions: s.positions.filter((p) => p.id !== id) })),
}));

export const POOL_APR_PCT = 5.2;
export const POOL_PAYOUT_FREQ_DAYS = 30;
export const POOL_MIN_DEPOSIT_DROPS = '10000000'; // 10 XRP
export const POOL_ADDRESS = 'rPoo1Staking4F7v3T2cQ1bD8s5Wm6Zu';
export const POOL_DEST_TAG = 7777;

/** Накопленный доход позиции: deposit × APR/365 × days_open. */
export function computeRewardsDrops(p: StakingPosition, now = Date.now()): string {
  if (p.status !== 'active') return '0';
  const opened = new Date(p.openedAt).getTime();
  if (!Number.isFinite(opened)) return '0';
  const days = Math.max(0, (now - opened) / 86_400_000);
  const deposit = Number(p.depositDrops);
  if (!Number.isFinite(deposit) || deposit === 0) return '0';
  const accrued = deposit * (POOL_APR_PCT / 100) * (days / 365);
  return Math.floor(accrued).toString();
}

export function sumDrops(values: string[]): string {
  let total = 0n;
  for (const v of values) {
    try {
      total += BigInt(v);
    } catch {
      // ignore
    }
  }
  return total.toString();
}
