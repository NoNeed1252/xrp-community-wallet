/// <reference lib="webworker" />
import { argon2id } from 'hash-wasm';

interface KdfRequest {
  id: number;
  password: string;
  salt: ArrayBuffer;
  t: number;
  m: number;
  p: number;
}

interface KdfSuccess {
  id: number;
  ok: true;
  key: ArrayBuffer;
}

interface KdfFailure {
  id: number;
  ok: false;
  error: string;
}

self.onmessage = async (event: MessageEvent<KdfRequest>) => {
  const { id, password, salt, t, m, p } = event.data;
  try {
    const hex = await argon2id({
      password,
      salt: new Uint8Array(salt),
      parallelism: p,
      iterations: t,
      memorySize: m,
      hashLength: 32,
      outputType: 'hex',
    });
    const key = new Uint8Array(32);
    for (let i = 0; i < 32; i += 1) {
      key[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    const buffer = key.buffer.slice(0) as ArrayBuffer;
    const reply: KdfSuccess = { id, ok: true, key: buffer };
    (self as unknown as Worker).postMessage(reply, [buffer]);
  } catch (err) {
    const reply: KdfFailure = { id, ok: false, error: (err as Error).message };
    (self as unknown as Worker).postMessage(reply);
  }
};
