import { describe, it, expect } from 'vitest';
import {
  applyFilters,
  emptyFilters,
  matchesPeriod,
  matchesSearch,
  matchesStatus,
  matchesType,
} from '../filters';
import type { HistoryTx } from '../types';

function fixture(overrides: Partial<HistoryTx> = {}): HistoryTx {
  return {
    id: 'tx_1',
    source: 'mock',
    type: 'payment',
    direction: 'outgoing',
    status: 'completed',
    amount: { currency: 'XRP', drops: '1000000' },
    fee: { drops: '12' },
    counterparty: { address: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH', label: 'Alice', destinationTag: null },
    memo: null,
    txHash: 'ABCDEF',
    ledgerIndex: 100,
    createdAt: '2026-05-15T10:00:00.000Z',
    completedAt: '2026-05-15T10:00:08.000Z',
    ...overrides,
  };
}

describe('matchesType', () => {
  it('matches selected types', () => {
    const tx = fixture({ type: 'payment' });
    expect(matchesType(tx, new Set(['payment']))).toBe(true);
    expect(matchesType(tx, new Set(['staking_deposit']))).toBe(false);
  });
});

describe('matchesStatus', () => {
  it('all matches anything', () => {
    expect(matchesStatus(fixture({ status: 'failed' }), 'all')).toBe(true);
  });
  it('specific matches only same', () => {
    expect(matchesStatus(fixture({ status: 'completed' }), 'completed')).toBe(true);
    expect(matchesStatus(fixture({ status: 'pending' }), 'completed')).toBe(false);
  });
});

describe('matchesPeriod', () => {
  const now = new Date('2026-05-15T12:00:00.000Z');
  it('all matches anything', () => {
    expect(matchesPeriod(fixture({ createdAt: '2020-01-01T00:00:00Z' }), 'all', now)).toBe(true);
  });
  it('7d cutoff', () => {
    expect(matchesPeriod(fixture({ createdAt: '2026-05-10T12:00:00Z' }), '7d', now)).toBe(true);
    expect(matchesPeriod(fixture({ createdAt: '2026-05-01T12:00:00Z' }), '7d', now)).toBe(false);
  });
  it('today inclusive', () => {
    expect(matchesPeriod(fixture({ createdAt: '2026-05-15T05:00:00Z' }), 'today', now)).toBe(true);
    expect(matchesPeriod(fixture({ createdAt: '2026-05-14T23:00:00Z' }), 'today', now)).toBe(false);
  });
});

describe('matchesSearch', () => {
  it('matches address case-insensitive', () => {
    expect(matchesSearch(fixture(), 'rn7n')).toBe(true);
  });
  it('matches label', () => {
    expect(matchesSearch(fixture({ counterparty: { ...fixture().counterparty, label: 'Bob' } }), 'BO')).toBe(true);
  });
  it('matches memo', () => {
    expect(matchesSearch(fixture({ memo: 'invoice 12345' }), 'invoice')).toBe(true);
  });
  it('empty query passes everything', () => {
    expect(matchesSearch(fixture(), '')).toBe(true);
  });
  it('no match returns false', () => {
    expect(matchesSearch(fixture(), 'zzzz')).toBe(false);
  });
});

describe('applyFilters', () => {
  it('empty filters return everything', () => {
    const txs = [fixture({ id: 'a' }), fixture({ id: 'b', type: 'staking_deposit' })];
    expect(applyFilters(txs, emptyFilters()).map((t) => t.id)).toEqual(['a', 'b']);
  });
  it('narrows by combined criteria', () => {
    const txs = [
      fixture({ id: 'a', type: 'payment', status: 'completed' }),
      fixture({ id: 'b', type: 'staking_deposit', status: 'completed' }),
      fixture({ id: 'c', type: 'payment', status: 'failed' }),
    ];
    const f = emptyFilters();
    const out = applyFilters(txs, { ...f, types: new Set(['payment']), status: 'completed' });
    expect(out.map((t) => t.id)).toEqual(['a']);
  });
});
