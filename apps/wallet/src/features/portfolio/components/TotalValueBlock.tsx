import { Donut, useMediaQuery } from '@rc/ui';
import { useTranslation } from 'react-i18next';
import { formatChange24hPct, type DonutSegment } from '../lib/compute';

interface Props {
  totalUsd: string;
  change24hPct: string;
  donut: DonutSegment[];
}

function tokenToCss(token: string): string {
  const map: Record<string, string> = {
    'brand.600': 'rgb(var(--rc-brand-600))',
    'brand.500': 'rgb(var(--rc-brand-500))',
    'brand.100': 'rgb(var(--rc-brand-100))',
    'warning.700': 'rgb(var(--rc-warning-700))',
    'success.700': 'rgb(var(--rc-success-700))',
    'neutral.300': 'rgb(var(--rc-neutral-300))',
  };
  return map[token] ?? token;
}

export function TotalValueBlock({ totalUsd, change24hPct, donut }: Props) {
  const { t } = useTranslation('portfolio');
  const isCompact = useMediaQuery('(max-width: 767px)');
  const change = formatChange24hPct(change24hPct);
  const totalFormatted = new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number(totalUsd) || 0);

  return (
    <div className={isCompact ? 'flex flex-col items-center gap-4' : 'flex items-center gap-8'}>
      <Donut segments={donut} size={isCompact ? 140 : 180} thickness={20} />
      <div className={isCompact ? 'flex flex-col items-center text-center gap-2' : 'flex flex-col gap-1'}>
        <span className="text-caption text-neutral-500">{t('total.label')}</span>
        <span className="text-display text-neutral-900 tabular-nums">{totalFormatted}</span>
        {change && (
          <span className={change.positive ? 'text-body text-success-700' : 'text-body text-danger-700'}>
            {change.positive
              ? t('total.change24h.up', { pct: change.label.replace(/^[+−-]/u, '').replace('%', '') })
              : t('total.change24h.down', { pct: change.label.replace(/^[+−-]/u, '').replace('%', '') })}
          </span>
        )}
        <ul className="flex flex-col gap-1 mt-2">
          {donut.map((seg) => (
            <li key={seg.label} className="flex items-center gap-2 text-body whitespace-nowrap">
              <span
                className="inline-block h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: tokenToCss(seg.color) }}
                aria-hidden
              />
              <span className="text-neutral-700">
                {seg.label} <span className="text-neutral-400">·</span>{' '}
                <span className="font-medium text-neutral-900">{seg.percent}%</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
