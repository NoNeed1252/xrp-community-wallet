import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Download, KeyRound, Plus, Usb } from '@rc/ui';
import { OnboardingLayout } from './OnboardingLayout';
import { useOnboardingState } from './state';

export function WelcomePage() {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setFlow } = useOnboardingState();
  const modeQs = searchParams.get('mode') === 'add' ? '?mode=add' : '';

  const options = [
    {
      key: 'create',
      icon: Plus,
      title: t('welcome.options.create.title'),
      body: t('welcome.options.create.body'),
      go: () => {
        setFlow('create');
        navigate(`/onboarding/create${modeQs}`);
      },
    },
    {
      key: 'importSeed',
      icon: Download,
      title: t('welcome.options.importSeed.title'),
      body: t('welcome.options.importSeed.body'),
      go: () => {
        setFlow('import_seed');
        navigate(`/onboarding/import-seed${modeQs}`);
      },
    },
    {
      key: 'importKey',
      icon: KeyRound,
      title: t('welcome.options.importKey.title'),
      body: t('welcome.options.importKey.body'),
      go: () => {
        setFlow('import_key');
        navigate(`/onboarding/import-key${modeQs}`);
      },
    },
    {
      key: 'ledger',
      icon: Usb,
      title: t('welcome.options.ledger.title'),
      body: t('welcome.options.ledger.body'),
      go: () => navigate(`/onboarding/ledger${modeQs}`),
    },
  ];

  return (
    <OnboardingLayout>
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-h2 text-neutral-900">{t('welcome.title')}</h1>
        <p className="text-body text-neutral-500">{t('welcome.subtitle')}</p>
      </div>
      <ul className="flex flex-col gap-3">
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <li key={opt.key}>
              <button
                type="button"
                onClick={opt.go}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-neutral-200 hover:border-brand-600 hover:bg-brand-50 transition-colors duration-120 text-left"
              >
                <span className="shrink-0 w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-body-strong text-neutral-900">{opt.title}</span>
                  <span className="block text-body text-neutral-500">{opt.body}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-neutral-400 shrink-0" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
    </OnboardingLayout>
  );
}
