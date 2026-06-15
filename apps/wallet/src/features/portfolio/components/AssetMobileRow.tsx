import { CoinIcon } from '@rc/ui';
import { formatCrypto } from '@rc/types';
import type { AssetHolding } from '../lib/compute';
import { formatChange24hPct } from '../lib/compute';

interface Props {
  asset: AssetHolding;
}

export function AssetMobileRow({ asset }: Props) {
  const change = formatChange24hPct(asset.change24hPct);
  const usd = new Intl.NumberFormat('en', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(
    Number(asset.valueUsd) || 0,
  );
  const balance = formatCrypto(asset.balance, asset.symbol).value;

  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <CoinIcon symbol={asset.symbol} size={32} src={asset.iconUrl} />
      <div className="min-w-0 flex-1">
        <div className="text-body-strong text-neutral-900 truncate">{asset.symbol}</div>
        <div className="text-caption text-neutral-500 tabular-nums">
          {balance} {asset.symbol}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-body-strong text-neutral-900 tabular-nums">{usd}</div>
        <div className={`text-caption tabular-nums ${change?.positive ? 'text-success-700' : 'text-danger-700'}`}>
          {change ? change.label : '—'}
        </div>
      </div>
    </li>
  );
}
