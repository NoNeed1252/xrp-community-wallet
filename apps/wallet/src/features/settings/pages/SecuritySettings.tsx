import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Eye, KeyRound, Lock } from '@rc/ui';
import { Button, Card, Field, Input, Modal, PasswordInput, Spinner, toast } from '@rc/ui';
import { lock } from '~/lib/wallet/vault';
import { changePassword, reset, viewSeed } from '~/lib/wallet/vaultMutations';
import { useActiveAccount } from '~/lib/wallet/useWallet';
import { meetsRequirements, scorePassword } from '~/features/onboarding/passwordStrength';

export function SecuritySettings() {
  const { t } = useTranslation('settings');
  const navigate = useNavigate();
  const { profile } = useActiveAccount();
  const [changeOpen, setChangeOpen] = useState(false);
  const [seedOpen, setSeedOpen] = useState(false);
  const [wipeOpen, setWipeOpen] = useState(false);

  const onLock = () => {
    lock();
    navigate('/unlock', { replace: true });
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <Section
          icon={<KeyRound className="h-5 w-5" />}
          title={t('security.password.title')}
          body={t('security.password.body')}
          action={
            <Button variant="secondary" onClick={() => setChangeOpen(true)}>
              {t('security.password.change')}
            </Button>
          }
        />
      </Card>
      {profile && profile.kind !== 'ledger_hardware' && (
        <Card>
          <Section
            icon={<Eye className="h-5 w-5" />}
            title={t('security.seed.title')}
            body={t('security.seed.body')}
            action={
              <Button variant="secondary" onClick={() => setSeedOpen(true)}>
                {t('security.seed.view')}
              </Button>
            }
          />
        </Card>
      )}
      <Card>
        <Section
          icon={<Lock className="h-5 w-5" />}
          title={t('security.lockNow.title')}
          body={t('security.lockNow.body')}
          action={
            <Button variant="ghost" onClick={onLock}>
              {t('security.lockNow.cta')}
            </Button>
          }
        />
      </Card>
      <Card className="border-danger-700/30">
        <Section
          icon={<AlertTriangle className="h-5 w-5 text-danger-700" />}
          title={t('security.reset.title')}
          body={t('security.reset.body')}
          action={
            <Button variant="destructive" onClick={() => setWipeOpen(true)}>
              {t('security.reset.cta')}
            </Button>
          }
        />
      </Card>

      {changeOpen && <ChangePasswordModal onClose={() => setChangeOpen(false)} />}
      {seedOpen && <ViewSeedModal onClose={() => setSeedOpen(false)} />}
      {wipeOpen && <WipeModal onClose={() => setWipeOpen(false)} />}
    </div>
  );
}

function Section({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 flex-col sm:flex-row sm:items-center">
      <span className="shrink-0 w-10 h-10 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-body-strong text-neutral-900">{title}</div>
        <div className="text-body text-neutral-500">{body}</div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('settings');
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const strong = meetsRequirements(newPwd);
  const matches = newPwd === confirm;
  const canSubmit = oldPwd && newPwd && strong && matches && !busy;
  const strength = scorePassword(newPwd).strength;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setErr(null);
    try {
      await changePassword(oldPwd, newPwd);
      toast.success(t('security.password.modal.success'));
      onClose();
    } catch {
      setErr(t('security.password.modal.error.wrong'));
      setBusy(false);
    }
  };

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={t('security.password.modal.title')} size="md">
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <Field label={t('security.password.modal.old')} error={err ?? undefined}>
          {(id) => (
            <PasswordInput
              id={id}
              value={oldPwd}
              onChange={(e) => setOldPwd(e.target.value)}
              autoComplete="current-password"
              autoFocus
              invalid={Boolean(err)}
            />
          )}
        </Field>
        <Field
          label={t('security.password.modal.new')}
          helper={`${t('security.password.modal.strength')}: ${t(`security.password.modal.strength_${strength}`)}`}
          error={newPwd && !strong ? t('security.password.modal.error.weak') : undefined}
        >
          {(id) => (
            <PasswordInput
              id={id}
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              autoComplete="new-password"
              invalid={Boolean(newPwd) && !strong}
            />
          )}
        </Field>
        <Field
          label={t('security.password.modal.confirm')}
          error={confirm && !matches ? t('security.password.modal.error.mismatch') : undefined}
        >
          {(id) => (
            <PasswordInput
              id={id}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              invalid={Boolean(confirm) && !matches}
            />
          )}
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" disabled={!canSubmit} loading={busy}>
            {t('security.password.modal.submit')}
          </Button>
        </div>
        {busy && (
          <div className="flex items-center justify-center gap-2 text-caption text-neutral-500">
            <Spinner size={16} /> {t('security.password.modal.working')}
          </div>
        )}
      </form>
    </Modal>
  );
}

const AUTO_HIDE_MS = 60_000;

function ViewSeedModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('settings');
  const [password, setPassword] = useState('');
  const [seed, setSeed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  // Очищаем секрет/пароль из state при размонтировании, чтобы они не висели
  // в памяти дольше необходимого (security audit M3).
  useEffect(() => {
    return () => {
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      setSeed(null);
      setPassword('');
    };
  }, []);

  const onReveal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const s = await viewSeed(password);
      setSeed(s);
      setBusy(false);
      setPassword('');
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
      }
      hideTimerRef.current = window.setTimeout(() => {
        setSeed(null);
        hideTimerRef.current = null;
        onClose();
      }, AUTO_HIDE_MS);
    } catch {
      setErr(t('security.seed.modal.error'));
      setBusy(false);
    }
  };

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={t('security.seed.modal.title')} size="md">
      {!seed ? (
        <form className="flex flex-col gap-4" onSubmit={onReveal}>
          <div className="rounded-lg bg-warning-100 text-warning-700 px-4 py-3 text-body">
            {t('security.seed.modal.warning')}
          </div>
          <Field label={t('security.seed.modal.passwordPrompt')} error={err ?? undefined}>
            {(id) => (
              <PasswordInput
                id={id}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                autoComplete="current-password"
                invalid={Boolean(err)}
              />
            )}
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit" disabled={!password || busy} loading={busy}>
              {t('security.seed.modal.reveal')}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg bg-warning-100 text-warning-700 px-4 py-3 text-body">
            {t('security.seed.modal.autoHide')}
          </div>
          <SeedDisplay seed={seed} />
          <div className="flex justify-end">
            <Button onClick={onClose}>{t('actions.close')}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function detectSecretKind(material: string): 'mnemonic' | 'familySeed' {
  const words = material.trim().split(/\s+/u);
  if (words.length === 12 || words.length === 24) return 'mnemonic';
  return 'familySeed';
}

function SeedDisplay({ seed }: { seed: string }) {
  const kind = detectSecretKind(seed);
  if (kind === 'mnemonic') {
    const words = seed.trim().split(/\s+/u);
    return (
      <div className="rounded-lg bg-nested p-4">
        <p className="text-caption text-neutral-500 mb-3">Recovery phrase ({words.length} words)</p>
        <ol className="grid grid-cols-3 gap-2 text-body text-neutral-900 sm:grid-cols-4">
          {words.map((w, i) => (
            <li
              key={`${i}-${w}`}
              className="flex items-baseline gap-2 rounded-md bg-canvas px-2 py-1 font-mono select-all"
            >
              <span className="text-caption text-neutral-500 w-5 text-right">{i + 1}.</span>
              <span>{w}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-caption text-neutral-500">
          Store these words offline. Anyone with them controls all XRPL + EVM accounts derived from this seed.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-lg bg-nested p-4">
      <p className="text-caption text-neutral-500 mb-2">XRPL family seed</p>
      <p className="font-mono text-body text-neutral-900 break-all select-all">{seed}</p>
      <p className="mt-3 text-caption text-neutral-500">
        Anyone with this seed controls this XRPL account. Keep it offline.
      </p>
    </div>
  );
}

function WipeModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('settings');
  const navigate = useNavigate();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const confirmText = 'WIPE';
  const ok = typed.trim().toUpperCase() === confirmText;

  const onWipe = async () => {
    if (!ok || busy) return;
    setBusy(true);
    await reset();
    navigate('/onboarding/welcome', { replace: true });
  };

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={t('security.reset.modal.title')} size="md">
      <div className="flex flex-col gap-4">
        <div className="rounded-lg bg-danger-100 text-danger-700 px-4 py-3 text-body">
          {t('security.reset.modal.body')}
        </div>
        <Field label={t('security.reset.modal.confirmPrompt', { word: confirmText })}>
          {(id) => (
            <Input
              id={id}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
          )}
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {t('actions.cancel')}
          </Button>
          <Button variant="destructive" onClick={onWipe} disabled={!ok} loading={busy}>
            {t('security.reset.modal.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
