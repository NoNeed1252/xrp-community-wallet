import { getActiveAccount, getUnlockedSlot } from './vault';

// ─────────── Types ───────────

export interface SignPaymentInput {
  destination: string;
  amountDrops: string;
  feeDrops: string;
  destinationTag?: number;
  memoText?: string;
  /** XRPL account Sequence для tx. Required для оффлайн-подписи. */
  sequence?: number;
  /** LastLedgerSequence guard. Required для оффлайн-подписи. */
  lastLedgerSequence?: number;
}

export interface SignPaymentResult {
  /** Hex tx_blob (для последующего submit). */
  txHex: string;
  /** XRPL tx hash. */
  txHash: string;
}

export interface SubmitXrplResult {
  txHash: string;
  engineResult: string;
  engineResultMessage: string;
  accepted: boolean;
}

export interface SignEvmTransactionInput {
  chain: 'eth' | 'bsc' | 'pol';
  to: `0x${string}`;
  /** Amount in wei (native) или 0 при ERC-20 transfer (см. data). */
  value: bigint;
  /** ERC-20 transfer payload или произвольный data. */
  data?: `0x${string}`;
}

export interface EvmGasOverrides {
  gasLimit?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}

export interface SignEvmTransactionResult {
  txHex: string;
  txHash: string;
}

// ─────────── XRPL ───────────

/**
 * Реальная подпись XRPL Payment через `xrpl.js`. Использует family seed
 * из unlocked slot. Сетевой вызов НЕ делает — Sequence и LastLedgerSequence
 * принимает на входе. См. {@link sendXrplPayment} для полного цикла.
 */
export async function signPayment(input: SignPaymentInput): Promise<SignPaymentResult> {
  const active = await getActiveAccount();
  if (!active) throw new Error('vault: no active account');
  if (active.kind === 'ledger_hardware') {
    throw new Error('vault: ledger account must sign via signWithLedger');
  }
  const slot = getUnlockedSlot(active.id);
  if (!slot) throw new Error('vault: locked');
  if (input.sequence === undefined || input.lastLedgerSequence === undefined) {
    throw new Error('vault: sequence and lastLedgerSequence are required');
  }

  const xrpl = await import('xrpl');
  const { Wallet, encode, encodeForSigning, hashes } = xrpl;
  const { sign } = await import('ripple-keypairs');

  const wallet = Wallet.fromSeed(slot.secret);

  const tx: Record<string, unknown> = {
    TransactionType: 'Payment',
    Account: wallet.address,
    Destination: input.destination,
    Amount: input.amountDrops,
    Fee: input.feeDrops,
    Sequence: input.sequence,
    LastLedgerSequence: input.lastLedgerSequence,
    SigningPubKey: wallet.publicKey,
  };
  if (input.destinationTag !== undefined) {
    tx.DestinationTag = input.destinationTag;
  }
  if (input.memoText) {
    const hex = Array.from(new TextEncoder().encode(input.memoText))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    tx.Memos = [{ Memo: { MemoData: hex.toUpperCase() } }];
  }

  type SigningTx = Parameters<typeof encodeForSigning>[0];
  const signingPayload = encodeForSigning(tx as unknown as SigningTx);
  const signature = sign(signingPayload, wallet.privateKey);
  tx.TxnSignature = signature;

  type EncodableTx = Parameters<typeof encode>[0];
  const txBlob = encode(tx as unknown as EncodableTx);
  const txHash = hashes.hashSignedTx(txBlob);

  return { txHex: txBlob, txHash };
}

/**
 * Submit подписанного tx_blob в публичный RPC XRPL.
 * Возвращает `accepted = true` если engine_result начинается с `tes`/`ter` (provisional).
 */
export async function submitXrplPayment(txBlob: string): Promise<SubmitXrplResult> {
  const res = await fetch('https://xrplcluster.com/', {
    method: 'POST',
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method: 'submit', params: [{ tx_blob: txBlob }] }),
  });
  if (!res.ok) throw new Error(`xrpl submit: HTTP ${res.status}`);
  const data = (await res.json()) as {
    result?: {
      status?: 'success' | 'error';
      error?: string;
      error_message?: string;
      engine_result?: string;
      engine_result_message?: string;
      tx_json?: { hash?: string };
      tx_blob?: string;
    };
  };
  if (data.result?.status !== 'success') {
    throw new Error(data.result?.error_message ?? data.result?.error ?? 'xrpl submit failed');
  }
  const engineResult = data.result.engine_result ?? 'unknown';
  const txHash = data.result.tx_json?.hash ?? '';
  const accepted = engineResult.startsWith('tes') || engineResult.startsWith('ter');
  return {
    txHash,
    engineResult,
    engineResultMessage: data.result.engine_result_message ?? '',
    accepted,
  };
}

/** Полный цикл: fetch state → sign → submit. */
export async function sendXrplPayment(
  input: Omit<SignPaymentInput, 'sequence' | 'lastLedgerSequence'>,
): Promise<SubmitXrplResult> {
  const active = await getActiveAccount();
  if (!active) throw new Error('vault: no active account');
  const slot = getUnlockedSlot(active.id);
  if (!slot) throw new Error('vault: locked');

  const [accountRes, ledgerRes] = await Promise.all([
    fetch('https://xrplcluster.com/', {
      method: 'POST',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'account_info',
        params: [{ account: slot.address, strict: true, ledger_index: 'current' }],
      }),
    }),
    fetch('https://xrplcluster.com/', {
      method: 'POST',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'ledger_current', params: [{}] }),
    }),
  ]);
  if (!accountRes.ok) throw new Error(`xrpl account_info: HTTP ${accountRes.status}`);
  if (!ledgerRes.ok) throw new Error(`xrpl ledger_current: HTTP ${ledgerRes.status}`);
  const accountInfo = (await accountRes.json()) as {
    result?: {
      status?: 'success' | 'error';
      error?: string;
      account_data?: { Sequence?: number };
    };
  };
  const ledgerInfo = (await ledgerRes.json()) as {
    result?: { status?: 'success' | 'error'; ledger_current_index?: number };
  };
  if (accountInfo.result?.error === 'actNotFound') {
    throw new Error('xrpl: account not activated yet (needs ≥1 XRP)');
  }
  if (accountInfo.result?.status !== 'success' || !accountInfo.result.account_data?.Sequence) {
    throw new Error('xrpl: account_info failed');
  }
  if (ledgerInfo.result?.status !== 'success' || !ledgerInfo.result.ledger_current_index) {
    throw new Error('xrpl: ledger_current failed');
  }
  const sequence = accountInfo.result.account_data.Sequence;
  const currentLedger = ledgerInfo.result.ledger_current_index;

  const signed = await signPayment({
    ...input,
    sequence,
    lastLedgerSequence: currentLedger + 75,
  });

  const submitted = await submitXrplPayment(signed.txHex);
  if (!submitted.accepted) {
    throw new Error(`xrpl: ${submitted.engineResult} — ${submitted.engineResultMessage}`);
  }
  return { ...submitted, txHash: submitted.txHash || signed.txHash };
}

// ─────────── EVM ───────────

/**
 * Реальная подпись + broadcast EVM tx через viem. Использует privateKey
 * из unlocked slot multi_chain профиля.
 */
export async function sendEvmTransaction(
  input: SignEvmTransactionInput & EvmGasOverrides,
): Promise<SignEvmTransactionResult> {
  const active = await getActiveAccount();
  if (!active) throw new Error('vault: no active account');
  if (active.kind !== 'multi_chain') {
    throw new Error('vault: active account does not support EVM');
  }
  const slot = getUnlockedSlot(active.id);
  if (!slot?.evm) throw new Error('vault: locked');

  const { getPublicClient } = await import('~/lib/chains/rpc');
  const [{ privateKeyToAccount }, { mainnet, bsc, polygon }] = await Promise.all([
    import('viem/accounts'),
    import('viem/chains'),
  ]);
  const chainDef = input.chain === 'eth' ? mainnet : input.chain === 'bsc' ? bsc : polygon;
  const client = await getPublicClient(input.chain);
  const account = privateKeyToAccount(`0x${slot.evm.privateKey}`);

  const baseClient = client as unknown as {
    getTransactionCount: (a: {
      address: `0x${string}`;
      blockTag?: 'latest' | 'pending';
    }) => Promise<number>;
    estimateGas: (a: {
      account: `0x${string}`;
      to: `0x${string}`;
      value?: bigint;
      data?: `0x${string}`;
    }) => Promise<bigint>;
    estimateFeesPerGas: () => Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }>;
    sendRawTransaction: (a: { serializedTransaction: `0x${string}` }) => Promise<`0x${string}`>;
  };

  const nonce = await baseClient.getTransactionCount({
    address: account.address,
    blockTag: 'pending',
  });
  let gas = input.gasLimit;
  if (gas === undefined) {
    gas = await baseClient.estimateGas({
      account: account.address,
      to: input.to,
      value: input.data ? 0n : input.value,
      data: input.data,
    });
  }
  let maxFeePerGas = input.maxFeePerGas;
  let maxPriorityFeePerGas = input.maxPriorityFeePerGas;
  if (maxFeePerGas === undefined || maxPriorityFeePerGas === undefined) {
    const fees = await baseClient.estimateFeesPerGas();
    if (maxFeePerGas === undefined) maxFeePerGas = fees.maxFeePerGas;
    if (maxPriorityFeePerGas === undefined) maxPriorityFeePerGas = fees.maxPriorityFeePerGas;
  }

  const signed = await account.signTransaction({
    chainId: chainDef.id,
    to: input.to,
    value: input.data ? 0n : input.value,
    data: input.data,
    gas,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    type: 'eip1559',
  });

  const txHash = await baseClient.sendRawTransaction({ serializedTransaction: signed });
  return { txHex: signed, txHash };
}
