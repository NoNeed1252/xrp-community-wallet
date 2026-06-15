import { HDKey } from '@scure/bip32';
import { mnemonicToSeed } from '@scure/bip39';
import { normalizePhrase } from './seed';

// ADR-054 — BIP-44 EVM path; account 0, change 0, index 0 (один EVM-address на профиль в W10).
export const EVM_PATH = "m/44'/60'/0'/0/0";

export interface EvmAccount {
  /** EIP-55 checksum address. */
  address: `0x${string}`;
  /** 32-byte hex (без 0x). Internal-only; не логируется. */
  privateKey: string;
  /** 33-byte compressed pubkey, hex (без 0x). */
  publicKey: string;
}

function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += bytes[i]!.toString(16).padStart(2, '0');
  return out;
}

export async function deriveEvm(mnemonic: string, path: string = EVM_PATH): Promise<EvmAccount> {
  const normalized = normalizePhrase(mnemonic);
  const seed = await mnemonicToSeed(normalized);
  const hd = HDKey.fromMasterSeed(seed);
  const child = hd.derive(path);
  if (!child.privateKey || !child.publicKey) {
    throw new Error('hd: derivation produced empty key');
  }
  const privateKeyHex = bytesToHex(child.privateKey);
  const { privateKeyToAddress } = await import('viem/accounts');
  const address = privateKeyToAddress(`0x${privateKeyHex}`);
  return {
    address,
    privateKey: privateKeyHex,
    publicKey: bytesToHex(child.publicKey),
  };
}
