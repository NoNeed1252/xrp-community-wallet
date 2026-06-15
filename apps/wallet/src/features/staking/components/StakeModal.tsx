import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Field, Input, Modal } from '@rc/ui';
import { dropsToXrp, formatCrypto, parseXrpInput } from '@rc/types';
import { useMockedAccountState } from '~/features/send/hooks/useMockedAccountState';
import { useEffectiveXrpBalance } from '~/features/send/hooks/useEffectiveXrpBalance';
import { useWalletProfile } from '~/lib/wallet/useWallet';
import {
  POOL_APR_PCT,
  POOL_MIN_DEPOSIT_DROPS,
  useStakingState,
} from '../hooks/useStakingState';

const RESERVE_DROPS = '1000000';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function StakeModal({ open, onClose }: Props) {
  const { t } = useTranslation('staking');
  const { balanceDrops } = useEffectiveXrpBalance();
  const { profile } = useWalletProfile();
  const applySend = useMockedAccountState((s) => s.applySend);
  const openPosition = useStakingState((s) => s.open);

  const [amountInput, setAmountInput] = useState('');
  const [busy, setBusy] = useState(false);

  const amountDrops = useMemo(() => parseXrpInput(amountInput || ''), [amountInput]);
  const available = (BigInt(balanceDrops) - BigInt(RESERVE_DROPS)).toString();
  const min = BigInt(POOL_MIN_DEPOSIT_DROPS);

  const tooSmall = amountDrops !== null && BigInt(amountDrops) > 0n && BigInt(amountDrops) < min;
  const tooBig = amountDrops !== null && BigInt(amountDrops) > BigInt(available);
  const isZero = amountDrops !== null && BigInt(amountDrops) === 0n;

  const canSubmit =
    amountDrops !== null && !tooSmall && !tooBig && !isZero && BigInt(available) >= min;

  const estYearly =
    amountDrops !== null && BigInt(amountDrops) > 0n
      ? ((Number(amountDrops) * POOL_APR_PCT) / 100).toFixed(0)
      : '0';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || amountDrops === null || !profile) return;
    setBusy(true);
    try {
      // Имитируем "перевод" в пул — регистрируем позицию + tx в истории профиля.
      const feeDrops = '12';
      applySend(profile.id, {
        toAddress: 'rPoo1Staking4F7v3T2cQ1bD8s5Wm6Zu',
        amountDrops,
        feeDrops,
        memo: 'staking deposit',
        destinationTag: 7777,
        txHash: `stk_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.toUpperCase(),
      });
      openPosition({ depositDrops: amountDrops });
      setAmountInput('');
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const onMax = () => {
    setAmountInput(dropsToXrp(available));
  };

  const setPercent = (pct: number) => {
    const value = (BigInt(available) * BigInt(pct)) / 100n;
    setAmountInput(dropsToXrp(value.toString()));
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={t('modal.title')}
      size="md"
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="rounded-lg bg-brand-50 text-brand-700 px-4 py-3 text-body">
          {t('modal.intro', { apr: POOL_APR_PCT.toFixed(2) })}
        </div>

        <Field
          label={t('modal.amount.label')}
          helper={t('modal.amount.balance', {
            amount: formatCrypto(dropsToXrp(available), 'XRP').value,
          })}
          error={
            tooBig
              ? t('modal.amount.error.tooBig')
              : tooSmall
              ? t('modal.amount.error.tooSmall', {
                  min: formatCrypto(dropsToXrp(POOL_MIN_DEPOSIT_DROPS), 'XRP').value,
                })
              : undefined
          }
        >
          {(id) => (
            <Input
              id={id}
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              inputMode="decimal"
              placeholder="0.000000"
              autoComplete="off"
              invalid={tooBig || tooSmall}
              rightSlot={
                <Button type="button" variant="ghost" size="sm" onClick={onMax}>
                  {t('modal.amount.max')}
                </Button>
              }
            />
          )}
        </Field>

        <div className="flex flex-wrap gap-2">
          {[25, 50, 75, 100].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPercent(p)}
              className="inline-flex items-center justify-center h-8 px-3 rounded-full bg-nested text-caption text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              {p}%
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-neutral-200 bg-surface p-4 flex flex-col gap-1.5 text-body">
          <Row label={t('modal.summary.apr')} value={`${POOL_APR_PCT.toFixed(2)}%`} />
          <Row
            label={t('modal.summary.estYearly')}
            value={`+${formatCrypto(dropsToXrp(estYearly), 'XRP').value} XRP`}
            accent
          />
          <Row label={t('modal.summary.fee')} value={`${formatCrypto(dropsToXrp('12'), 'XRP').value} XRP`} />
        </div>

        <p className="text-caption text-neutral-500">{t('modal.disclaimer')}</p>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            {t('modal.cancel')}
          </Button>
          <Button type="submit" disabled={!canSubmit} loading={busy}>
            {t('modal.confirm')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-500">{label}</span>
      <span className={accent ? 'text-success-700 font-medium tabular-nums' : 'text-neutral-900 tabular-nums'}>
        {value}
      </span>
    </div>
  );
}
