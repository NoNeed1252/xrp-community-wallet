import type { EvmChainId } from './types';

// ADR-056. HTTPS only, hardcoded — никаких user-supplied URL.
export const RPC_ENDPOINTS: Readonly<Record<EvmChainId, readonly string[]>> = {
  eth: ['https://cloudflare-eth.com', 'https://ethereum-rpc.publicnode.com'],
  bsc: ['https://bsc-dataseed.binance.org', 'https://bsc.publicnode.com'],
  pol: ['https://polygon-rpc.com', 'https://polygon-bor-rpc.publicnode.com'],
};

export type PublicClientLike = {
  getBalance: (args: { address: `0x${string}` }) => Promise<bigint>;
  readContract: (args: {
    address: `0x${string}`;
    abi: readonly unknown[];
    functionName: string;
    args?: readonly unknown[];
  }) => Promise<unknown>;
  estimateGas: (args: {
    account: `0x${string}`;
    to: `0x${string}`;
    value?: bigint;
    data?: `0x${string}`;
  }) => Promise<bigint>;
  getGasPrice: () => Promise<bigint>;
};

let cache: Partial<Record<EvmChainId, PublicClientLike>> = {};

export async function getPublicClient(chain: EvmChainId): Promise<PublicClientLike> {
  const cached = cache[chain];
  if (cached) return cached;
  const [{ createPublicClient, http, fallback }, { mainnet, bsc, polygon }] = await Promise.all([
    import('viem'),
    import('viem/chains'),
  ]);
  const chainDef = chain === 'eth' ? mainnet : chain === 'bsc' ? bsc : polygon;
  const endpoints = RPC_ENDPOINTS[chain];
  const transports = endpoints.map((url) =>
    http(url, { timeout: 8_000, retryCount: 1, retryDelay: 300 }),
  );
  const client = createPublicClient({
    chain: chainDef,
    transport: fallback(transports, { rank: false }),
  }) as unknown as PublicClientLike;
  cache[chain] = client;
  return client;
}

export function __resetRpcClientCacheForTesting(): void {
  cache = {};
}
