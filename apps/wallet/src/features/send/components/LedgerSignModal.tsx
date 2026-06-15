import { Modal, Spinner } from '@rc/ui';
import { useTranslation } from 'react-i18next';
import { dropsToXrp, formatCrypto, maskAddress } from '@rc/types';
import type { XrplSendDraft } from '../hooks/useSendDraft';

interface Props {
  open: boolean;
  draft: XrplSendDraft;
}

export function LedgerSignModal({ open, draft }: Props) {
  const { t } = useTranslation('ledger');
  return (
    <Modal open={open} onOpenChange={() => {}} title={t('sign.title')} size="md">
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          <Spinner size={24} />
        </div>
        <div className="flex-1">
          <p className="text-body text-neutral-700">{t('sign.body')}</p>
          <dl className="mt-4 grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 text-body">
            <dt className="text-neutral-500">{t('sign.fields.to')}</dt>
            <dd className="font-mono text-neutral-900 break-all">{maskAddress(draft.recipient, 6, 6)}</dd>
            <dt className="text-neutral-500">{t('sign.fields.amount')}</dt>
            <dd className="text-neutral-900 font-medium">
              {formatCrypto(dropsToXrp(draft.amountDrops), 'XRP').value} XRP
            </dd>
            <dt className="text-neutral-500">{t('sign.fields.fee')}</dt>
            <dd className="text-neutral-900">
              {formatCrypto(dropsToXrp(draft.feeDrops), 'XRP').value} XRP
            </dd>
            {draft.destinationTag !== undefined && (
              <>
                <dt className="text-neutral-500">{t('sign.fields.memo')}</dt>
                <dd className="font-mono text-neutral-900">{draft.destinationTag}</dd>
              </>
            )}
          </dl>
        </div>
      </div>
    </Modal>
  );
}
