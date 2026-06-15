import { sign as signMessage, deriveKeypair, deriveAddress } from 'ripple-keypairs';
import { getApiClient } from '../../lib/api/client';

export interface SignInOptions {
  /** Optional XRPL family seed; required if no Ledger transport is provided. */
  seed?: string;
  /** Optional explicit address override; otherwise derived from the seed. */
  address?: string;
  /** Optional already-derived keypair; bypasses seed derivation. */
  keypair?: { publicKey: string; privateKey: string };
}

export interface SignInResult {
  accessToken: string;
  accessExpiresAt: string;
  userId: string;
}

export async function walletSignIn(opts: SignInOptions): Promise<SignInResult> {
  const keypair = opts.keypair ?? (opts.seed ? deriveKeypair(opts.seed) : null);
  if (!keypair) {
    throw new Error('walletSignIn: provide seed or keypair');
  }
  const address = opts.address ?? deriveAddress(keypair.publicKey);
  const api = getApiClient();
  const nonceRes = await api.createWalletNonce(address);
  const messageHex = utf8ToHexUpper(nonceRes.data.message);
  const signature = signMessage(messageHex, keypair.privateKey);
  const verifyRes = await api.verifyWalletSignature({
    address,
    nonce: nonceRes.data.nonce,
    signature,
    publicKey: keypair.publicKey,
  });
  if (!verifyRes.data.userId) {
    throw new Error('walletSignIn: backend returned no userId');
  }
  return {
    accessToken: verifyRes.data.accessToken,
    accessExpiresAt: verifyRes.data.accessExpiresAt,
    userId: verifyRes.data.userId,
  };
}

function utf8ToHexUpper(value: string): string {
  let hex = '';
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code < 0x80) {
      hex += code.toString(16).padStart(2, '0');
    } else if (code < 0x800) {
      hex += (0xc0 | (code >> 6)).toString(16).padStart(2, '0');
      hex += (0x80 | (code & 0x3f)).toString(16).padStart(2, '0');
    } else {
      hex += (0xe0 | (code >> 12)).toString(16).padStart(2, '0');
      hex += (0x80 | ((code >> 6) & 0x3f)).toString(16).padStart(2, '0');
      hex += (0x80 | (code & 0x3f)).toString(16).padStart(2, '0');
    }
  }
  return hex.toUpperCase();
}
