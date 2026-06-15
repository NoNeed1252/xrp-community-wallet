/**
 * Парсит пользовательский ввод XRP в drops (целые, как string).
 * Принимает: "1", "1.5", "1.000001", "0.000001". До 6 знаков после точки.
 * Запятая трактуется как точка. Возвращает null если не парсится.
 */
export function parseXrpInput(raw: string): string | null {
  if (!raw) return null;
  const normalized = raw.trim().replace(/,/g, '.');
  if (!/^\d+(\.\d{0,6})?$/.test(normalized)) return null;

  const [intPart, fracPartRaw = ''] = normalized.split('.');
  const fracPadded = fracPartRaw.padEnd(6, '0');
  const intStripped = intPart!.replace(/^0+(?=\d)/, '') || '0';
  const combined = `${intStripped}${fracPadded}`;
  // Strip leading zeros (but keep at least one)
  const result = combined.replace(/^0+(?=\d)/, '') || '0';
  return result;
}
