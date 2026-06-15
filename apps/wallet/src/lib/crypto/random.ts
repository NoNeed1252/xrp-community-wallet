/**
 * Криптографически стойкий random.
 * Никогда не используем Math.random для secret material.
 */

export function randomBytes(length: number): Uint8Array {
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    throw new Error('crypto.getRandomValues is not available');
  }
  const buf = new Uint8Array(length);
  crypto.getRandomValues(buf);
  return buf;
}

export function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return typeof btoa === 'function'
    ? btoa(bin)
    : Buffer.from(bytes).toString('base64');
}

export function fromBase64(str: string): Uint8Array {
  const bin = typeof atob === 'function' ? atob(str) : Buffer.from(str, 'base64').toString('binary');
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
