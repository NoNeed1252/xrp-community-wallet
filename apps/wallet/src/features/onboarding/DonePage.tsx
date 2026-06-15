import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2 } from '@rc/ui';
import { Button } from '@rc/ui';
import { OnboardingLayout } from './OnboardingLayout';

const AUTO_REDIRECT_MS = 1500;

export function DonePage() {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();

  useEffect(() => {
    const id = window.setTimeout(() => {
      navigate('/', { replace: true });
    }, AUTO_REDIRECT_MS);
    return () => window.clearTimeout(id);
  }, [navigate]);

  return (
    <OnboardingLayout>
      <div className="flex flex-col items-center gap-3 text-center py-6">
        <span className="text-success-700">
          <CheckCircle2 className="h-14 w-14" aria-hidden />
        </span>
        <h1 className="text-h2 text-neutral-900">{t('done.title')}</h1>
        <p className="text-body text-neutral-500 max-w-sm">{t('done.body')}</p>
        <Button className="mt-2" onClick={() => navigate('/', { replace: true })}>
          {t('done.cta')}
        </Button>
      </div>
    </OnboardingLayout>
  );
}
