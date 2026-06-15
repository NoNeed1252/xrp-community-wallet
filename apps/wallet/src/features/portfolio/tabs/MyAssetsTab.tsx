import { useMemo } from 'react';
import { Button, Card, EmptyState, Table, Th, Tr, useMediaQuery, Wallet } from '@rc/ui';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { useEvmAssets } from '../hooks/useEvmAssets';
import { TotalValueBlock } from '../components/TotalValueBlock';
import { AssetRow } from '../components/AssetRow';
import { AssetMobileRow } from '../components/AssetMobileRow';
import type { AssetHolding } from '../lib/compute';
import { computeDonutBreakdown } from '../lib/compute';
import { assetIconUrl } from '~/lib/chains/assets/iconUrl';

export function MyAssetsTab() {
  const { t } = useTranslation('portfolio');
  const navigate = useNavigate();
  const xrplData = usePortfolioData();
  const evm = useEvmAssets();
  const isCompact = useMediaQuery('(max-width: 767px)');

  const allHoldings = useMemo<AssetHolding[]>(() => {
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
    return [xrplData.xrp, ...evmHoldings];
  }, [xrplData.xrp, evm.holdings]);

  const visibleHoldings = useMemo(
    () => allHoldings.filter((h) => Number(h.balance) > 0),
    [allHoldings],
  );

  const totalUsd = useMemo(
    () =>
      visibleHoldings
        .reduce((acc, h) => acc + (Number(h.valueUsd) || 0), 0)
        .toFixed(2),
    [visibleHoldings],
  );

  const change24h = useMemo(() => {
    const total = Number(totalUsd) || 1;
    const weighted = visibleHoldings.reduce((sum, h) => {
      const w = (Number(h.valueUsd) || 0) / total;
      const c = Number(h.change24hPct ?? '0');
      return sum + (Number.isFinite(c) ? c * w : 0);
    }, 0);
    return weighted.toFixed(2);
  }, [visibleHoldings, totalUsd]);

  const donut = useMemo(() => computeDonutBreakdown(visibleHoldings, 4), [visibleHoldings]);

  const empty = visibleHoldings.length === 0;

  if (empty) {
    return (
      <Card>
        <EmptyState
          icon={<Wallet className="h-10 w-10" />}
          title={t('holdings.empty.title')}
          body={t('holdings.empty.body')}
          action={<Button onClick={() => navigate('/receive')}>{t('holdings.empty.cta')}</Button>}
        />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <TotalValueBlock totalUsd={totalUsd} change24hPct={change24h} donut={donut} />
      </Card>

      <Card>
        {isCompact ? (
          <ul className="flex flex-col divide-y divide-neutral-200">
            {visibleHoldings.map((a) => (
              <AssetMobileRow key={`${a.symbol}-${a.iconKey}`} asset={a} />
            ))}
          </ul>
        ) : (
          <Table className="table-fixed">
            <colgroup>
              <col />
              <col className="w-[140px]" />
              <col className="w-[180px]" />
              <col className="w-[160px]" />
              <col className="w-[120px]" />
            </colgroup>
            <thead>
              <Tr>
                <Th>{t('holdings.columns.asset')}</Th>
                <Th align="right">{t('holdings.columns.price')}</Th>
                <Th align="right">{t('holdings.columns.balance')}</Th>
                <Th align="right">{t('holdings.columns.value')}</Th>
                <Th align="right">{t('holdings.columns.change24h')}</Th>
              </Tr>
            </thead>
            <tbody>
              {visibleHoldings.map((a) => (
                <AssetRow key={`${a.symbol}-${a.iconKey}`} asset={a} />
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
