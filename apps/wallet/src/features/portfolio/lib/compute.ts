export interface AssetHolding {
  symbol: string;
  name: string;
  iconKey: string;
  /** Опциональный URL картинки (Trust Wallet CDN). Fallback на буквенный плейсхолдер. */
  iconUrl?: string;
  balanceRaw: string; // drops для XRP, decimal string для issued
  balance: string; // formatted (XRP units, e.g. "100.0")
  priceUsd: string;
  valueUsd: string;
  change24hPct: string | null;
}

export interface DonutSegment {
  label: string;
  percent: number;
  color: string;
}

/**
 * USD value = balance × priceUsd. Используем number math для USD-уровня
 * (значения < 10^15, безопасно в JS number). Точные суммы для отправки — BigInt.
 */
export function computeUsdValue(balance: string, priceUsd: string): string {
  const b = Number(balance);
  const p = Number(priceUsd);
  if (!Number.isFinite(b) || !Number.isFinite(p)) return '0';
  return (b * p).toFixed(2);
}

export function sumUsd(holdings: Pick<AssetHolding, 'valueUsd'>[]): string {
  const total = holdings.reduce((s, h) => s + Number(h.valueUsd || '0'), 0);
  return total.toFixed(2);
}

/**
 * Breakdown: top-N холдингов + остальные в «Other».
 * Возвращает [topN..., {label:'Other'}] или меньше если ассетов мало.
 */
const SEGMENT_COLORS = ['brand.600', 'brand.500', 'warning.700', 'success.700'];

export function computeDonutBreakdown(holdings: AssetHolding[], topN = 2): DonutSegment[] {
  if (holdings.length === 0) {
    return [{ label: 'Empty', percent: 100, color: 'neutral.300' }];
  }
  const total = holdings.reduce((s, h) => s + Number(h.valueUsd || '0'), 0);
  if (total === 0) {
    return [{ label: 'Empty', percent: 100, color: 'neutral.300' }];
  }
  const sorted = [...holdings].sort((a, b) => Number(b.valueUsd) - Number(a.valueUsd));
  const top = sorted.slice(0, topN);
  const rest = sorted.slice(topN);
  const segments: DonutSegment[] = top.map((h, i) => ({
    label: h.symbol,
    percent: Math.round((Number(h.valueUsd) / total) * 100),
    color: SEGMENT_COLORS[i] ?? 'neutral.300',
  }));
  if (rest.length > 0) {
    const restSum = rest.reduce((s, h) => s + Number(h.valueUsd), 0);
    segments.push({
      label: 'Other',
      percent: Math.round((restSum / total) * 100),
      color: 'warning.700',
    });
  }
  return segments;
}

export function formatChange24hPct(pct: string | null): { label: string; positive: boolean } | null {
  if (pct === null || pct === undefined || pct === '') return null;
  const n = Number(pct);
  if (!Number.isFinite(n)) return null;
  const positive = n >= 0;
  const formatted = `${positive ? '+' : ''}${n.toFixed(2)}%`;
  return { label: formatted, positive };
}
