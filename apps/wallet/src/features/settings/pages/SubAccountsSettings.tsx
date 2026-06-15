import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus, Trash2 } from '@rc/ui';
import { Button, Card, EmptyState, Field, Input, Modal, toast } from '@rc/ui';
import { Tag } from '@rc/ui';
import { useActiveAccount, useSubAccounts } from '~/lib/wallet/useWallet';
import { addSubAccount, deleteSubAccount, renameSubAccount } from '~/lib/wallet/vaultSubAccounts';
import type { SubAccount } from '~/lib/wallet/types';

export function SubAccountsSettings() {
  const { t } = useTranslation('settings');
  const { profile } = useActiveAccount();
  const { subs } = useSubAccounts(profile?.id ?? null);
  const [addOpen, setAddOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<SubAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubAccount | null>(null);

  if (!profile) return null;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-h3 text-neutral-900">{t('subAccounts.title')}</h2>
            <p className="text-body text-neutral-500">{t('subAccounts.subtitle', { label: profile.label })}</p>
          </div>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setAddOpen(true)}
            className="self-start sm:self-auto"
          >
            {t('subAccounts.add.cta')}
          </Button>
        </div>
        {subs.length === 0 ? (
          <EmptyState
            icon={<Tag className="h-10 w-10" />}
            title={t('subAccounts.empty.title')}
            body={t('subAccounts.empty.body')}
          />
        ) : (
          <ul className="flex flex-col divide-y divide-neutral-200">
            {subs.map((s) => (
              <li key={s.id} className="py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-body-strong text-neutral-900">{s.label}</div>
                  <div className="text-caption text-neutral-500 font-mono">
                    {t('subAccounts.dtPrefix')}: {s.destinationTag}
                  </div>
                  {s.note && <div className="text-caption text-neutral-500 mt-0.5">{s.note}</div>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Pencil className="h-4 w-4" />}
                  onClick={() => setRenameTarget(s)}
                >
                  {t('actions.rename')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  onClick={() => setDeleteTarget(s)}
                >
                  {t('actions.delete')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {addOpen && profile && <AddModal accountId={profile.id} onClose={() => setAddOpen(false)} />}
      {renameTarget && <RenameModal sub={renameTarget} onClose={() => setRenameTarget(null)} />}
      {deleteTarget && <DeleteModal sub={deleteTarget} onClose={() => setDeleteTarget(null)} />}
    </div>
  );
}

function AddModal({ accountId, onClose }: { accountId: string; onClose: () => void }) {
  const { t } = useTranslation('settings');
  const [label, setLabel] = useState('');
  const [tag, setTag] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const tagNum = Number(tag);
  const tagOk = Number.isInteger(tagNum) && tagNum >= 0 && tagNum <= 4_294_967_295;
  const labelOk = label.trim().length > 0;
  const canSubmit = labelOk && tagOk && !busy;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setErr(null);
    try {
      await addSubAccount(accountId, { label, destinationTag: tagNum, note: note || undefined });
      toast.success(t('subAccounts.add.success'));
      onClose();
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes('destination tag already used')) {
        setErr(t('subAccounts.add.errors.tagDuplicate'));
      } else {
        setErr(t('subAccounts.add.errors.generic'));
      }
      setBusy(false);
    }
  };

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={t('subAccounts.add.modal.title')} size="md">
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <Field
          label={t('subAccounts.add.fields.label')}
          error={!labelOk && label !== '' ? t('subAccounts.add.errors.labelEmpty') : undefined}
        >
          {(id) => <Input id={id} value={label} onChange={(e) => setLabel(e.target.value)} autoFocus />}
        </Field>
        <Field
          label={t('subAccounts.add.fields.destinationTag')}
          helper={t('subAccounts.add.fields.dtHelper')}
          error={tag && !tagOk ? t('subAccounts.add.errors.tagRange') : undefined}
        >
          {(id) => (
            <Input
              id={id}
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              inputMode="numeric"
              placeholder="0 — 4294967295"
              invalid={Boolean(tag) && !tagOk}
            />
          )}
        </Field>
        <Field label={t('subAccounts.add.fields.note')}>
          {(id) => <Input id={id} value={note} onChange={(e) => setNote(e.target.value)} />}
        </Field>
        {err && <p role="alert" className="text-caption text-danger-700">{err}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" disabled={!canSubmit} loading={busy}>
            {t('subAccounts.add.modal.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function RenameModal({ sub, onClose }: { sub: SubAccount; onClose: () => void }) {
  const { t } = useTranslation('settings');
  const [label, setLabel] = useState(sub.label);
  const [busy, setBusy] = useState(false);
  const ok = label.trim().length > 0;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ok) return;
    setBusy(true);
    await renameSubAccount(sub.id, label.trim());
    toast.success(t('subAccounts.rename.success'));
    onClose();
  };

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={t('subAccounts.rename.title')} size="sm">
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <Field label={t('subAccounts.add.fields.label')}>
          {(id) => <Input id={id} value={label} onChange={(e) => setLabel(e.target.value)} autoFocus />}
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

function DeleteModal({ sub, onClose }: { sub: SubAccount; onClose: () => void }) {
  const { t } = useTranslation('settings');
  const [busy, setBusy] = useState(false);

  const onDelete = async () => {
    if (busy) return;
    setBusy(true);
    await deleteSubAccount(sub.id);
    toast.success(t('subAccounts.delete.success'));
    onClose();
  };

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={t('subAccounts.delete.title')} size="sm">
      <div className="flex flex-col gap-4">
        <p className="text-body text-neutral-700">{t('subAccounts.delete.body', { label: sub.label })}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {t('actions.cancel')}
          </Button>
          <Button variant="destructive" onClick={onDelete} loading={busy}>
            {t('actions.delete')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
