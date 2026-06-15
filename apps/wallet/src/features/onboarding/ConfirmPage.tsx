import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Field, Input } from '@rc/ui';
import { OnboardingLayout } from './OnboardingLayout';
import { useOnboardingState } from './state';
import { randomBytes } from '~/lib/crypto/random';

function pickConfirmIndexes(total: number, count = 3): number[] {
  // Rejection sampling — устраняет смещение от `% total` при `total ∤ 256`
  // (security audit L1). Не security-critical (юзер видит свою же фразу),
  // но соблюдаем проектную политику качества случайности.
  const max = Math.floor(256 / total) * total;
  const out: Set<number> = new Set();
  while (out.size < count) {
    const bytes = randomBytes(1);
    const v = bytes[0]!;
    if (v >= max) continue;
    out.add(v % total);
  }
  return Array.from(out).sort((a, b) => a - b);
}

export function ConfirmPage() {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeQs = searchParams.get('mode') === 'add' ? '?mode=add' : '';
  const { generatedSeed: phrase } = useOnboardingState();

  // Стабильный список позиций даже если phrase меняется в процессе (не должно).
  const words = useMemo(() => (phrase ? phrase.split(' ') : []), [phrase]);
  const indexes = useMemo(() => (words.length ? pickConfirmIndexes(words.length, 3) : []), [words.length]);
  const [answers, setAnswers] = useState<string[]>(() => indexes.map(() => ''));
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (!phrase) navigate('/onboarding/welcome', { replace: true });
  }, [phrase, navigate]);

  if (!phrase) return null;

  const allCorrect = indexes.every((idx, i) => answers[i]?.trim().toLowerCase() === words[idx]);
  const hasError = tried && !allCorrect;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (allCorrect) navigate(`/onboarding/set-password${modeQs}`);
  };

  return (
    <OnboardingLayout step={2} total={3} stepLabel={t('steps.label', { current: 2, total: 3 })}>
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-h2 text-neutral-900">{t('confirm.title')}</h1>
        <p className="text-body text-neutral-500">{t('confirm.body')}</p>
      </div>
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        {indexes.map((idx, i) => (
          <Field
            key={idx}
            label={t('confirm.prompt', { n: idx + 1 })}
            error={hasError && answers[i]?.trim().toLowerCase() !== words[idx] ? t('confirm.error') : undefined}
          >
            {(id) => (
              <Input
                id={id}
                value={answers[i] ?? ''}
                onChange={(e) => {
                  const next = [...answers];
                  next[i] = e.target.value;
                  setAnswers(next);
                  setTried(false);
                }}
                invalid={hasError && answers[i]?.trim().toLowerCase() !== words[idx]}
                autoComplete="off"
                spellCheck={false}
              />
            )}
          </Field>
        ))}
        <div className="flex justify-between gap-3">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            {t('actions.back')}
          </Button>
          <Button type="submit" disabled={!allCorrect && tried}>
            {t('actions.continue')}
          </Button>
        </div>
      </form>
    </OnboardingLayout>
  );
}
