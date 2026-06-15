import { mnemonicToEntropy } from '@scure/bip39';
import { wordlist as english } from '@scure/bip39/wordlists/english';
import * as rippleKeypairs from 'ripple-keypairs';
import { normalizePhrase } from './seed';

export interface DerivedAccount {
  address: string;
  publicKey: string;
  /** Internal-use only. Never logged. Stored encrypted in vault. */
  secret: string;
}

/**
 * Derive XRPL keypair + address.
 * - For seed phrase: BIP-39 entropy → ed25519 XRPL family seed.
 * - For private key (familySeed `s***` / `sEd...`): pass through.
 */

export function deriveFromFamilySeed(secret: string): DerivedAccount {
  const trimmed = secret.trim();
  if (!isValidFamilySeed(trimmed)) {
    throw new Error('invalid XRPL family seed (expected sEd... or s...)');
  }
  const keypair = rippleKeypairs.deriveKeypair(trimmed);
  const address = rippleKeypairs.deriveAddress(keypair.publicKey);
  return { address, publicKey: keypair.publicKey, secret: trimmed };
}

export function deriveFromMnemonic(phrase: string): DerivedAccount {
  const entropy = mnemonicToEntropy(normalizePhrase(phrase), english);
  const seed = rippleKeypairs.generateSeed({
    entropy: Uint8Array.from(entropy),
    algorithm: 'ed25519',
  });
  return deriveFromFamilySeed(seed);
}

export function isValidFamilySeed(secret: string): boolean {
  if (!secret) return false;
  try {
    rippleKeypairs.deriveKeypair(secret);
    return true;
  } catch {
    return false;
  }
}
