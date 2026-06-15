import { useTranslation } from 'react-i18next';
import { CheckCircle2, Copy, ExternalLink, XCircle } from '@rc/ui';
import { Button, Modal, Spinner, toast, useCopyToClipboard } from '@rc/ui';

export type SendPhase = 'idle' | 'signing' | 'broadcasting' | 'success' | 'failure';

interface StatusModalProps {
  open: boolean;
  phase: SendPhase;
  recipient: string;
  /** Готовая строка с суммой и тикером ("5.00 XRP", "0.5 ETH"). */
  amountLabel: string;
  txHash: string | null;
  /** Optional URL обозревателя для tx. */
  explorerUrl?: string | null;
  errorMsg: string | null;
  onClose(): void;
  onRetry(): void;
}

export function StatusModal({
  open,
  phase,
  recipient,
  amountLabel,
  txHash,
  explorerUrl,
  errorMsg,
  onClose,
  onRetry,
}: StatusModalProps) {
  const { t } = useTranslation('send');
  const { copy } = useCopyToClipboard();
  const isWorking = phase === 'signing' || phase === 'broadcasting';
  const isSuccess = phase === 'success';
  const isFailure = phase === 'failure';

  const title = isWorking
    ? t('sign.title')
    : isSuccess
    ? t('status.success.title')
    : t('status.failure.title');

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!o && !isWorking) onClose();
      }}
      size="md"
      title={title}
    >
      <div className="flex flex-col gap-5 py-2 min-h-[220px]">
        {isWorking && (
          <div className="flex flex-col items-center justify-center gap-3 flex-1">
            <Spinner size={32} />
            <p className="text-body text-neutral-700 text-center">
              {phase === 'signing' ? t('sign.body') : t('sign.broadcasting')}
            </p>
          </div>
        )}
        {isSuccess && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col items-center text-center gap-3">
              <span
                className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success-100 text-success-700"
                aria-hidden="true"
              >
                <CheckCircle2 className="h-9 w-9" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="text-h3 text-neutral-900">{amountLabel}</h3>
                <p className="text-caption text-neutral-500">
                  {t('status.success.toRecipient', { recipient })}
                </p>
              </div>
            </div>
            {txHash && (
              <div className="rounded-lg bg-nested px-3 py-2.5">
                <div className="text-caption text-neutral-500 mb-1">{t('status.success.txid')}</div>
                <div className="flex items-center gap-2">
                  <code className="text-caption font-mono text-neutral-900 break-all flex-1 min-w-0">
                    {txHash}
                  </code>
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await copy(txHash);
                      if (ok) toast.success(t('status.success.copied'));
                    }}
                    aria-label={t('status.success.copyTxid')}
                    className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-md text-neutral-600 hover:bg-neutral-100"
                  >
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                {explorerUrl && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-2 inline-flex items-center gap-1.5 text-caption text-brand-600 hover:underline"
                  >
                    {t('status.success.viewOnExplorer')}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
            )}
          </div>
        )}
        {isFailure && (
          <div className="flex flex-col items-center text-center gap-3">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-danger-100 text-danger-700"
              aria-hidden="true"
            >
              <XCircle className="h-9 w-9" />
            </span>
            <p className="text-body text-neutral-700 break-all">
              {errorMsg ?? t('status.failure.body')}
            </p>
          </div>
        )}
      </div>
      {!isWorking && (
        <div className="flex justify-end gap-2 mt-3">
          {isFailure && (
            <Button variant="ghost" onClick={onRetry}>
              {t('status.failure.retry')}
            </Button>
          )}
          <Button variant={isSuccess ? 'primary' : 'secondary'} onClick={onClose}>
            {isSuccess ? t('status.success.close') : t('cta.close')}
          </Button>
        </div>
      )}
    </Modal>
  );
}
