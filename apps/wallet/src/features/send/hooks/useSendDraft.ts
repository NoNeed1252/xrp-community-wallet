import { create } from 'zustand';

export interface XrplSendDraft {
  assetId: 'xrpl:xrp';
  chain: 'xrpl';
  recipient: string;
  amountDrops: string;
  feeDrops: string;
  memo?: string;
  destinationTag?: number;
  recipientLabel?: string | null;
  recipientRequiresMemo: boolean;
}

export interface EvmSendDraft {
  assetId: string;
  chain: 'eth' | 'bsc' | 'pol';
  /** Native (ETH/BNB/MATIC) или ERC-20 (token id). */
  isNative: boolean;
  tokenAddress?: `0x${string}`;
  tokenDecimals?: number;
  tokenSymbol?: string;
  recipient: `0x${string}`;
  /** Amount в минимальных единицах (wei для native, token-units для ERC-20) — строка. */
  amountRaw: string;
  /** Human-readable amount, например "0.5". */
  amountHuman: string;
  feeWei: string;
  /** Опциональный override газа от пользователя (Advanced). */
  gasOverride?: {
    /** Gas limit (units) — строка для сериализации. */
    gasLimit?: string;
    /** Max fee per gas (wei) — строка. */
    maxFeePerGas?: string;
    /** Priority fee (wei). */
    maxPriorityFeePerGas?: string;
  };
}

export type SendDraft = XrplSendDraft | EvmSendDraft;

interface DraftStore {
  draft: SendDraft | null;
  set(draft: SendDraft): void;
  clear(): void;
}

export const useSendDraft = create<DraftStore>((set) => ({
  draft: null,
  set: (draft) => set({ draft }),
  clear: () => set({ draft: null }),
}));

export function isEvmDraft(d: SendDraft): d is EvmSendDraft {
  return d.chain !== 'xrpl';
}
