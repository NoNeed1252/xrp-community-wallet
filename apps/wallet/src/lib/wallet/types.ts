import type { KdfParams } from '../crypto/kdf';
import type { Locale } from '@rc/i18n';

export type { Locale };

export type WalletKind =
  | 'seed_generated'
  | 'imported_seed'
  | 'imported_key'
  | 'ledger_hardware'
  | 'multi_chain';

export type ChainId = 'xrpl' | 'eth' | 'bsc' | 'pol';

export interface ChainAccount {
  chain: ChainId;
  address: string;
  publicKey?: string;
}

export interface EncryptedBlob {
  v: 1;
  cipher: 'AES-GCM-256';
  kdf: KdfParams;
  salt: string; // base64
  nonce: string; // base64
  ciphertext: string; // base64
}

export interface WalletProfile {
  id: string;
  label: string;
  /** Основной (legacy) address — для XRPL-only профилей это XRPL `r…`. Для multi_chain — XRPL address (primary). */
  address: string;
  publicKey: string;
  kind: WalletKind;
  createdAt: string;
  /** True after we've observed ≥ 1 XRP on-chain. Default false; set live in integration step. */
  activated: boolean;
  /** Только для kind='ledger_hardware'. Дефолт `44'/144'/0'/0/0`. */
  derivationPath?: string;
  encryptedBlob?: EncryptedBlob;
  /** Только для kind='multi_chain'. Все production адреса (XRPL + EVM). */
  chains?: ChainAccount[];
}

export interface AddLedgerInput {
  publicKey: string;
  address: string;
  derivationPath: string;
  label?: string;
}

export interface SubAccount {
  id: string;
  accountId: string;
  label: string;
  destinationTag: number;
  note?: string;
  createdAt: string;
}

export type Theme = 'light' | 'dark' | 'system';
export type AutoLockMinutes = 1 | 5 | 15 | 30 | 60;

export interface UserPreferences {
  activeAccountId: string;
  autoLockMinutes: AutoLockMinutes;
  lockOnHidden: boolean;
  locale: Locale;
  theme: Theme;
  compactNumbers: boolean;
}

export type VaultStatus = 'empty' | 'locked' | 'unlocked';

export interface CreateInput {
  kind: 'seed_generated' | 'imported_seed' | 'imported_key';
  /** mnemonic phrase (seed_generated, imported_seed) ИЛИ family seed (imported_key) */
  secretMaterial: string;
  password: string;
  label?: string;
}

export interface AddAccountInput {
  kind: 'seed_generated' | 'imported_seed' | 'imported_key';
  secretMaterial: string;
  label?: string;
}
