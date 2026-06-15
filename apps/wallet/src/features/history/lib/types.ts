export type TxType = 'payment' | 'staking_deposit' | 'staking_payout';
export type TxStatus = 'pending' | 'completed' | 'failed';
export type TxDirection = 'incoming' | 'outgoing';

export interface HistoryTxAmountXrp {
  currency: 'XRP';
  drops: string;
}
export interface HistoryTxAmountIssued {
  currency: string;
  value: string;
  issuer?: string | null;
}
export interface HistoryTxAmountEvm {
  currency: string;
  /** Raw integer amount in token units (wei for native, raw for ERC-20). */
  raw: string;
  decimals: number;
  chain: 'eth' | 'bsc' | 'pol';
  tokenAddress?: string;
}
export type HistoryTxAmount = HistoryTxAmountXrp | HistoryTxAmountIssued | HistoryTxAmountEvm;

export interface HistoryTx {
  id: string;
  source: 'mock' | 'user_send' | 'live';
  type: TxType;
  direction: TxDirection;
  status: TxStatus;
  amount: HistoryTxAmount;
  fee: { drops: string };
  counterparty: {
    address: string;
    label: string | null;
    destinationTag: number | null;
  };
  memo: string | null;
  txHash: string;
  ledgerIndex: number | null;
  createdAt: string;
  completedAt: string | null;
  failure?: { code: string; message: string };
}
