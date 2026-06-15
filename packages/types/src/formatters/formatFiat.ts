/**
 * Форматирование фиатной суммы по локали.
 * amount — строка или число; currency — ISO код; locale — BCP-47.
 */
export function formatFiat(
  amount: number | string,
  currency: string,
  locale = 'en',
  maximumFractionDigits = 2,
): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits,
    minimumFractionDigits: 2,
  }).format(value);
}
