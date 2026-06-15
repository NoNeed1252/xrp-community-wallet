import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardBody, Helper, Donut } from '@rc/ui';
import { useTranslation } from 'react-i18next';
import { usePortfolioData } from '~/features/portfolio/hooks/usePortfolioData';
import { useEvmAssets } from '~/features/portfolio/hooks/useEvmAssets';
import { computeDonutBreakdown, type AssetHolding } from '~/features/portfolio/lib/compute';
import { assetIconUrl } from '~/lib/chains/assets/iconUrl';

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

function compactUsd(v: number): string {
  if (!Number.isFinite(v) || v === 0) return '$0';
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(2)}K`;
  return `$${v.toFixed(2)}`;
}

export function BalancesCard() {
  const { t } = useTranslation('dashboard');
  const xrpl = usePortfolioData();
  const evm = useEvmAssets();

  const holdings = useMemo<AssetHolding[]>(() => {
    const evmHoldings: AssetHolding[] = evm.holdings.map((h) => ({
      symbol: h.asset.symbol,
      name: h.asset.name,
      iconKey: h.asset.symbol.toLowerCase(),
      iconUrl: assetIconUrl(h.asset),
      balanceRaw: h.amountRaw.toString(),
      balance: h.amountHuman,
      priceUsd: h.priceUsd?.toString() ?? '0',
      valueUsd: h.valueUsd.toString(),
      change24hPct: h.change24h?.toString() ?? '0',
    }));
    return [xrpl.xrp, ...evmHoldings].filter((h) => Number(h.balance) > 0);
  }, [xrpl.xrp, evm.holdings]);

  const totalUsd = holdings.reduce((acc, h) => acc + (Number(h.valueUsd) || 0), 0);
  const donut = computeDonutBreakdown(holdings, 4);

  return (
    <Card>
      <CardHeader>
        <CardTitle helper={<Helper text={t('widgets.balances.helper')} />}>
          {t('widgets.balances.title')}
        </CardTitle>
      </CardHeader>
      <CardBody>
        <div className="flex items-center gap-4">
          <Donut
            segments={donut}
            size={156}
            thickness={18}
            centerCaption={t('widgets.balances.estTotalValue')}
            centerLabel={compactUsd(totalUsd)}
          />
          <ul className="flex flex-col gap-2 flex-1 min-w-0">
            {holdings.length === 0 && (
              <li className="text-caption text-neutral-500">{t('widgets.balances.empty')}</li>
            )}
            {donut
              .filter((seg) => seg.label !== 'Empty')
              .map((seg) => (
                <li key={seg.label} className="flex items-center gap-2 text-body whitespace-nowrap">
                  <span
                    className="inline-block h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: tokenToCss(seg.color) }}
                    aria-hidden="true"
                  />
                  <span className="text-neutral-700">
                    {seg.label} <span className="text-neutral-400">-</span>{' '}
                    <span className="font-medium text-neutral-900">{seg.percent}%</span>
                  </span>
                </li>
              ))}
          </ul>
        </div>
      </CardBody>
    </Card>
  );
}
