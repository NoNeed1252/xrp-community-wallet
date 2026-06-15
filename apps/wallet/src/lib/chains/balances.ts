import { ERC20_TOKENS } from './tokens';
import { getPublicClient } from './rpc';
import { NATIVES, isEvm } from './registry';
import type { AssetBalance, AssetId, ChainId, EvmChainId, TokenAsset } from './types';

const ERC20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export async function getNativeBalance(
  chain: EvmChainId,
  address: `0x${string}`,
): Promise<bigint> {
  const client = await getPublicClient(chain);
  return client.getBalance({ address });
}

export async function getTokenBalance(
  chain: EvmChainId,
  tokenAddress: `0x${string}`,
  owner: `0x${string}`,
): Promise<bigint> {
  const client = await getPublicClient(chain);
  const raw = (await client.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [owner],
  })) as bigint;
  return raw;
}

export interface FetchBalancesInput {
  readonly chains: ReadonlyArray<{ chain: ChainId; address: string }>;
  /** Если true — для EVM собираем native + все ERC-20 из whitelist; иначе только native. */
  readonly includeTokens?: boolean;
  /** Дополнительные токены (пользовательские) — собираются вместе с curated если includeTokens=true. */
  readonly extraTokens?: readonly TokenAsset[];
}

export type BalanceMap = ReadonlyMap<AssetId, AssetBalance>;

export async function fetchBalances(input: FetchBalancesInput): Promise<BalanceMap> {
  const result = new Map<AssetId, AssetBalance>();
  const tasks: Promise<void>[] = [];

  for (const entry of input.chains) {
    if (!isEvm(entry.chain)) continue; // XRPL — отдельный путь (mock в W10)
    const address = entry.address as `0x${string}`;
    const chain = entry.chain;
    const native = NATIVES[chain];

    tasks.push(
      getNativeBalance(chain, address)
        .then((amount) => {
          result.set(native.id, {
            assetId: native.id,
            chain,
            amount,
            decimals: native.decimals,
          });
        })
        .catch(() => {
          // partial failure — пропускаем; UI покажет "balance unavailable"
        }),
    );

    if (input.includeTokens) {
      const curated = ERC20_TOKENS.filter((t) => t.chain === chain);
      const extra = (input.extraTokens ?? []).filter((t) => t.chain === chain);
      const tokens = [...curated, ...extra];
      for (const token of tokens) {
        tasks.push(
          getTokenBalance(chain, token.address, address)
            .then((amount) => {
              result.set(token.id, {
                assetId: token.id,
                chain,
                amount,
                decimals: token.decimals,
              });
            })
            .catch(() => {
              // ignore single-token failure
            }),
        );
      }
    }
  }

  await Promise.allSettled(tasks);
  return result;
}

export function formatDecimal(amount: bigint, decimals: number, fractionDigits = 6): string {
  if (amount === 0n) return '0';
  const base = 10n ** BigInt(decimals);
  const whole = amount / base;
  const remainder = amount % base;
  if (remainder === 0n) return whole.toString();
  const fracStr = remainder.toString().padStart(decimals, '0').slice(0, fractionDigits);
  const trimmed = fracStr.replace(/0+$/u, '');
  return trimmed ? `${whole}.${trimmed}` : whole.toString();
}
