import { useTranslation } from 'react-i18next';
import { Input } from '@rc/ui';
import { ArrowLeftRight, Banknote, Search, TrendingUp } from '@rc/ui';
import type { ReactNode } from 'react';
import type { HistoryTx, TxType } from '../lib/types';
import type { PeriodFilter, StatusFilter, TxFilters as TxFiltersState } from '../lib/filters';

interface Props {
  filters: TxFiltersState;
  onChange: (next: TxFiltersState) => void;
  /** Все транзакции (без фильтра) — для счётчиков. */
  totals?: readonly HistoryTx[];
}

const TYPE_OPTIONS: TxType[] = ['payment', 'staking_deposit', 'staking_payout'];
const PERIOD_OPTIONS: PeriodFilter[] = ['all', 'today', '7d', '30d'];
const STATUS_OPTIONS: StatusFilter[] = ['all', 'pending', 'completed', 'failed'];

const TYPE_ICONS: Record<TxType, ReactNode> = {
  payment: <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />,
  staking_deposit: <TrendingUp className="h-4 w-4" aria-hidden="true" />,
  staking_payout: <Banknote className="h-4 w-4" aria-hidden="true" />,
};

export function TxFilters({ filters, onChange, totals }: Props) {
  const { t } = useTranslation('history');

  const toggleType = (tt: TxType) => {
    const next = new Set(filters.types);
    if (next.has(tt)) {
      if (next.size > 1) next.delete(tt);
    } else next.add(tt);
    onChange({ ...filters, types: next });
  };

  const counters: Record<TxType, number> = {
    payment: 0,
    staking_deposit: 0,
    staking_payout: 0,
  };
  if (totals) for (const tx of totals) counters[tx.type] += 1;

  return (
    <div className="flex flex-col gap-3">
      <div
        role="tablist"
        className="inline-flex w-full sm:w-auto rounded-xl bg-nested p-1 gap-1 overflow-x-auto rc-no-scrollbar"
      >
        {TYPE_OPTIONS.map((tt) => {
          const active = filters.types.has(tt);
          const count = counters[tt];
          return (
            <button
              key={tt}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => toggleType(tt)}
              className={
                'group inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-body font-medium whitespace-nowrap transition-all flex-1 sm:flex-initial ' +
                (active
                  ? 'bg-surface text-brand-700 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900')
              }
            >
              <span className={active ? 'text-brand-600' : 'text-neutral-400 group-hover:text-neutral-600'}>
                {TYPE_ICONS[tt]}
              </span>
              <span>{t(`filters.types.${tt}`)}</span>
              {totals && count > 0 && (
                <span
                  className={
                    'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-caption font-medium tabular-nums ' +
                    (active
                      ? 'bg-brand-50 text-brand-700'
                      : 'bg-neutral-100 text-neutral-500 group-hover:bg-neutral-200')
                  }
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-caption text-neutral-500">
          {t('filters.status.label')}
          <select
            className="h-9 rounded-md border border-neutral-300 bg-surface px-2 text-body text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-600"
            value={filters.status}
            onChange={(e) => onChange({ ...filters, status: e.target.value as StatusFilter })}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {t(`filters.status.${s}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-caption text-neutral-500">
          {t('filters.period.label')}
          <select
            className="h-9 rounded-md border border-neutral-300 bg-surface px-2 text-body text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-600"
            value={filters.period}
            onChange={(e) => onChange({ ...filters, period: e.target.value as PeriodFilter })}
          >
            {PERIOD_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {t(`filters.period.${p}`)}
              </option>
            ))}
          </select>
        </label>

        <div className="flex-1 min-w-[200px]">
          <Input
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder={t('filters.search.placeholder')}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>
    </div>
  );
}
