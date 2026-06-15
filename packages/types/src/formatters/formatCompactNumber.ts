/**
 * Compact формат больших чисел: 935000 → "935k", 1240000 → "1.24M".
 * Использует Intl.NumberFormat compact. Для очень маленьких — обычный формат.
 */
export function formatCompactNumber(
  n: number | string,
  locale = 'en',
  fractionDigits = 2,
): string {
  const value = typeof n === 'string' ? Number(n) : n;
  if (!Number.isFinite(value)) return '—';
  const absValue = Math.abs(value);
  if (absValue < 1000) {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: fractionDigits,
    }).format(value);
  }
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: fractionDigits,
  }).format(value);
}
