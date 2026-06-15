/**
 * Ledger XRP integration. Все импорты @ledgerhq/* — dynamic, чтобы lazy chunk
 * не попадал в main bundle. ADR-043, ADR-044.
 */

export const DEFAULT_XRP_PATH = "44'/144'/0'/0/0";

// BIP-44 для XRPL: m/44'/144'/account'/change/index. Любой другой path — отказ.
// Защищает от blind‑signing на чужой coin или прокси‑аккаунте.
const XRP_PATH_RE = /^44'\/144'\/\d+'\/\d+\/\d+$/;

export function isXrpPath(path: string): boolean {
  return XRP_PATH_RE.test(path);
}

export interface LedgerError extends Error {
  code: LedgerErrorCode;
}

export type LedgerErrorCode =
  | 'unsupported'
  | 'permission_denied'
  | 'no_device'
  | 'transport'
  | 'app_not_open'
  | 'app_locked'
  | 'user_rejected'
  | 'timeout'
  | 'path_forbidden'
  | 'address_mismatch'
  | 'generic';

export function isWebHidSupported(): boolean {
  return typeof navigator !== 'undefined' && 'hid' in navigator;
}

function makeError(code: LedgerErrorCode, msg: string = code): LedgerError {
  const err = new Error(msg) as LedgerError;
  err.code = code;
  return err;
}

/**
 * Map APDU / transport errors to our LedgerErrorCode whitelist.
 * См. https://developers.ledger.com/docs/embedded-app/sdk-status-codes.
 */
export function mapTransportError(e: unknown): LedgerError {
  // Сохраняем code, message в LedgerError, но в UI рендерим только локализованный
  // текст по `code` — raw message не показываем (может содержать low‑level details).
  if ((e as LedgerError | undefined)?.code) return e as LedgerError;
  if (e instanceof Error) {
    const msg = e.message.toLowerCase();
    const sw = (e as { statusCode?: number; statusText?: string }).statusCode;
    if (sw === 0x6e00 || sw === 0x6d00) return makeError('app_not_open', e.message);
    if (sw === 0x5515) return makeError('app_locked', e.message);
    if (sw === 0x6985) return makeError('user_rejected', e.message);
    if (sw === 0x6a82 || sw === 0x6804) return makeError('path_forbidden', e.message);
    if (msg.includes('permission') || msg.includes('denied')) return makeError('permission_denied', e.message);
    if (msg.includes('no device') || msg.includes('access denied')) return makeError('no_device', e.message);
    if (msg.includes('timeout')) return makeError('timeout', e.message);
    if (msg.includes('transport')) return makeError('transport', e.message);
  }
  return makeError('generic', e instanceof Error ? e.message : String(e));
}

interface DeriveResult {
  address: string;
  publicKey: string;
  derivationPath: string;
  deviceName: string;
}

/**
 * Открыть transport, получить publicKey + address, закрыть transport.
 * Просит permission у browser — нужен user gesture.
 */
export async function connectAndDerive(path = DEFAULT_XRP_PATH): Promise<DeriveResult> {
  if (!isWebHidSupported()) throw makeError('unsupported');
  if (!isXrpPath(path)) throw makeError('path_forbidden');
  const [{ default: TransportWebHID }, { default: Xrp }, rippleKeypairs] = await Promise.all([
    import('@ledgerhq/hw-transport-webhid'),
    import('@ledgerhq/hw-app-xrp'),
    import('ripple-keypairs'),
  ]);
  let transport: { close: () => Promise<void>; deviceModel?: { productName?: string } } | null = null;
  try {
    transport = (await TransportWebHID.create()) as unknown as {
      close: () => Promise<void>;
      deviceModel?: { productName?: string };
    };
    const xrp = new Xrp(transport as unknown as ConstructorParameters<typeof Xrp>[0]);
    // display=true: устройство покажет address и попросит подтвердить — защита от
    // подмены адреса скомпрометированной страницей/прокси.
    const result = await xrp.getAddress(path, true);
    // Sanity: derive address из publicKey и сравнить с тем, что вернул Ledger.
    // Если не совпало — что‑то очень не так (broken transport / wrong app).
    const localAddr = rippleKeypairs.deriveAddress(result.publicKey);
    if (localAddr !== result.address) throw makeError('address_mismatch');
    return {
      address: result.address,
      publicKey: result.publicKey,
      derivationPath: path,
      deviceName: transport.deviceModel?.productName ?? 'Ledger',
    };
  } catch (e) {
    throw mapTransportError(e);
  } finally {
    if (transport) {
      try {
        await transport.close();
      } catch {
        // ignore
      }
    }
  }
}

export interface LedgerSignInput {
  destination: string;
  amountDrops: string;
  feeDrops: string;
  destinationTag?: number;
  memoText?: string;
  fromAddress: string;
  derivationPath: string;
}

export interface LedgerSignResult {
  txHex: string;
  txHash: string;
}

/**
 * Ledger XRPL signing is **not yet implemented**. Until real Payment-blob
 * encoding + `xrp.signTransaction(display=true)` ship, this function refuses
 * to operate so callers cannot accidentally submit a mock hash to the
 * network (security audit C1).
 */
export async function signWithLedger(_input: LedgerSignInput): Promise<LedgerSignResult> {
  throw makeError(
    'unsupported',
    'Ledger XRPL signing is not yet implemented in this build.',
  );
}
