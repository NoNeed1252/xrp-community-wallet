import { CoinIcon, Td, Tr } from '@rc/ui';
import { formatCrypto } from '@rc/types';
import type { AssetHolding } from '../lib/compute';
import { formatChange24hPct } from '../lib/compute';

interface Props {
  asset: AssetHolding;
}

export function AssetRow({ asset }: Props) {
  const change = formatChange24hPct(asset.change24hPct);
  const usd = new Intl.NumberFormat('en', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(
    Number(asset.valueUsd) || 0,
  );
  const price = new Intl.NumberFormat('en', { style: 'currency', currency: 'USD', maximumFractionDigits: 4 }).format(
    Number(asset.priceUsd) || 0,
  );
  const balance = formatCrypto(asset.balance, asset.symbol).value;

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
      <Td align="right" className="text-neutral-900 font-medium">
        {balance} <span className="text-neutral-500">{asset.symbol}</span>
      </Td>
      <Td align="right" className="text-neutral-900 font-medium">{usd}</Td>
      <Td align="right" className={change?.positive ? 'text-success-700' : 'text-danger-700'}>
        {change ? change.label : '—'}
      </Td>
    </Tr>
  );
}
