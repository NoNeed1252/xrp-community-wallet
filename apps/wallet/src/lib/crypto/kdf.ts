import { argon2id } from '@noble/hashes/argon2';

/**
 * KDF: пароль + соль → 32-байтный ключ для AES-GCM-256.
 * Параметры — ADR-013.
 */
export interface KdfParams {
  name: 'argon2id';
  t: number;
  m: number;
  p: number;
}

export const DEFAULT_KDF: KdfParams = {
  name: 'argon2id',
  t: 2,
  m: 19456, // 19 MiB — OWASP 2024 interactive minimum (m=19456 KiB, t=2, p=1)
  p: 1,
};

/**
 * Sync Argon2id via @noble/hashes. Kept for legacy tests and Node-only callers.
 * Production paths use {@link deriveKeyAsync}, which runs WASM either in a Web Worker
 * (browser) or directly (Node), keeping the main thread free.
 */
export function deriveKey(
  password: string,
  salt: Uint8Array,
  params: KdfParams = DEFAULT_KDF,
): Uint8Array {
  if (params.name !== 'argon2id') {
    throw new Error(`unsupported KDF ${params.name}`);
  }
  return argon2id(password, salt, {
    t: params.t,
    m: params.m,
    p: params.p,
    dkLen: 32,
  });
}

let workerInstance: Worker | null | undefined;
let workerReqId = 0;

function getWorker(): Worker | null {
  if (workerInstance !== undefined) return workerInstance;
  try {
    if (typeof Worker === 'undefined') {
      workerInstance = null;
      return null;
    }
    workerInstance = new Worker(new URL('./kdfWorker.ts', import.meta.url), { type: 'module' });
    return workerInstance;
  } catch {
    workerInstance = null;
    return null;
  }
}

async function deriveKeyWasm(
  password: string,
  salt: Uint8Array,
  params: KdfParams,
): Promise<Uint8Array> {
  const { argon2id: argon2idWasm } = await import('hash-wasm');
  const hex = await argon2idWasm({
    password,
    salt,
    parallelism: params.p,
    iterations: params.t,
    memorySize: params.m,
    hashLength: 32,
    outputType: 'hex',
  });
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i += 1) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/**
 * Async Argon2id. In browsers offloads WASM derivation to a Web Worker so the UI stays
 * responsive during onboarding/unlock. In Node (tests) runs WASM directly. The hashing
 * primitive is interoperable with the sync {@link deriveKey} output — same inputs ⇒ same
 * 32-byte key.
 */
export async function deriveKeyAsync(
  password: string,
  salt: Uint8Array,
  params: KdfParams = DEFAULT_KDF,
): Promise<Uint8Array> {
  if (params.name !== 'argon2id') {
    throw new Error(`unsupported KDF ${params.name}`);
  }
  const worker = getWorker();
  if (!worker) {
    return deriveKeyWasm(password, salt, params);
  }
  const id = ++workerReqId;
  const saltBuf = salt.buffer.slice(
    salt.byteOffset,
    salt.byteOffset + salt.byteLength,
  ) as ArrayBuffer;
  return new Promise<Uint8Array>((resolve, reject) => {
    const onMessage = (event: MessageEvent<{ id: number; ok: true; key: ArrayBuffer } | { id: number; ok: false; error: string }>): void => {
      if (event.data.id !== id) return;
      worker.removeEventListener('message', onMessage);
      if (event.data.ok) {
        resolve(new Uint8Array(event.data.key));
      } else {
        reject(new Error(event.data.error));
      }
    };
    worker.addEventListener('message', onMessage);
    worker.postMessage(
      { id, password, salt: saltBuf, t: params.t, m: params.m, p: params.p },
      [saltBuf],
    );
  });
}
