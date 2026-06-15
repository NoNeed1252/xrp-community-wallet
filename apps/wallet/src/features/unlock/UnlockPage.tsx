import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from '@rc/ui';
import { Button, Field, Input, Logo, PasswordInput } from '@rc/ui';
import { getActiveAccount, getCooldownRemainingMs, getUnlockedSlot } from '~/lib/wallet/vault';
import { reset, unlock } from '~/lib/wallet/vaultMutations';
import { useThemeSync } from '~/lib/theme/useThemeSync';

export function UnlockPage() {
  useThemeSync();
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const [pwd, setPwd] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [wipeOpen, setWipeOpen] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCooldown(Math.ceil(getCooldownRemainingMs() / 1000));
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || cooldown > 0 || !pwd) return;
    setBusy(true);
    setError(null);
    try {
      await unlock(pwd);
      // Fire-and-forget: подключаем backend-сессию через SIWX. Ошибки игнорируем
      // (backend может быть offline) — wallet остаётся рабочим оффлайн
      // (security audit L4).
      void signInBackend();
      navigate('/', { replace: true });
    } catch {
      setError(t('unlock.error.wrongPassword'));
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-page to-surface flex items-center justify-center p-4">
      <main className="w-full max-w-md">
        <div className="bg-surface rounded-3xl shadow-e3 border border-neutral-100 p-8 sm:p-10 flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <Logo suffix="wallet" />
            <div className="flex flex-col gap-1">
              <h1 className="text-h2 text-neutral-900">{t('unlock.title')}</h1>
              <p className="text-body text-neutral-500">{t('unlock.tagline')}</p>
            </div>
          </div>
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <Field label={t('unlock.password')} error={error ?? undefined}>
              {(id) => (
                <PasswordInput
                  id={id}
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  autoFocus
                  autoComplete="current-password"
                  invalid={Boolean(error)}
                />
              )}
            </Field>
            {cooldown > 0 && (
              <p role="alert" className="text-caption text-danger-700 text-center">
                {t('unlock.error.cooldown', { sec: cooldown })}
              </p>
            )}
            <Button type="submit" disabled={!pwd || cooldown > 0} loading={busy} size="lg">
              {t('unlock.action')}
            </Button>
          </form>
          <div className="flex flex-col items-center gap-1 text-center">
            <button
              type="button"
              onClick={() => setWipeOpen(true)}
              className="text-caption text-neutral-500 hover:text-danger-700 underline-offset-2 hover:underline"
            >
              {t('unlock.forgot.link')}
            </button>
            <p className="text-caption text-neutral-400">{t('unlock.autoLockHint')}</p>
          </div>
        </div>
      </main>
      {wipeOpen && <WipeDialog onClose={() => setWipeOpen(false)} />}
    </div>
  );
}

async function signInBackend(): Promise<void> {
  try {
    const active = await getActiveAccount();
    if (!active) return;
    const slot = getUnlockedSlot(active.id);
    if (!slot?.secret) return; // ledger_hardware / locked — skip
    const { walletSignIn } = await import('~/features/auth/walletSignIn');
    await walletSignIn({ seed: slot.secret, address: active.address });
  } catch {
    // ignore — UI не зависит от наличия backend-сессии прямо сейчас
  }
}

function WipeDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const [typed, setTyped] = useState('');
  const confirmText = t('unlock.forgot.modal.confirmText');
  const canWipe = typed.trim().toUpperCase() === confirmText;
  const [busy, setBusy] = useState(false);

  const onWipe = async () => {
    if (!canWipe || busy) return;
    setBusy(true);
    await reset();
    navigate('/onboarding/welcome', { replace: true });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-e3 p-6 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="text-danger-700 shrink-0">
            <AlertTriangle className="h-6 w-6" aria-hidden />
          </span>
          <div className="flex-1">
            <h2 className="text-h3 text-neutral-900">{t('unlock.forgot.modal.title')}</h2>
            <p className="text-body text-neutral-500 mt-1">{t('unlock.forgot.modal.body')}</p>
          </div>
        </div>
        <Field
          label={t('unlock.forgot.modal.typeToConfirm', { word: confirmText })}
          helper={t('unlock.forgot.modal.helper')}
        >
          {(id) => (
            <Input
              id={id}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoFocus
              spellCheck={false}
            />
          )}
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {t('actions.back')}
          </Button>
          <Button variant="destructive" onClick={onWipe} disabled={!canWipe} loading={busy}>
            {t('unlock.forgot.modal.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}
