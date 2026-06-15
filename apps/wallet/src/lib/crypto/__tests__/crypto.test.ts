import { describe, it, expect } from 'vitest';
import { deriveKey, DEFAULT_KDF } from '../kdf';
import { aesEncrypt, aesDecrypt } from '../aes';
import { randomBytes } from '../random';

describe('kdf', () => {
  it('derives deterministic 32-byte key for the same password and salt', () => {
    const salt = new Uint8Array(16).fill(7);
    const k1 = deriveKey('correct horse battery staple', salt, {
      ...DEFAULT_KDF,
      t: 1,
      m: 1024,
    });
    const k2 = deriveKey('correct horse battery staple', salt, {
      ...DEFAULT_KDF,
      t: 1,
      m: 1024,
    });
    expect(k1).toHaveLength(32);
    expect(Array.from(k1)).toEqual(Array.from(k2));
  });

  it('different password gives different key', () => {
    const salt = new Uint8Array(16).fill(7);
    const a = deriveKey('a', salt, { ...DEFAULT_KDF, t: 1, m: 1024 });
    const b = deriveKey('b', salt, { ...DEFAULT_KDF, t: 1, m: 1024 });
    expect(Array.from(a)).not.toEqual(Array.from(b));
  });
});

describe('aes', () => {
  it('roundtrip encrypt → decrypt', async () => {
    const key = randomBytes(32);
    const plaintext = 'hello world — секретное сообщение';
    const enc = await aesEncrypt(key, plaintext);
    expect(enc.ciphertext).toBeTruthy();
    expect(enc.nonce).toBeTruthy();
    const dec = await aesDecrypt(key, enc);
    expect(dec).toBe(plaintext);
  });

  it('wrong key fails to decrypt', async () => {
    const key = randomBytes(32);
    const wrong = randomBytes(32);
    const enc = await aesEncrypt(key, 'secret');
    await expect(aesDecrypt(wrong, enc)).rejects.toThrow();
  });

  it('non-32-byte key rejected', () => {
    return expect(aesEncrypt(new Uint8Array(16), 'x')).rejects.toThrow();
  });
});
