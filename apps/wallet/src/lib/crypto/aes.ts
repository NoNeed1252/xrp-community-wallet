import { fromBase64, randomBytes, toBase64 } from './random';

/**
 * AES-GCM-256 поверх Web Crypto API.
 * Cast'ы к BufferSource — обход TS 5.7 narrowing Uint8Array<ArrayBufferLike>.
 */

async function importKey(rawKey: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    rawKey as unknown as BufferSource,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  );
}

export interface AesPayload {
  ciphertext: string; // base64
  nonce: string; // base64 (12 bytes)
}

export async function aesEncrypt(rawKey: Uint8Array, plaintext: string): Promise<AesPayload> {
  if (rawKey.length !== 32) throw new Error('AES-GCM-256 expects 32-byte key');
  const key = await importKey(rawKey);
  const nonce = randomBytes(12);
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce as unknown as BufferSource },
    key,
    new TextEncoder().encode(plaintext) as unknown as BufferSource,
  );
  return {
    ciphertext: toBase64(new Uint8Array(ct)),
    nonce: toBase64(nonce),
  };
}

export async function aesDecrypt(
  rawKey: Uint8Array,
  payload: AesPayload,
): Promise<string> {
  if (rawKey.length !== 32) throw new Error('AES-GCM-256 expects 32-byte key');
  const key = await importKey(rawKey);
  const nonce = fromBase64(payload.nonce);
  const ct = fromBase64(payload.ciphertext);
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: nonce as unknown as BufferSource },
    key,
    ct as unknown as BufferSource,
  );
  return new TextDecoder().decode(pt);
}
