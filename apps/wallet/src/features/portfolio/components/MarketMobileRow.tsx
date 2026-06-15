import { CoinIcon } from '@rc/ui';
import type { MarketAsset } from '../hooks/useMarketData';
import { formatChange24hPct } from '../lib/compute';
import { Sparkline } from './Sparkline';

interface Props {
  asset: MarketAsset;
}

export function MarketMobileRow({ asset }: Props) {
  const change = formatChange24hPct(asset.change24hPct);
  const price = new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: Number(asset.priceUsd) < 1 ? 4 : 2,
  }).format(Number(asset.priceUsd) || 0);

  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <CoinIcon symbol={asset.symbol} size={32} src={asset.iconUrl} />
      <div className="min-w-0 flex-1">
        <div className="text-body-strong text-neutral-900 truncate">{asset.symbol}</div>
        <div className="text-caption text-neutral-500 truncate">{asset.name}</div>
      </div>
      <Sparkline
        data={asset.sparkline24h}
        positive={change?.positive ?? true}
        ariaLabel={`24h chart for ${asset.symbol}`}
      />
      <div className="text-right shrink-0">
        <div className="text-body-strong text-neutral-900 tabular-nums">{price}</div>
        <div className={`text-caption tabular-nums ${change?.positive ? 'text-success-700' : 'text-danger-700'}`}>
          {change ? change.label : '—'}
        </div>
      </div>
    </li>
  );
}
