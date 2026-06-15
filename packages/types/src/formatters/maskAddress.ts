/**
 * Маскирует адрес для UI: первые `prefix` + многоточие + последние `suffix`.
 * Если адрес короче порога — возвращает как есть.
 */
export function maskAddress(address: string, prefix = 4, suffix = 4): string {
  if (!address) return '';
  const min = prefix + suffix + 3;
  if (address.length <= min) return address;
  return `${address.slice(0, prefix)}…${address.slice(-suffix)}`;
}
