import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Field } from '@rc/ui';
import { OnboardingLayout } from './OnboardingLayout';
import { useOnboardingState } from './state';
import { isValidSeedPhrase, normalizePhrase, tokensToIndexes } from '~/lib/wallet/seed';
import { deriveFromMnemonic } from '~/lib/wallet/keypair';
import { maskAddress } from '@rc/types';

export function ImportSeedPage() {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeQs = searchParams.get('mode') === 'add' ? '?mode=add' : '';
  const { setImportedSecret: setSecret, setFlow } = useOnboardingState();
  const [raw, setRaw] = useState('');

  const normalized = normalizePhrase(raw);
  const wordCount = normalized ? normalized.split(' ').length : 0;
  const expectedCount = wordCount <= 12 ? 12 : 24;
  const allInDict = useMemo(() => {
    if (!normalized) return true;
    return tokensToIndexes(normalized).every((i) => i >= 0);
  }, [normalized]);

  const isValid =
    (wordCount === 12 || wordCount === 24) && allInDict && isValidSeedPhrase(normalized);
  const derivedAddress = isValid ? deriveFromMnemonic(normalized).address : null;

  const errorKey =
    !raw
      ? null
      : wordCount !== 12 && wordCount !== 24
      ? 'wordCount'
      : !allInDict
      ? 'notInDict'
      : !isValid
      ? 'invalidChecksum'
      : null;

  const onContinue = () => {
    if (!isValid) return;
    setFlow('import_seed');
    setSecret(normalized);
    navigate(`/onboarding/set-password${modeQs}`);
  };

  return (
    <OnboardingLayout step={1} total={2} stepLabel={t('steps.label', { current: 1, total: 2 })}>
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-h2 text-neutral-900">{t('importSeed.title')}</h1>
        <p className="text-body text-neutral-500">{t('importSeed.body')}</p>
      </div>

      <Field
        label={t('importSeed.label')}
        helper={t('importSeed.helper', { count: expectedCount })}
        error={errorKey ? t(`importSeed.error.${errorKey}`) : undefined}
      >
        {(id) => (
          <textarea
            id={id}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={4}
            spellCheck={false}
            autoComplete="off"
            aria-invalid={Boolean(errorKey)}
            className={`w-full rounded-md border bg-surface px-3 py-2 text-body text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-100 ${
              errorKey ? 'border-danger-700 focus:border-danger-700' : 'border-neutral-300 focus:border-brand-600'
            }`}
            placeholder={t('importSeed.placeholder')}
          />
        )}
      </Field>

      {derivedAddress && (
        <div className="rounded-lg bg-nested px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-caption text-neutral-500">{t('importSeed.derivedAddress')}</span>
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
