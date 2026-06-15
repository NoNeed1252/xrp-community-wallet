/**
 * Форматирует ISO timestamp в стиль таблиц дашборда: "09/04 15:23".
 * mode='full' — полная дата с временем, mode='short' — MM/DD HH:mm.
 */
export function formatDateTime(
  iso: string,
  locale = 'en',
  mode: 'short' | 'full' = 'short',
): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  if (mode === 'full') {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  }

  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${mm}/${dd} ${hh}:${mins}`;
}
