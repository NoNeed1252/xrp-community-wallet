import { generateMnemonic, mnemonicToEntropy, validateMnemonic } from '@scure/bip39';
import { wordlist as english } from '@scure/bip39/wordlists/english';

export const WORDLIST = english;

/** Generate 12-word (128-bit entropy) English BIP-39 mnemonic. */
export function generateSeedPhrase(): string {
  return generateMnemonic(english, 128);
}

export function isValidSeedPhrase(phrase: string): boolean {
  const normalized = normalizePhrase(phrase);
  if (!normalized) return false;
  return validateMnemonic(normalized, english);
}

export function normalizePhrase(phrase: string): string {
  return phrase.trim().toLowerCase().split(/\s+/u).join(' ');
}

export function mnemonicToEntropyHex(phrase: string): string {
  const bytes = mnemonicToEntropy(normalizePhrase(phrase), english);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Return list of indexes in WORDLIST for each word, -1 if not found. */
export function tokensToIndexes(phrase: string): number[] {
  return normalizePhrase(phrase)
    .split(' ')
    .map((w) => english.indexOf(w));
}
