import { describe, expect, it } from 'vitest';
import { isValidEvmAddress } from '../evmAddress';

describe('isValidEvmAddress', () => {
  it('принимает all-lowercase 0x… address', async () => {
    expect(await isValidEvmAddress('0xdac17f958d2ee523a2206206994597c13d831ec7')).toBe(true);
  });

  it('принимает корректный EIP-55 checksum (mixed case)', async () => {
    expect(await isValidEvmAddress('0xdAC17F958D2ee523a2206206994597C13D831ec7')).toBe(true);
  });

  it('отклоняет неправильный EIP-55 checksum', async () => {
    // Та же address, но регистр букв нарушен в одном символе.
    expect(await isValidEvmAddress('0xDac17F958D2ee523a2206206994597C13D831ec7')).toBe(false);
  });

  it('отклоняет неверную длину', async () => {
    expect(await isValidEvmAddress('0x1234')).toBe(false);
  });

  it('отклоняет без 0x префикса', async () => {
    expect(await isValidEvmAddress('dac17f958d2ee523a2206206994597c13d831ec7')).toBe(false);
  });

  it('отклоняет XRPL-адрес', async () => {
    expect(await isValidEvmAddress('rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH')).toBe(false);
  });

  it('отклоняет non-hex символы', async () => {
    expect(await isValidEvmAddress('0xZZZ17f958d2ee523a2206206994597c13d831ec7')).toBe(false);
  });
});
