import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Field, Input } from '@rc/ui';
import { maskAddress } from '@rc/types';
import { OnboardingLayout } from './OnboardingLayout';
import { useOnboardingState } from './state';
import { deriveFromFamilySeed, isValidFamilySeed } from '~/lib/wallet/keypair';

export function ImportKeyPage() {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeQs = searchParams.get('mode') === 'add' ? '?mode=add' : '';
  const { setImportedSecret: setSecret, setFlow } = useOnboardingState();
  const [raw, setRaw] = useState('');

  const trimmed = raw.trim();
  const isValid = isValidFamilySeed(trimmed);
  const errored = Boolean(trimmed) && !isValid;
  const derivedAddress = isValid ? deriveFromFamilySeed(trimmed).address : null;

  const onContinue = () => {
    if (!isValid) return;
    setFlow('import_key');
    setSecret(trimmed);
    navigate(`/onboarding/set-password${modeQs}`);
  };

  return (
    <OnboardingLayout step={1} total={2} stepLabel={t('steps.label', { current: 1, total: 2 })}>
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-h2 text-neutral-900">{t('importKey.title')}</h1>
        <p className="text-body text-neutral-500">{t('importKey.body')}</p>
      </div>

      <Field
        label={t('importKey.label')}
        helper={t('importKey.helper')}
        error={errored ? t('importKey.error.invalidFormat') : undefined}
      >
        {(id) => (
          <Input
            id={id}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="sEd..."
            spellCheck={false}
            autoComplete="off"
            invalid={errored}
          />
        )}
      </Field>

      {derivedAddress && (
        <div className="rounded-lg bg-nested px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-caption text-neutral-500">{t('importKey.derivedAddress')}</span>
          <span className="font-mono text-body text-neutral-900" title={derivedAddress}>
            {maskAddress(derivedAddress, 6, 6)}
          </span>
        </div>
      )}

      <div className="flex justify-between gap-3">
        <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
          {t('actions.back')}
        </Button>
        <Button onClick={onContinue} disabled={!isValid}>
          {t('actions.continue')}
        </Button>
      </div>
    </OnboardingLayout>
  );
}
