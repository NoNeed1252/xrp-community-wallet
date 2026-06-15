/**
 * 1 XRP = 1_000_000 drops. Конвертация без потери точности через строки.
 * Вход — целые drops в строке. Выход — XRP с десятичной частью без хвостовых нулей.
 */
export function dropsToXrp(drops: string): string {
  if (!/^-?\d+$/.test(drops)) {
    throw new Error(`dropsToXrp: invalid drops "${drops}"`);
  }
  const negative = drops.startsWith('-');
  const abs = negative ? drops.slice(1) : drops;
  const padded = abs.padStart(7, '0');
  const intPart = padded.slice(0, -6);
  const fracPart = padded.slice(-6).replace(/0+$/, '');
  const sign = negative ? '-' : '';
  return fracPart.length === 0 ? `${sign}${intPart}` : `${sign}${intPart}.${fracPart}`;
}
