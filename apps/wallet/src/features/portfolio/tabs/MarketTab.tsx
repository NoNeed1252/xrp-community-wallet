import { Card, ErrorState, LoadingState, Table, Th, Tr, useMediaQuery } from '@rc/ui';
import { useTranslation } from 'react-i18next';
import { useMarketData } from '../hooks/useMarketData';
import { MarketRow } from '../components/MarketRow';
import { MarketMobileRow } from '../components/MarketMobileRow';

export function MarketTab() {
  const { t } = useTranslation('portfolio');
  const { assets, loading, error } = useMarketData();
  const isCompact = useMediaQuery('(max-width: 767px)');

  if (loading) {
    return (
      <Card>
        <LoadingState variant="card" label={t('market.loading')} />
      </Card>
    );
  }

  if (error || assets.length === 0) {
    return (
      <Card>
        <ErrorState
          title={t('market.error.title')}
          body={t('market.error.body')}
        />
      </Card>
    );
  }

  if (isCompact) {
    return (
      <Card>
        <ul className="flex flex-col divide-y divide-neutral-200">
          {assets.map((a) => (
            <MarketMobileRow key={a.symbol} asset={a} />
          ))}
        </ul>
      </Card>
    );
  }

  return (
    <Card>
      <Table className="table-fixed">
        <colgroup>
          <col />
          <col className="w-[160px]" />
          <col className="w-[120px]" />
          <col className="w-[140px]" />
          <col className="w-[120px]" />
        </colgroup>
        <thead>
          <Tr>
            <Th>{t('market.columns.asset')}</Th>
            <Th align="right">{t('market.columns.price')}</Th>
            <Th align="right">{t('market.columns.change24h')}</Th>
            <Th align="right">{t('market.columns.marketCap')}</Th>
            <Th align="right">{t('market.columns.chart')}</Th>
          </Tr>
        </thead>
        <tbody>
          {assets.map((a) => (
            <MarketRow key={a.symbol} asset={a} />
          ))}
        </tbody>
      </Table>
    </Card>
  );
}
