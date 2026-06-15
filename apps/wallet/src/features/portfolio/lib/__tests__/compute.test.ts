import { describe, it, expect } from 'vitest';
import {
  computeDonutBreakdown,
  computeUsdValue,
  formatChange24hPct,
  sumUsd,
  type AssetHolding,
} from '../compute';

function holding(symbol: string, valueUsd: string): AssetHolding {
  return {
    symbol,
    name: symbol,
    iconKey: symbol.toLowerCase(),
    balanceRaw: '0',
    balance: '0',
    priceUsd: '0',
    valueUsd,
    change24hPct: null,
  };
}

describe('computeUsdValue', () => {
  it('basic math', () => {
    expect(computeUsdValue('100', '0.5234')).toBe('52.34');
  });
  it('zero balance', () => {
    expect(computeUsdValue('0', '0.5234')).toBe('0.00');
  });
  it('invalid input', () => {
    expect(computeUsdValue('abc', '1')).toBe('0');
  });
});

describe('sumUsd', () => {
  it('sums values', () => {
    expect(sumUsd([holding('XRP', '100.00'), holding('USDC', '50.00')])).toBe('150.00');
  });
});

describe('computeDonutBreakdown', () => {
  it('empty holdings → single Empty segment', () => {
    expect(computeDonutBreakdown([])).toEqual([{ label: 'Empty', percent: 100, color: 'neutral.300' }]);
  });
  it('top-2 + Other', () => {
    const h = [
      holding('XRP', '880'),
      holding('USDC', '70'),
      holding('RLUSD', '50'),
    ];
    const segs = computeDonutBreakdown(h, 2);
    expect(segs.map((s) => s.label)).toEqual(['XRP', 'USDC', 'Other']);
    expect(segs[0]!.percent).toBe(88);
  });
  it('few items, no Other', () => {
    const h = [holding('XRP', '100')];
    const segs = computeDonutBreakdown(h);
    expect(segs.map((s) => s.label)).toEqual(['XRP']);
  });
  it('zero total → Empty', () => {
    const segs = computeDonutBreakdown([holding('X', '0')]);
    expect(segs[0]!.label).toBe('Empty');
  });
});

describe('formatChange24hPct', () => {
  it('positive', () => {
    expect(formatChange24hPct('2.13')).toEqual({ label: '+2.13%', positive: true });
  });
  it('negative', () => {
    expect(formatChange24hPct('-1.45')).toEqual({ label: '-1.45%', positive: false });
  });
  it('zero is positive', () => {
    expect(formatChange24hPct('0')).toEqual({ label: '+0.00%', positive: true });
  });
  it('null returns null', () => {
    expect(formatChange24hPct(null)).toBeNull();
  });
});
