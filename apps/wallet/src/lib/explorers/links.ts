import type { HistoryTx } from '~/features/history/lib/types';

/**
 * Возвращает URL транзакции в публичном обозревателе.
 * XRPL → livenet.xrpl.org; EVM → chain-specific scan.
 */
export function explorerTxUrl(tx: HistoryTx): string | null {
  if (!tx.txHash) return null;
  if ('drops' in tx.amount) {
    return `https://livenet.xrpl.org/transactions/${tx.txHash}`;
  }
  if ('raw' in tx.amount && 'chain' in tx.amount) {
    // EVM-tx: hash на цепи; для token-transfer наш id может быть `${tx_hash}-${token}`,
    // но txHash содержит чистый hash.
    const hash = tx.txHash;
    switch (tx.amount.chain) {
      case 'eth':
        return `https://etherscan.io/tx/${hash}`;
      case 'bsc':
        return `https://bscscan.com/tx/${hash}`;
      case 'pol':
        return `https://polygonscan.com/tx/${hash}`;
      default:
        return null;
    }
  }
  // Issued currency (XRPL) — XRPL explorer тоже.
  return `https://livenet.xrpl.org/transactions/${tx.txHash}`;
}
