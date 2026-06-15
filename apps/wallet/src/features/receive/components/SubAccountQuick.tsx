import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Field, Input } from '@rc/ui';
import { addSubAccount } from '~/lib/wallet/vaultSubAccounts';

interface SubAccountQuickProps {
  accountId: string;
  /** Callback с обновлёнными значениями label и destinationTag после успешного создания. */
  onCreated: (input: { label: string; destinationTag: number }) => void;
}

export function SubAccountQuick({ accountId, onCreated }: SubAccountQuickProps) {
  const { t } = useTranslation('receive');
  const [label, setLabel] = useState('');
  const [dtag, setDtag] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    const dt = Number(dtag);
    if (!Number.isInteger(dt) || dt < 0 || dt > 4_294_967_295) {
      setError(t('subAccount.error.range'));
      return;
    }
    if (!label.trim()) {
      setError(t('subAccount.error.label'));
      return;
    }
    setBusy(true);
    try {
      await addSubAccount(accountId, { label: label.trim(), destinationTag: dt });
      onCreated({ label: label.trim(), destinationTag: dt });
      setLabel('');
      setDtag('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <h3 className="text-h3 text-neutral-900">{t('subAccount.title')}</h3>
      <p className="text-caption text-neutral-500">{t('subAccount.body')}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label={t('subAccount.labelField')}>
          {(id) => (
            <Input
              id={id}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t('subAccount.labelPlaceholder')}
              autoComplete="off"
            />
          )}
        </Field>
        <Field label={t('subAccount.tagField')}>
          {(id) => (
            <Input
              id={id}
              value={dtag}
              inputMode="numeric"
              onChange={(e) => setDtag(e.target.value.replace(/[^\d]/gu, ''))}
              placeholder="0–4294967295"
              autoComplete="off"
            />
          )}
        </Field>
      </div>
      {error && (
        <p className="text-caption text-danger-700" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy || !label.trim() || !dtag}>
        {busy ? t('subAccount.creating') : t('subAccount.create')}
      </Button>
    </form>
  );
}
