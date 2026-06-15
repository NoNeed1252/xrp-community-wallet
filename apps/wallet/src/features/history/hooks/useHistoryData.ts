import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useRecentTxsForProfile } from '~/features/send/hooks/useMockedAccountState';
import { useWalletProfile } from '~/lib/wallet/useWallet';
import { getChainAddress } from '~/lib/wallet/vault';
import { fetchXrplHistory } from '~/lib/explorers/xrpl';
import { fetchEvmHistory, isEvmExplorerSupported } from '~/lib/explorers/evm';
import rawMocks from '~/mocks.json';
import type { HistoryTx } from '../lib/types';

interface MockTxRaw {
  id: string;
  type: string;
  direction: 'incoming' | 'outgoing';
  status: 'pending' | 'completed' | 'failed';
  counterparty: { address: string; label: string | null; destinationTag: number | null };
  amount:
    | { currency: 'XRP'; drops: string; issuer: null }
    | { currency: string; value: string; issuer: string | null };
  fee: { drops: string };
  memo: string | null;
  txHash: string;
  ledgerIndex: number | null;
  createdAt: string;
  completedAt: string | null;
  failure?: { code: string; message: string };
}

function normalizeMock(m: MockTxRaw): HistoryTx {
  return {
    id: m.id,
    source: 'mock',
    type:
      m.type === 'payment' || m.type === 'staking_deposit' || m.type === 'staking_payout'
        ? m.type
        : 'payment',
    direction: m.direction,
    status: m.status,
    amount:
      'drops' in m.amount
        ? { currency: 'XRP' as const, drops: m.amount.drops }
        : { currency: m.amount.currency, value: m.amount.value, issuer: m.amount.issuer },
    fee: m.fee,
    counterparty: m.counterparty,
    memo: m.memo,
    txHash: m.txHash,
    ledgerIndex: m.ledgerIndex,
    createdAt: m.createdAt,
    completedAt: m.completedAt,
    failure: m.failure,
  };
}

export interface HistoryDataState {
  txs: HistoryTx[];
  loading: boolean;
  /** True если запрос к explorer'у завалился; UI может показать stale-баннер. */
  hasErrors: boolean;
}

export function useHistoryData(): HistoryDataState {
  const [searchParams] = useSearchParams();
  const demo = searchParams.get('demo') ?? 'auto';
  const includeMocks = demo === 'full';

  const { profile } = useWalletProfile();
  const recentTxs = useRecentTxsForProfile(profile?.id ?? null);

  const xrplAddress = profile ? getChainAddress(profile, 'xrpl') : null;
  const ethAddress = profile ? (getChainAddress(profile, 'eth') as `0x${string}` | null) : null;

  const queries = useQueries({
    queries: [
      {
        queryKey: ['xrpl-history', xrplAddress],
        queryFn: () => (xrplAddress ? fetchXrplHistory(xrplAddress) : Promise.resolve([])),
        enabled: Boolean(xrplAddress),
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      {
        queryKey: ['evm-history', 'eth', ethAddress],
        queryFn: () =>
          ethAddress && isEvmExplorerSupported('eth')
            ? fetchEvmHistory('eth', ethAddress)
            : Promise.resolve([]),
        enabled: Boolean(ethAddress) && isEvmExplorerSupported('eth'),
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      {
        queryKey: ['evm-history', 'pol', ethAddress],
        queryFn: () =>
          ethAddress && isEvmExplorerSupported('pol')
            ? fetchEvmHistory('pol', ethAddress)
            : Promise.resolve([]),
        enabled: Boolean(ethAddress) && isEvmExplorerSupported('pol'),
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    ],
  });

  const liveTxs = useMemo<HistoryTx[]>(() => {
    const out: HistoryTx[] = [];
    for (const q of queries) {
      if (q.data) out.push(...q.data);
    }
    return out;
  }, [queries.map((q) => q.dataUpdatedAt).join('|')]);

  const merged = useMemo<HistoryTx[]>(() => {
    const userSends: HistoryTx[] = recentTxs.map((t) => ({
      id: t.txHash,
      source: 'user_send' as const,
      type: 'payment',
      direction: 'outgoing',
      status: t.status,
      amount: { currency: 'XRP', drops: t.amountDrops },
      fee: { drops: t.feeDrops },
      counterparty: {
        address: t.toAddress,
        label: null,
        destinationTag: t.destinationTag ?? null,
      },
      memo: t.memo ?? null,
      txHash: t.txHash,
      ledgerIndex: null,
      createdAt: t.createdAt,
      completedAt: t.status === 'completed' ? t.createdAt : null,
    }));

    const mocks: HistoryTx[] = includeMocks
      ? ((rawMocks as { transactions: MockTxRaw[] }).transactions ?? []).map(normalizeMock)
      : [];

    const seen = new Set<string>();
    const out: HistoryTx[] = [];
    const add = (tx: HistoryTx) => {
      if (seen.has(tx.id)) return;
      seen.add(tx.id);
      out.push(tx);
    };
    for (const tx of userSends) add(tx);
    for (const tx of liveTxs) add(tx);
    for (const tx of mocks) add(tx);
    out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return out;
  }, [recentTxs, liveTxs, includeMocks]);

  const loading = !profile || queries.some((q) => q.isLoading);
  const hasErrors = queries.some((q) => q.isError);

  return { txs: merged, loading, hasErrors };
}
