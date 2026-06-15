import { Table, Td, Th, Tr } from '@rc/ui';
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

export function TxTable({ txs, onSelect }: Props) {
  const { t } = useTranslation('history');
  return (
    <Table className="table-fixed">
      <colgroup>
        <col className="w-[120px]" />
        <col className="w-[140px]" />
        <col />
        <col className="w-[180px]" />
        <col className="w-[120px]" />
        <col className="w-[40px]" />
      </colgroup>
      <thead>
        <Tr>
          <Th>{t('list.columns.date')}</Th>
          <Th>{t('list.columns.type')}</Th>
          <Th>{t('list.columns.counterparty')}</Th>
          <Th align="right">{t('list.columns.amount')}</Th>
          <Th>{t('list.columns.status')}</Th>
          <Th>
            <span className="sr-only">{t('list.columns.actions')}</span>
          </Th>
        </Tr>
      </thead>
      <tbody>
        {txs.map((tx) => (
          <Tr
            key={tx.id}
            className="cursor-pointer hover:bg-neutral-50"
            onClick={() => onSelect(tx)}
          >
            <Td className="text-neutral-500">{formatDateTime(tx.createdAt)}</Td>
            <Td className="text-neutral-700">{t(`filters.types.${tx.type}`)}</Td>
            <Td>
              <div className="truncate" title={tx.counterparty.label ?? tx.counterparty.address}>
                {tx.counterparty.label ? truncateMiddle(tx.counterparty.label, 30) : maskAddress(tx.counterparty.address, 6, 6)}
              </div>
            </Td>
            <Td align="right">
              <TxAmount tx={tx} />
            </Td>
            <Td>
              <TxStatusBadge status={tx.status} />
            </Td>
            <Td align="right" className="text-neutral-400">
              <ChevronRight className="h-4 w-4 inline" aria-hidden />
            </Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}
