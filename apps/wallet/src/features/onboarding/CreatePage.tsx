import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Helper, useCopyToClipboard } from '@rc/ui';
import { Copy, RefreshCw } from '@rc/ui';
import { OnboardingLayout } from './OnboardingLayout';
import { useOnboardingState } from './state';
import { generateSeedPhrase } from '~/lib/wallet/seed';

const CLIPBOARD_CLEAR_AFTER_MS = 60_000;

export function CreatePage() {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeQs = searchParams.get('mode') === 'add' ? '?mode=add' : '';
  const { setGeneratedSeed: setSeed } = useOnboardingState();
  const [phrase, setPhrase] = useState<string>(() => generateSeedPhrase());
  const words = useMemo(() => phrase.split(' '), [phrase]);
  const { copy, copied } = useCopyToClipboard();
  const [copiedAt, setCopiedAt] = useState<number | null>(null);

  useEffect(() => {
    if (copiedAt === null) return;
    const remaining = CLIPBOARD_CLEAR_AFTER_MS;
    const id = window.setTimeout(async () => {
      // Чистим clipboard, только если в нём всё ещё наша фраза — иначе
      // затрём то, что пользователь скопировал позже (security audit M4).
      try {
        const current = await navigator.clipboard?.readText?.();
        if (typeof current === 'string' && current === phrase) {
          await navigator.clipboard?.writeText('').catch(() => {});
        }
      } catch {
        // Permissions denied — оставляем clipboard как есть.
      }
      setCopiedAt(null);
    }, remaining);
    return () => window.clearTimeout(id);
  }, [copiedAt, phrase]);

  const onCopy = async () => {
    const ok = await copy(phrase);
    if (ok) setCopiedAt(Date.now());
  };

  const onRegenerate = () => setPhrase(generateSeedPhrase());

  const onNext = () => {
    setSeed(phrase);
    navigate(`/onboarding/confirm${modeQs}`);
  };

  return (
    <OnboardingLayout step={1} total={3} stepLabel={t('steps.label', { current: 1, total: 3 })}>
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-h2 text-neutral-900 flex items-center justify-center gap-2">
          {t('create.title')}
          <Helper text={t('create.helper')} />
        </h1>
        <p className="text-body text-neutral-500">{t('create.body')}</p>
      </div>

      <ol className="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-nested rounded-lg p-4">
        {words.map((w, idx) => (
          <li key={`${idx}-${w}`} className="flex items-center gap-2 bg-surface rounded-md border border-neutral-200 px-2.5 py-2 text-body">
            <span className="text-caption text-neutral-400 tabular-nums shrink-0">{idx + 1}</span>
            <span className="text-neutral-900 font-medium truncate" title={w}>
              {w}
            </span>
          </li>
        ))}
      </ol>

      <div className="flex items-center justify-between gap-3 flex-col sm:flex-row">
        <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={onRegenerate}>
          {t('create.actions.regenerate')}
        </Button>
        <Button variant="secondary" size="sm" leftIcon={<Copy className="h-4 w-4" />} onClick={onCopy}>
          {copied ? t('create.actions.copied') : t('create.actions.copy')}
        </Button>
      </div>

      {copiedAt !== null && (
        <p role="status" className="text-caption text-warning-700 text-center">
          {t('create.copy.warning')}
        </p>
      )}

      <p className="text-caption text-neutral-500">{t('create.disclaimer')}</p>

      <div className="flex justify-end">
        <Button onClick={onNext}>{t('create.actions.next')}</Button>
      </div>
    </OnboardingLayout>
  );
}
