import { useTranslation } from 'react-i18next';
import { CalendarBlank, Card, ExternalLink, Helper, ShieldCheck } from '@rc/ui';
import { dropsToXrp } from '@rc/types';
import {
  POOL_ADDRESS,
  POOL_APR_PCT,
  POOL_DEST_TAG,
  POOL_MIN_DEPOSIT_DROPS,
  POOL_PAYOUT_FREQ_DAYS,
} from '../hooks/useStakingState';

export function PoolCard() {
  const { t } = useTranslation('staking');
  const minDepositXrp = dropsToXrp(POOL_MIN_DEPOSIT_DROPS);

  const rows: Array<{ label: string; value: string; helper?: string }> = [
    { label: t('pool.apr'), value: `${POOL_APR_PCT.toFixed(2)}%` },
    { label: t('pool.minDeposit'), value: `${minDepositXrp} XRP` },
    { label: t('pool.payoutFreq'), value: t('pool.payoutFreqValue', { days: POOL_PAYOUT_FREQ_DAYS }) },
    { label: t('pool.destinationTag'), value: String(POOL_DEST_TAG) },
  ];

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 shrink-0">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-h3 text-neutral-900 flex items-center gap-2">
              {t('pool.title')}
              <Helper text={t('pool.helper')} />
            </h3>
            <p className="text-caption text-neutral-500 mt-1">{t('pool.body')}</p>
          </div>
        </div>

        <dl className="flex flex-col divide-y divide-neutral-200">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <dt className="text-body text-neutral-500">{row.label}</dt>
              <dd className="text-body-strong text-neutral-900 tabular-nums text-right">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex items-center gap-2 text-caption text-neutral-500 flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <CalendarBlank className="h-3.5 w-3.5" aria-hidden="true" />
            {t('pool.nextPayout', { date: nextPayoutLabel() })}
          </span>
          <span className="text-neutral-300">·</span>
          <span className="font-mono break-all" title={POOL_ADDRESS}>
            {POOL_ADDRESS.slice(0, 12)}…{POOL_ADDRESS.slice(-6)}
          </span>
          <a
            href={landingDocsStakingUrl()}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-brand-600 hover:underline"
          >
            {t('pool.docs')}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </Card>
  );
}

function nextPayoutLabel(): string {
  // Следующее 1-е число месяца — простая mock-эвристика.
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

function landingDocsStakingUrl(): string {
  const fromEnv = import.meta.env?.VITE_LANDING_URL;
  const base = typeof fromEnv === 'string' && fromEnv.length > 0
    ? fromEnv.replace(/\/$/, '')
    : 'https://ripple-community-wallet.app';
  return `${base}/docs/features/staking`;
}
