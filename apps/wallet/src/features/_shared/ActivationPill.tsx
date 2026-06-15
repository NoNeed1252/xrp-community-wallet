import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from '@rc/ui';
import { Button, Modal } from '@rc/ui';

/**
 * Компактный pill-chip для "Account not activated" — используется на Home / Send / Receive.
 * При клике открывает модалку с пояснением о XRPL reserve.
 */
export function ActivationPill() {
  const { t } = useTranslation('receive');
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-warning-100 px-2.5 py-1 text-caption text-warning-700 ring-1 ring-warning-200 hover:bg-warning-200 transition-colors"
      >
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{t('banner.inactive.title')}</span>
      </button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={t('modal.activation.title')}
        size="md"
        footer={<Button onClick={() => setOpen(false)}>{t('modal.activation.dismiss')}</Button>}
      >
        <p className="text-body text-neutral-700 whitespace-pre-line">{t('modal.activation.body')}</p>
      </Modal>
    </>
  );
}
