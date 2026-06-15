import { describe, it, expect } from 'vitest';
import { dropsToXrp } from '../dropsToXrp.js';
import { maskAddress } from '../maskAddress.js';
import { formatCompactNumber } from '../formatCompactNumber.js';
import { formatFiat } from '../formatFiat.js';
import { formatCrypto } from '../formatCrypto.js';
import { truncateMiddle } from '../truncateMiddle.js';
import { parseXrpInput } from '../parseXrpInput.js';

describe('dropsToXrp', () => {
  it('handles zero', () => {
    expect(dropsToXrp('0')).toBe('0');
  });
  it('1 drop = 0.000001 XRP', () => {
    expect(dropsToXrp('1')).toBe('0.000001');
  });
  it('1_000_000 drops = 1 XRP, без хвостовых нулей', () => {
    expect(dropsToXrp('1000000')).toBe('1');
  });
  it('drops с дробной частью', () => {
    expect(dropsToXrp('8550140250000')).toBe('8550140.25');
  });
  it('очень большие числа без потерь', () => {
    expect(dropsToXrp('27000000000000000')).toBe('27000000000');
  });
  it('отрицательные', () => {
    expect(dropsToXrp('-1500000')).toBe('-1.5');
  });
  it('кидает на не-числовой вход', () => {
    expect(() => dropsToXrp('abc')).toThrow();
  });
});

describe('maskAddress', () => {
  it('маскирует длинный XRPL-адрес (4+4)', () => {
    expect(maskAddress('rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH')).toBe('rN7n…fzRH');
  });
  it('маскирует с расширенным префиксом (4+5)', () => {
    expect(maskAddress('rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH', 4, 5)).toBe('rN7n…6fzRH');
  });
  it('короткий адрес возвращает как есть', () => {
    expect(maskAddress('rABCD')).toBe('rABCD');
  });
  it('пустая строка', () => {
    expect(maskAddress('')).toBe('');
  });
});

describe('formatCompactNumber', () => {
  it('935000 → 935K', () => {
    expect(formatCompactNumber(935000, 'en')).toMatch(/935/);
  });
  it('1240000 → 1.24M', () => {
    expect(formatCompactNumber(1240000, 'en')).toMatch(/1\.24M/);
  });
  it('меньше 1000 — не компактит', () => {
    expect(formatCompactNumber(123, 'en')).toBe('123');
  });
  it('NaN → дэш', () => {
    expect(formatCompactNumber(NaN, 'en')).toBe('—');
  });
});

describe('formatFiat', () => {
  it('USD en', () => {
    expect(formatFiat('12500.5', 'USD', 'en')).toMatch(/\$12,500\.50/);
  });
  it('0', () => {
    expect(formatFiat(0, 'USD', 'en')).toMatch(/\$0\.00/);
  });
});

describe('formatCrypto', () => {
  it('XRP большая сумма', () => {
    const r = formatCrypto('8550140.25', 'XRP', { locale: 'en' });
    expect(r.value).toMatch(/8,550,140/);
    expect(r.symbol).toBe('XRP');
  });
  it('очень малая сумма не уходит в exp', () => {
    const r = formatCrypto('0.0000001', 'XRP');
    expect(r.value).not.toMatch(/e/i);
  });
  it('ноль', () => {
    const r = formatCrypto(0, 'XRP');
    expect(r.value).toBe('0');
  });
});

describe('parseXrpInput', () => {
  it('1 → 1000000', () => {
    expect(parseXrpInput('1')).toBe('1000000');
  });
  it('1.5 → 1500000', () => {
    expect(parseXrpInput('1.5')).toBe('1500000');
  });
  it('0.000001 → 1', () => {
    expect(parseXrpInput('0.000001')).toBe('1');
  });
  it('0 → 0', () => {
    expect(parseXrpInput('0')).toBe('0');
  });
  it('comma as separator', () => {
    expect(parseXrpInput('1,5')).toBe('1500000');
  });
  it('returns null for >6 decimals', () => {
    expect(parseXrpInput('1.0000001')).toBeNull();
  });
  it('returns null for non-numeric', () => {
    expect(parseXrpInput('abc')).toBeNull();
  });
  it('returns null for empty', () => {
    expect(parseXrpInput('')).toBeNull();
  });
  it('huge numbers preserved', () => {
    expect(parseXrpInput('27000000000')).toBe('27000000000000000');
  });
});

describe('truncateMiddle', () => {
  it('короткое не меняется', () => {
    expect(truncateMiddle('Alice', 20)).toBe('Alice');
  });
  it('длинное усекается', () => {
    expect(truncateMiddle('Zephyra Global Holdings Pte Ltd', 14)).toMatch(/Zephyr.+e Ltd/);
  });
});
