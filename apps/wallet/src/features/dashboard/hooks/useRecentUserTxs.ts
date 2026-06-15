import { useMemo } from 'react';
import type { Transaction, TxStatus } from '@rc/types';
import { useHistoryData } from '~/features/history/hooks/useHistoryData';
import type { HistoryTx, HistoryTxAmount } from '~/features/history/lib/types';

/**
 * Реальные транзакции для виджета "Последние транзакции" на Home.
 * Конвертирует HistoryTx (XRPL live + EVM live + user sends) в schema Transaction,
 * который ожидает widget.
 */
export function useRecentUserTxs(limit = 5): Transaction[] {
  const { txs } = useHistoryData();
  return useMemo(
    () => txs.slice(0, limit).map(toTransaction),
    [txs, limit],
  );
}

function toTransaction(t: HistoryTx): Transaction {
  return {
    id: t.id,
    accountId: 'self',
    subAccountId: null,
    network: 'xrpl',
    type: t.type === 'payment' ? 'payment' : t.type === 'staking_deposit' ? 'staking_deposit' : 'staking_payout',
    direction: t.direction,
    status: t.status as TxStatus,
    counterparty: t.counterparty,
    amount: toTransactionAmount(t.amount),
    fee: t.fee,
    memo: t.memo,
    ledgerIndex: t.ledgerIndex,
    txHash: t.txHash,
    createdAt: t.createdAt,
    completedAt: t.completedAt,
    failure: t.failure,
  };
}

function toTransactionAmount(a: HistoryTxAmount): Transaction['amount'] {
  if ('drops' in a) return { currency: 'XRP' as const, drops: a.drops, issuer: null };
  if ('raw' in a) {
    // EVM amount — конвертируем через formatDecimal в decimal-string.
    const value = formatRaw(a.raw, a.decimals);
    return { currency: a.currency, value, issuer: null };
  }
  return { currency: a.currency, value: a.value, issuer: a.issuer ?? null };
}

function formatRaw(raw: string, decimals: number): string {
  try {
    const v = BigInt(raw);
    if (v === 0n) return '0';
    const base = 10n ** BigInt(decimals);
    const whole = v / base;
    const remainder = v % base;
    if (remainder === 0n) return whole.toString();
    const frac = remainder.toString().padStart(decimals, '0').replace(/0+$/u, '');
    return `${whole}.${frac}`;
  } catch {
    return raw;
  }
}
