/**
 * Форматирует крипто-сумму: значащие цифры, обрезание хвостовых нулей, без exp-нотации для мелких.
 * Возвращает { value, symbol }.
 */
export interface FormatCryptoResult {
  value: string;
  symbol: string;
}

export function formatCrypto(
  amount: number | string,
  symbol: string,
  opts: { locale?: string; maxSignificantDigits?: number; maxFractionDigits?: number } = {},
): FormatCryptoResult {
  const { locale = 'en', maxSignificantDigits = 7, maxFractionDigits = 6 } = opts;
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(value)) return { value: '—', symbol };

  if (value === 0) return { value: '0', symbol };

  const abs = Math.abs(value);
  // Очень малые числа — фиксируем точность, чтобы не получить экспоненту.
  if (abs > 0 && abs < 0.000001) {
    return {
      value: value.toFixed(maxFractionDigits).replace(/\.?0+$/, ''),
      symbol,
    };
  }

  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: maxFractionDigits,
    maximumSignificantDigits: maxSignificantDigits,
  }).format(value);

  return { value: formatted, symbol };
}
