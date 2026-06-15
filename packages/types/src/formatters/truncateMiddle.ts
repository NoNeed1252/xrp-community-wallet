/**
 * Усечение длинных строк с многоточием посередине.
 * Используется для имён beneficiary, длинных названий.
 */
export function truncateMiddle(s: string, max = 20): string {
  if (!s) return '';
  if (s.length <= max) return s;
  const keep = Math.max(1, Math.floor((max - 1) / 2));
  return `${s.slice(0, keep)}…${s.slice(-keep)}`;
}
