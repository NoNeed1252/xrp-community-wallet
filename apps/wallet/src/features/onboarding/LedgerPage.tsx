import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Usb } from '@rc/ui';
import { Banner, Button, Card, Field, Input, Spinner } from '@rc/ui';
import { OnboardingLayout } from './OnboardingLayout';
import { maskAddress } from '@rc/types';
import { connectAndDerive, isWebHidSupported, type LedgerError } from '~/lib/wallet/ledger';
import { addLedgerAccount } from '~/lib/wallet/vaultMutations';
import { getProfiles } from '~/lib/wallet/vault';

type Phase = 'idle' | 'connecting' | 'naming' | 'saving' | 'error';

export function LedgerPage() {
  const { t } = useTranslation('ledger');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const addMode = searchParams.get('mode') === 'add';
  const supported = isWebHidSupported();
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [derived, setDerived] = useState<{
    address: string;
    publicKey: string;
    derivationPath: string;
    deviceName: string;
  } | null>(null);
  const [label, setLabel] = useState('');

  const onConnect = async () => {
    setPhase('connecting');
    setErrorKey(null);
    try {
      // ADR-047: pure-Ledger setup запрещён. Если vault пустой и не add-mode — отказ.
      const profiles = await getProfiles();
      if (profiles.length === 0 && !addMode) {
        setErrorKey('generic');
        setPhase('error');
        return;
      }
      const result = await connectAndDerive();
      setDerived(result);
      setLabel(result.deviceName);
      setPhase('naming');
    } catch (e) {
      const err = e as LedgerError;
      setErrorKey(err.code ?? 'generic');
      setPhase('error');
    }
  };

  const onSave = async () => {
    if (!derived) return;
    setPhase('saving');
    try {
      await addLedgerAccount({
        publicKey: derived.publicKey,
        address: derived.address,
        derivationPath: derived.derivationPath,
        label: label.trim() || derived.deviceName,
      });
      navigate(addMode ? '/settings/accounts' : '/', { replace: true });
    } catch {
      setErrorKey('generic');
      setPhase('error');
    }
  };

  if (!supported) {
    return (
      <OnboardingLayout>
        <UnsupportedBlock />
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout>
      <div className="flex flex-col gap-2 text-center">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <Usb className="h-6 w-6" aria-hidden />
        </span>
        <h1 className="text-h2 text-neutral-900">{t('title')}</h1>
        <p className="text-body text-neutral-500">{t('subtitle')}</p>
      </div>

      <Card>
        <ol className="flex flex-col gap-2 text-body text-neutral-700">
          <li>1. {t('connect.steps.1')}</li>
          <li>2. {t('connect.steps.2')}</li>
          <li>3. {t('connect.steps.3')}</li>
          <li>4. {t('connect.steps.4')}</li>
        </ol>
      </Card>

      {phase === 'error' && errorKey && (
        <Banner severity="danger" title={t(`errors.${errorKey}`)} />
      )}

      {(phase === 'naming' || phase === 'saving') && derived && (
        <Card>
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-nested px-4 py-3 flex items-center justify-between">
              <span className="text-caption text-neutral-500">
                {t('connect.status.address.label')}
              </span>
              <span className="font-mono text-body text-neutral-900" title={derived.address}>
                {maskAddress(derived.address, 6, 6)}
              </span>
            </div>
            <Field label={t('naming.label')}>
              {(id) => (
                <Input
                  id={id}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={t('naming.placeholder')}
                  autoFocus
                />
              )}
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => navigate(-1)} disabled={phase === 'saving'}>
                {t('connect.cta.retry')}
              </Button>
              <Button
                onClick={onSave}
                disabled={!label.trim() || phase === 'saving'}
                loading={phase === 'saving'}
              >
                {t('naming.cta')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {phase !== 'naming' && phase !== 'saving' && (
        <div className="flex flex-col items-center gap-3">
          {phase === 'connecting' && (
            <div className="inline-flex items-center gap-2 text-caption text-neutral-500">
              <Spinner size={16} /> {t('connect.status.device.connecting')}
            </div>
          )}
          <Button
            onClick={onConnect}
            disabled={phase === 'connecting'}
            loading={phase === 'connecting'}
          >
            {phase === 'error' ? t('connect.cta.retry') : t('connect.cta.connect')}
          </Button>
        </div>
      )}
    </OnboardingLayout>
  );
}

function UnsupportedBlock() {
  const { t } = useTranslation('ledger');
  return (
    <div className="flex flex-col items-center gap-3 text-center py-6">
      <span className="text-neutral-300">
        <Usb className="h-14 w-14" aria-hidden />
      </span>
      <h1 className="text-h2 text-neutral-900">{t('support.unsupported.title')}</h1>
      <p className="text-body text-neutral-500 max-w-sm">{t('support.unsupported.body')}</p>
      <a
        href="https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-brand-600 hover:underline"
      >
        {t('support.docs')} <ExternalLink className="h-4 w-4" aria-hidden />
      </a>
    </div>
  );
}
