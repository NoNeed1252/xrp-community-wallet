import { dropsToXrp, formatCrypto } from '@rc/types';
import { cn } from '@rc/ui';
import type { HistoryTx, HistoryTxAmount } from '../lib/types';
import { formatDecimal } from '~/lib/chains/balances';

function isEvmAmount(a: HistoryTxAmount): a is Extract<HistoryTxAmount, { raw: string }> {
  return 'raw' in a;
}

function isXrpAmount(a: HistoryTxAmount): a is Extract<HistoryTxAmount, { drops: string }> {
  return 'drops' in a;
}

interface Props {
  tx: HistoryTx;
  className?: string;
}

export function TxAmount({ tx, className }: Props) {
  let rawValue: string;
  if (isXrpAmount(tx.amount)) {
    rawValue = dropsToXrp(tx.amount.drops);
  } else if (isEvmAmount(tx.amount)) {
    rawValue = formatDecimal(BigInt(tx.amount.raw), tx.amount.decimals, 6);
  } else {
    rawValue = tx.amount.value;
  }
  const symbol = tx.amount.currency;
  const formatted = formatCrypto(rawValue, symbol).value;
  const sign = tx.direction === 'incoming' ? '+' : '−';
  const colorCls = tx.direction === 'incoming' ? 'text-success-700' : 'text-neutral-900';
  return (
    <span className={cn('font-medium tabular-nums whitespace-nowrap', colorCls, className)}>
      {sign}
      {formatted} {symbol}
    </span>
  );
}
