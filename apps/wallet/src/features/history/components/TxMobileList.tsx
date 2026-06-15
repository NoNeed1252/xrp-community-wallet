import { MobileList } from '@rc/ui';
import { formatDateTime, maskAddress, truncateMiddle } from '@rc/types';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from '@rc/ui';
import type { HistoryTx } from '../lib/types';
import { TxAmount } from './TxAmount';
import { TxStatusBadge } from './TxStatusBadge';

interface Props {
  txs: HistoryTx[];
  onSelect: (tx: HistoryTx) => void;
}

export function TxMobileList({ txs, onSelect }: Props) {
  const { t } = useTranslation('history');
  return (
    <MobileList>
      {txs.map((tx) => (
        <button
          key={tx.id}
          type="button"
          onClick={() => onSelect(tx)}
          className="w-full text-left rounded-lg bg-nested p-4 flex flex-col gap-1.5 hover:bg-neutral-100 transition-colors"
        >
          <div className="flex items-center justify-between text-caption text-neutral-500">
            <span>{formatDateTime(tx.createdAt)}</span>
            <TxStatusBadge status={tx.status} />
          </div>
          <div className="text-body text-neutral-700 flex items-center gap-2">
            <span>{t(`filters.types.${tx.type}`)}</span>
            <span>·</span>
            <span className="truncate" title={tx.counterparty.label ?? tx.counterparty.address}>
              {tx.counterparty.label
                ? truncateMiddle(tx.counterparty.label, 22)
                : maskAddress(tx.counterparty.address, 6, 6)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <TxAmount tx={tx} />
            <ChevronRight className="h-4 w-4 text-neutral-400" aria-hidden />
          </div>
        </button>
      ))}
    </MobileList>
  );
}
