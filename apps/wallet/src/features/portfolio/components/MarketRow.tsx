import { CoinIcon, Td, Tr } from '@rc/ui';
import type { MarketAsset } from '../hooks/useMarketData';
import { formatChange24hPct } from '../lib/compute';
import { Sparkline } from './Sparkline';

interface Props {
  asset: MarketAsset;
}

export function MarketRow({ asset }: Props) {
  const change = formatChange24hPct(asset.change24hPct);
  const price = new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: Number(asset.priceUsd) < 1 ? 4 : 2,
  }).format(Number(asset.priceUsd) || 0);

  return (
    <Tr>
      <Td>
        <div className="flex items-center gap-3 min-w-0">
          <CoinIcon symbol={asset.symbol} size={28} src={asset.iconUrl} />
          <div className="min-w-0">
            <div className="text-body-strong text-neutral-900">{asset.symbol}</div>
            <div className="text-caption text-neutral-500 truncate">{asset.name}</div>
          </div>
        </div>
      </Td>
      <Td align="right" className="text-neutral-900">{price}</Td>
      <Td align="right" className={change?.positive ? 'text-success-700' : 'text-danger-700'}>
        {change ? change.label : '—'}
      </Td>
      <Td align="right" className="text-neutral-500">${asset.marketCapUsdCompact}</Td>
      <Td align="right">
        <Sparkline
          data={asset.sparkline24h}
          positive={change?.positive ?? true}
          ariaLabel={`24h chart for ${asset.symbol}`}
        />
      </Td>
    </Tr>
  );
}
