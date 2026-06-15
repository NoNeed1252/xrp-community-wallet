/**
 * EVM address validation с EIP-55 checksum awareness.
 *
 * Поведение:
 * - Lowercase `0x...` (все 40 hex в нижнем регистре) — принимается.
 * - Mixed-case — проверяется по EIP-55 (через `viem.isAddress` с `{ strict: true }`).
 * - Uppercase only / прочее — отклоняется.
 *
 * Защита от опечаток в адресе (плана §7 — "address validation per chain, checksum sensitive").
 */
const SHAPE = /^0x[0-9a-fA-F]{40}$/u;

export async function isValidEvmAddress(input: string): Promise<boolean> {
  if (!SHAPE.test(input)) return false;
  const hex = input.slice(2);
  // Чистый lowercase валиден без checksum.
  if (hex === hex.toLowerCase()) return true;
  const { isAddress } = await import('viem');
  return isAddress(input, { strict: true });
}
