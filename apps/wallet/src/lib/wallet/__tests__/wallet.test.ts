import { describe, it, expect } from 'vitest';
import { generateSeedPhrase, isValidSeedPhrase, normalizePhrase } from '../seed';
import { deriveFromFamilySeed, deriveFromMnemonic, isValidFamilySeed } from '../keypair';

describe('seed', () => {
  it('generates 12 valid words', () => {
    const phrase = generateSeedPhrase();
    expect(phrase.split(' ')).toHaveLength(12);
    expect(isValidSeedPhrase(phrase)).toBe(true);
  });

  it('detects invalid checksum', () => {
    expect(
      isValidSeedPhrase('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon'),
    ).toBe(false);
  });

  it('accepts canonical BIP-39 test vector', () => {
    // 11x abandon + about — official vector.
    expect(
      isValidSeedPhrase('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'),
    ).toBe(true);
  });

  it('normalises whitespace and case', () => {
    expect(normalizePhrase('  ABANDON   abandon ')).toBe('abandon abandon');
  });
});

describe('keypair', () => {
  it('derives deterministic address from canonical seed phrase', () => {
    const phrase =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const a = deriveFromMnemonic(phrase);
    const b = deriveFromMnemonic(phrase);
    expect(a.address).toBe(b.address);
    expect(a.address.startsWith('r')).toBe(true);
    expect(a.publicKey).toHaveLength(66); // 33-byte compressed pubkey → 66 hex chars
  });

  it('different phrases give different addresses', () => {
    const p1 = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const p2 = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong';
    // p2 is invalid; pick another valid one
    const p2valid = generateSeedPhrase();
    expect(deriveFromMnemonic(p1).address).not.toBe(deriveFromMnemonic(p2valid).address);
  });

  it('isValidFamilySeed rejects junk and accepts derived seed', () => {
    expect(isValidFamilySeed('')).toBe(false);
    expect(isValidFamilySeed('garbage')).toBe(false);
    const phrase = generateSeedPhrase();
    const derived = deriveFromMnemonic(phrase);
    expect(isValidFamilySeed(derived.secret)).toBe(true);
  });

  it('deriveFromFamilySeed roundtrip matches mnemonic derivation', () => {
    const phrase =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const fromMnemonic = deriveFromMnemonic(phrase);
    const fromSeed = deriveFromFamilySeed(fromMnemonic.secret);
    expect(fromSeed.address).toBe(fromMnemonic.address);
    expect(fromSeed.publicKey).toBe(fromMnemonic.publicKey);
  });

  it('rejects malformed family seed', () => {
    expect(() => deriveFromFamilySeed('sNOTAVALIDSEED12345')).toThrow();
  });
});
