import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TokenMetadataError, fetchErc20Metadata } from '../tokenMetadata';
import { __resetRpcClientCacheForTesting } from '../rpc';

interface MockClient {
  readContract: ReturnType<typeof vi.fn>;
  getBalance: ReturnType<typeof vi.fn>;
  estimateGas: ReturnType<typeof vi.fn>;
  getGasPrice: ReturnType<typeof vi.fn>;
}

function installMockClient(behavior: (call: { functionName: string }) => unknown) {
  const client: MockClient = {
    readContract: vi.fn(async (args: { functionName: string }) => behavior(args)),
    getBalance: vi.fn(),
    estimateGas: vi.fn(),
    getGasPrice: vi.fn(),
  };
  return client;
}

vi.mock('../rpc', async () => {
  const mod = await vi.importActual<typeof import('../rpc')>('../rpc');
  return {
    ...mod,
    getPublicClient: vi.fn(),
  };
});

const VALID_ADDR = '0xdAC17F958D2ee523a2206206994597C13D831ec7'; // USDT mainnet

beforeEach(async () => {
  __resetRpcClientCacheForTesting();
  const { getPublicClient } = await import('../rpc');
  (getPublicClient as unknown as ReturnType<typeof vi.fn>).mockReset();
});

describe('fetchErc20Metadata', () => {
  it('возвращает name/symbol/decimals при валидном ERC-20', async () => {
    const client = installMockClient(({ functionName }) => {
      if (functionName === 'name') return 'Tether USD';
      if (functionName === 'symbol') return 'USDT';
      if (functionName === 'decimals') return 6;
      throw new Error('unexpected');
    });
    const { getPublicClient } = await import('../rpc');
    (getPublicClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

    const meta = await fetchErc20Metadata('eth', VALID_ADDR);
    expect(meta.address).toBe(VALID_ADDR);
    expect(meta.symbol).toBe('USDT');
    expect(meta.name).toBe('Tether USD');
    expect(meta.decimals).toBe(6);
  });

  it('бросает invalid_address на неверный формат', async () => {
    await expect(fetchErc20Metadata('eth', '0x1234')).rejects.toMatchObject({
      code: 'invalid_address',
    });
  });

  it('бросает invalid_address на не-checksum mixed case', async () => {
    // Нарушим checksum в одной букве
    const broken = '0xDac17F958D2ee523a2206206994597C13D831ec7';
    await expect(fetchErc20Metadata('eth', broken)).rejects.toMatchObject({
      code: 'invalid_address',
    });
  });

  it('lowercase address принимается', async () => {
    const client = installMockClient(({ functionName }) => {
      if (functionName === 'name') return 'Token';
      if (functionName === 'symbol') return 'TKN';
      if (functionName === 'decimals') return 18;
      throw new Error('unexpected');
    });
    const { getPublicClient } = await import('../rpc');
    (getPublicClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

    const meta = await fetchErc20Metadata('eth', VALID_ADDR.toLowerCase());
    expect(meta.address).toBe(VALID_ADDR);
  });

  it('бросает not_erc20 если readContract упал с произвольной ошибкой', async () => {
    const client = installMockClient(() => {
      throw new Error('execution reverted');
    });
    const { getPublicClient } = await import('../rpc');
    (getPublicClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

    await expect(fetchErc20Metadata('eth', VALID_ADDR)).rejects.toMatchObject({
      code: 'not_erc20',
    });
  });

  it('бросает no_contract при пустом ответе', async () => {
    const client = installMockClient(() => {
      throw new Error('returned no data');
    });
    const { getPublicClient } = await import('../rpc');
    (getPublicClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

    await expect(fetchErc20Metadata('eth', VALID_ADDR)).rejects.toMatchObject({
      code: 'no_contract',
    });
  });

  it('бросает network при сетевой ошибке', async () => {
    const client = installMockClient(() => {
      throw new Error('fetch failed: timeout');
    });
    const { getPublicClient } = await import('../rpc');
    (getPublicClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

    await expect(fetchErc20Metadata('eth', VALID_ADDR)).rejects.toMatchObject({
      code: 'network',
    });
  });

  it('бросает not_erc20 если decimals out of range', async () => {
    const client = installMockClient(({ functionName }) => {
      if (functionName === 'name') return 'Token';
      if (functionName === 'symbol') return 'TKN';
      if (functionName === 'decimals') return 99;
      throw new Error('unexpected');
    });
    const { getPublicClient } = await import('../rpc');
    (getPublicClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(client);

    await expect(fetchErc20Metadata('eth', VALID_ADDR)).rejects.toMatchObject({
      code: 'not_erc20',
    });
  });

  it('TokenMetadataError несёт code', () => {
    const e = new TokenMetadataError('invalid_address');
    expect(e.code).toBe('invalid_address');
    expect(e).toBeInstanceOf(Error);
  });
});
