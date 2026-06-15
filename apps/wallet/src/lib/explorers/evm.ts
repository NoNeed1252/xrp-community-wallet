import type { HistoryTx } from '~/features/history/lib/types';
import type { EvmChainId } from '~/lib/chains/types';

/**
 * Публичные Blockscout instances (без API ключа).
 * BSC instance отсутствует у Blockscout — для неё фолбэк на BSCScan.
 */
const BLOCKSCOUT_BASE: Partial<Record<EvmChainId, string>> = {
  eth: 'https://eth.blockscout.com',
  pol: 'https://polygon.blockscout.com',
  // BSC — публичного Blockscout instance нет, нужен бэк-прокси к BSCScan.
};

interface BlockscoutTx {
  hash: string;
  block_number: number;
  timestamp: string;
  from: { hash: string };
  to: { hash: string } | null;
  value: string;
  fee?: { value: string };
  status: 'ok' | 'error';
  result?: string;
  method?: string | null;
  tx_types?: string[];
}

interface BlockscoutTokenTransfer {
  block_number: number;
  block_timestamp: string;
  from: { hash: string };
  to: { hash: string };
  token: {
    address: string;
    symbol: string;
    decimals: string;
  };
  total: { value: string; decimals: string };
  tx_hash: string;
}

async function safeJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchEvmHistory(
  chain: EvmChainId,
  address: `0x${string}`,
  limit = 25,
): Promise<HistoryTx[]> {
  const base = BLOCKSCOUT_BASE[chain];
  if (!base) return [];

  const [native, tokens] = await Promise.all([
    safeJson<{ items?: BlockscoutTx[] }>(
      `${base}/api/v2/addresses/${address}/transactions`,
    ),
    safeJson<{ items?: BlockscoutTokenTransfer[] }>(
      `${base}/api/v2/addresses/${address}/token-transfers?type=ERC-20`,
    ),
  ]);

  const out: HistoryTx[] = [];
  const lc = address.toLowerCase();

  if (native?.items) {
    for (const tx of native.items.slice(0, limit)) {
      // Контрактные вызовы без value пропускаем — это transfer / approve внутри token-transfers.
      if (!tx.value || tx.value === '0') continue;
      const isOutgoing = tx.from.hash.toLowerCase() === lc;
      const counterparty = isOutgoing ? tx.to?.hash ?? '' : tx.from.hash;
      out.push({
        id: tx.hash,
        source: 'live',
        type: 'payment',
        direction: isOutgoing ? 'outgoing' : 'incoming',
        status: tx.status === 'ok' ? 'completed' : 'failed',
        amount: {
          currency: chain === 'eth' ? 'ETH' : chain === 'bsc' ? 'BNB' : 'MATIC',
          raw: tx.value,
          decimals: 18,
          chain,
        },
        fee: { drops: tx.fee?.value ?? '0' },
        counterparty: { address: counterparty, label: null, destinationTag: null },
        memo: null,
        txHash: tx.hash,
        ledgerIndex: tx.block_number,
        createdAt: tx.timestamp,
        completedAt: tx.timestamp,
      });
    }
  }

  if (tokens?.items) {
    for (const tr of tokens.items.slice(0, limit)) {
      const isOutgoing = tr.from.hash.toLowerCase() === lc;
      const counterparty = isOutgoing ? tr.to.hash : tr.from.hash;
      out.push({
        id: `${tr.tx_hash}-${tr.token.address}`,
        source: 'live',
        type: 'payment',
        direction: isOutgoing ? 'outgoing' : 'incoming',
        status: 'completed',
        amount: {
          // Blockscout не валидирует `symbol`; airdrop-spam токены часто
          // имеют поля вроде "USDT — refund at evil.tld". React эскейпит, но
          // фишинг-текст всё равно отрисуется как «название токена» (security
          // audit L5). Ограничиваем длину и убираем управляющие символы.
          currency: sanitizeTokenSymbol(tr.token.symbol),
          raw: tr.total.value,
          decimals: Number(tr.total.decimals) || Number(tr.token.decimals) || 18,
          chain,
          tokenAddress: tr.token.address,
        },
        fee: { drops: '0' },
        counterparty: { address: counterparty, label: null, destinationTag: null },
        memo: null,
        txHash: tr.tx_hash,
        ledgerIndex: tr.block_number,
        createdAt: tr.block_timestamp,
        completedAt: tr.block_timestamp,
      });
    }
  }

  return out;
}

export function isEvmExplorerSupported(chain: EvmChainId): boolean {
  return Boolean(BLOCKSCOUT_BASE[chain]);
}

function sanitizeTokenSymbol(symbol: string | undefined | null): string {
  if (typeof symbol !== 'string') return '?';
  // Удаляем C0/C1 control + DEL и zero-width/BiDi/BOM unicode, схлопываем
  // подряд пробелы. Защита от airdrop-spam токенов с обманным symbol
  // (security audit L5).
  // eslint-disable-next-line no-control-regex
  const cleaned = symbol
    .replace(/[\u0000-\u001f\u007f-\u009f]/gu, '')
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();
  if (cleaned.length === 0) return '?';
  return cleaned.length > 16 ? `${cleaned.slice(0, 15)}\u2026` : cleaned;
}
