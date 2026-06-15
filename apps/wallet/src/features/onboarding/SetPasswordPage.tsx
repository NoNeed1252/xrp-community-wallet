import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Field, PasswordInput } from '@rc/ui';
import { OnboardingLayout } from './OnboardingLayout';
import { useOnboardingState } from './state';
import { meetsRequirements, scorePassword } from './passwordStrength';
import { addAccount, createWallet } from '~/lib/wallet/vaultMutations';

export function SetPasswordPage() {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const addMode = searchParams.get('mode') === 'add';
  const { flow, generatedSeed: generated, importedSecret: imported, clear } = useOnboardingState();

  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!flow) navigate(addMode ? '/onboarding/welcome?mode=add' : '/onboarding/welcome', { replace: true });
  }, [flow, navigate, addMode]);

  if (!flow) return null;

  const strengthInfo = scorePassword(pwd);
  const acceptable = addMode ? pwd.length > 0 : meetsRequirements(pwd) && pwd === confirm;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptable || busy) return;
    setError(null);
    setBusy(true);
    try {
      const kind =
        flow === 'create'
          ? 'seed_generated'
          : flow === 'import_seed'
          ? 'imported_seed'
          : 'imported_key';
      const secretMaterial = flow === 'create' ? generated! : imported!;
      if (addMode) {
        await addAccount({ kind, secretMaterial, password: pwd });
        clear();
        navigate('/settings/accounts', { replace: true });
      } else {
        await createWallet({ kind, secretMaterial, password: pwd });
        clear();
        navigate('/onboarding/done', { replace: true });
      }
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  const stepTotal = flow === 'create' ? 3 : 2;
  const stepCurrent = stepTotal;

  return (
    <OnboardingLayout
      step={stepCurrent}
      total={stepTotal}
      stepLabel={t('steps.label', { current: stepCurrent, total: stepTotal })}
    >
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-h2 text-neutral-900">
          {addMode ? t('setPassword.addMode.title') : t('setPassword.title')}
        </h1>
        <p className="text-body text-neutral-500">
          {addMode ? t('setPassword.addMode.body') : t('setPassword.body')}
        </p>
      </div>
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <Field
          label={addMode ? t('setPassword.addMode.password') : t('setPassword.password')}
          helper={addMode ? undefined : t('setPassword.requirements')}
        >
          {(id) => (
            <PasswordInput
              id={id}
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              autoFocus
              autoComplete={addMode ? 'current-password' : 'new-password'}
            />
          )}
        </Field>
        {!addMode && (
          <>
            <StrengthBar strength={strengthInfo.strength} t={t} />
            <Field
              label={t('setPassword.confirm')}
              error={confirm && pwd !== confirm ? t('setPassword.error.mismatch') : undefined}
            >
              {(id) => (
                <PasswordInput
                  id={id}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  invalid={Boolean(confirm) && pwd !== confirm}
                />
              )}
            </Field>
          </>
        )}
        {error && (
          <p className="text-caption text-danger-700" role="alert">
            {error}
          </p>
        )}
        <div className="flex justify-between gap-3">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)} disabled={busy}>
            {t('actions.back')}
          </Button>
          <Button type="submit" disabled={!acceptable} loading={busy}>
            {busy
              ? t('setPassword.securing')
              : addMode
              ? t('setPassword.addMode.submit')
              : t('actions.finish')}
          </Button>
        </div>
      </form>
    </OnboardingLayout>
  );
}

function StrengthBar({
  strength,
  t,
}: {
  strength: ReturnType<typeof scorePassword>['strength'];
  t: (k: string) => string;
}) {
  const colors: Record<string, string> = {
    weak: 'bg-danger-700',
    fair: 'bg-warning-700',
    good: 'bg-brand-500',
    strong: 'bg-success-700',
  };
  const widths: Record<string, string> = {
    weak: 'w-1/4',
    fair: 'w-2/4',
    good: 'w-3/4',
    strong: 'w-full',
  };
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-neutral-200 overflow-hidden">
        <div className={`h-full ${colors[strength]} ${widths[strength]} transition-all duration-200`} />
      </div>
      <span className="text-caption text-neutral-700 capitalize w-16 text-right">
        {t(`setPassword.strength.${strength}`)}
      </span>
    </div>
  );
}
