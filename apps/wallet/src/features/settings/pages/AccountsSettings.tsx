import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, Plus, Trash2, Pencil, Usb } from '@rc/ui';
import { Button, Card, Field, Input, Modal, WalletAvatar, toast } from '@rc/ui';
import { maskAddress } from '@rc/types';
import { useAllAccounts, useActiveAccount } from '~/lib/wallet/useWallet';
import { deleteAccount, renameAccount, setActiveAccount } from '~/lib/wallet/vaultMutations';
import type { WalletProfile } from '~/lib/wallet/types';

export function AccountsSettings() {
  const { t } = useTranslation('settings');
  const navigate = useNavigate();
  const { profiles } = useAllAccounts();
  const { profile: active } = useActiveAccount();
  const [renameTarget, setRenameTarget] = useState<WalletProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WalletProfile | null>(null);

  const onSwitch = async (id: string) => {
    if (id === active?.id) return;
    await setActiveAccount(id);
    toast.success(t('accounts.switched'));
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h3 text-neutral-900">{t('accounts.list.title')}</h2>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/onboarding/welcome?mode=add')}>
            {t('accounts.add.cta')}
          </Button>
        </div>
        <ul className="flex flex-col divide-y divide-neutral-200">
          {profiles.map((p) => (
            <li key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <WalletAvatar seed={p.id} size={32} />
                <div className="flex-1 min-w-0">
                <div className="text-body-strong text-neutral-900 flex flex-wrap items-center gap-2">
                  <span className="truncate">{p.label}</span>
                  {p.kind === 'ledger_hardware' && (
                    <span className="inline-flex items-center gap-1 text-caption text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-full">
                      <Usb className="h-3 w-3" aria-hidden="true" />
                      {t('accounts.hardware')}
                    </span>
                  )}
                  {active?.id === p.id && (
                    <span className="inline-flex items-center gap-1 text-caption text-success-700">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('accounts.active')}
                    </span>
                  )}
                </div>
                <div className="text-caption text-neutral-500 font-mono truncate">{maskAddress(p.address, 6, 6)}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {active?.id !== p.id && (
                  <Button variant="ghost" size="sm" onClick={() => onSwitch(p.id)}>
                    {t('accounts.setActive')}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Pencil className="h-4 w-4" />}
                  onClick={() => setRenameTarget(p)}
                >
                  {t('accounts.rename.cta')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  disabled={profiles.length <= 1 || active?.id === p.id}
                  onClick={() => setDeleteTarget(p)}
                >
                  {t('accounts.delete.cta')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {renameTarget && (
        <RenameModal account={renameTarget} onClose={() => setRenameTarget(null)} />
      )}
      {deleteTarget && (
        <DeleteModal account={deleteTarget} onClose={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}

function RenameModal({ account, onClose }: { account: WalletProfile; onClose: () => void }) {
  const { t } = useTranslation('settings');
  const [label, setLabel] = useState(account.label);
  const [busy, setBusy] = useState(false);
  const ok = label.trim().length > 0;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ok) return;
    setBusy(true);
    await renameAccount(account.id, label.trim());
    toast.success(t('accounts.rename.success'));
    onClose();
  };

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={t('accounts.rename.modal.title')} size="sm">
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <Field label={t('accounts.rename.modal.label')}>
          {(id) => (
            <Input id={id} value={label} onChange={(e) => setLabel(e.target.value)} autoFocus />
          )}
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" disabled={!ok} loading={busy}>
            {t('actions.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteModal({ account, onClose }: { account: WalletProfile; onClose: () => void }) {
  const { t } = useTranslation('settings');
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const ok = typed.trim() === account.label;

  const onDelete = async () => {
    if (!ok || busy) return;
    setBusy(true);
    try {
      await deleteAccount(account.id);
      toast.success(t('accounts.delete.success'));
      onClose();
    } catch {
      toast.danger(t('accounts.delete.failed'));
      setBusy(false);
    }
  };

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={t('accounts.delete.modal.title')} size="md">
      <div className="flex flex-col gap-4">
        <div className="rounded-lg bg-danger-100 text-danger-700 px-4 py-3 text-body">
          {t('accounts.delete.modal.body', { label: account.label })}
        </div>
        <Field label={t('accounts.delete.modal.confirmPrompt', { label: account.label })}>
          {(id) => (
            <Input id={id} value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
          )}
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {t('actions.cancel')}
          </Button>
          <Button variant="destructive" onClick={onDelete} disabled={!ok} loading={busy}>
            {t('accounts.delete.modal.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
