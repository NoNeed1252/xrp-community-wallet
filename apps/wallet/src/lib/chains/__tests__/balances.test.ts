import { describe, expect, it } from 'vitest';
import { formatDecimal } from '../balances';

describe('formatDecimal', () => {
  it('0n → "0"', () => {
    expect(formatDecimal(0n, 18)).toBe('0');
  });

  it('целое (без остатка)', () => {
    expect(formatDecimal(5n * 10n ** 18n, 18)).toBe('5');
  });

  it('дроби, trim zeros', () => {
    expect(formatDecimal(1234567890n, 6)).toBe('1234.56789');
  });

  it('fractionDigits ограничение', () => {
    expect(formatDecimal(1234567890123456789n, 18, 4)).toBe('1.2345');
  });

  it('очень маленькая сумма', () => {
    expect(formatDecimal(1n, 18, 18)).toBe('0.000000000000000001');
  });
});
