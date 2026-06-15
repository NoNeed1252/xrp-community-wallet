import { openDB, type IDBPDatabase } from 'idb';
import type { EvmChainId, TokenAsset } from './types';

/**
 * Хранение пользовательских ERC-20 токенов в IndexedDB.
 * Отдельная БД от vault: токены — публичные метаданные, не требуют шифрования.
 */

const DB_NAME = 'rc-wallet-tokens';
const STORE = 'tokens';
const KEY = 'customTokens';

export interface CustomToken {
  /** chain:address (lowercase) — стабильный ID. */
  id: string;
  chain: EvmChainId;
  symbol: string;
  name: string;
  decimals: number;
  /** EIP-55 checksum address (как вернул viem.getAddress). */
  address: `0x${string}`;
  /** ISO timestamp. */
  addedAt: string;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      },
    });
  }
  return dbPromise;
}

const subscribers = new Set<() => void>();
function notify(): void {
  for (const cb of [...subscribers]) {
    try {
      cb();
    } catch {
      // ignore
    }
  }
}

export function subscribeCustomTokens(cb: () => void): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

export async function getCustomTokens(): Promise<CustomToken[]> {
  const db = await getDb();
  return ((await db.get(STORE, KEY)) as CustomToken[] | undefined) ?? [];
}

export function tokenIdOf(chain: EvmChainId, address: string): string {
  return `${chain}:${address.toLowerCase()}`;
}

export async function addCustomToken(input: Omit<CustomToken, 'id' | 'addedAt'>): Promise<CustomToken> {
  const list = await getCustomTokens();
  const id = tokenIdOf(input.chain, input.address);
  if (list.some((t) => t.id === id)) {
    throw new Error('customTokens: already added');
  }
  const token: CustomToken = {
    ...input,
    id,
    addedAt: new Date().toISOString(),
  };
  const next = [...list, token];
  const db = await getDb();
  await db.put(STORE, next, KEY);
  notify();
  return token;
}

export async function removeCustomToken(id: string): Promise<void> {
  const list = await getCustomTokens();
  const next = list.filter((t) => t.id !== id);
  if (next.length === list.length) return;
  const db = await getDb();
  await db.put(STORE, next, KEY);
  notify();
}

export function customTokenToAsset(t: CustomToken): TokenAsset {
  // Кастомные токены не имеют coingeckoId — портфолио покажет их с ценой 0
  // (для real-цен потребуется CoinGecko `/coins/{chain}/contract/{address}`, follow-up).
  return {
    kind: 'token',
    chain: t.chain,
    id: t.id,
    symbol: t.symbol,
    name: t.name,
    decimals: t.decimals,
    address: t.address,
    coingeckoId: '',
  };
}

export const __internal = {
  resetDbForTesting: () => {
    dbPromise = null;
    subscribers.clear();
  },
};
