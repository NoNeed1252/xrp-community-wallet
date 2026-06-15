import type { HistoryTx, TxStatus, TxType } from './types';

export type StatusFilter = 'all' | TxStatus;
export type PeriodFilter = 'today' | '7d' | '30d' | 'all';

export interface TxFilters {
  types: Set<TxType>;
  status: StatusFilter;
  period: PeriodFilter;
  search: string;
}

export function emptyFilters(): TxFilters {
  return {
    types: new Set<TxType>(['payment', 'staking_deposit', 'staking_payout']),
    status: 'all',
    period: 'all',
    search: '',
  };
}

export function matchesType(tx: HistoryTx, types: Set<TxType>): boolean {
  return types.has(tx.type);
}

export function matchesStatus(tx: HistoryTx, status: StatusFilter): boolean {
  return status === 'all' || tx.status === status;
}

export function matchesPeriod(tx: HistoryTx, period: PeriodFilter, now = new Date()): boolean {
  if (period === 'all') return true;
  const created = new Date(tx.createdAt).getTime();
  const nowMs = now.getTime();
  let cutoff: number;
  if (period === 'today') {
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    cutoff = startOfDay.getTime();
  } else if (period === '7d') {
    cutoff = nowMs - 7 * 24 * 60 * 60 * 1000;
  } else {
    cutoff = nowMs - 30 * 24 * 60 * 60 * 1000;
  }
  return created >= cutoff;
}

export function matchesSearch(tx: HistoryTx, query: string): boolean {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    tx.counterparty.address,
    tx.counterparty.label ?? '',
    tx.memo ?? '',
    tx.txHash,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

export function applyFilters(txs: HistoryTx[], filters: TxFilters, now?: Date): HistoryTx[] {
  return txs.filter(
    (tx) =>
      matchesType(tx, filters.types) &&
      matchesStatus(tx, filters.status) &&
      matchesPeriod(tx, filters.period, now) &&
      matchesSearch(tx, filters.search),
  );
}

export function isDefaultFilters(filters: TxFilters): boolean {
  return (
    filters.types.size === 3 &&
    filters.status === 'all' &&
    filters.period === 'all' &&
    filters.search.length === 0
  );
}
