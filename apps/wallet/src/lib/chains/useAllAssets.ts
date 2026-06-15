import { useMemo } from 'react';
import { useCustomTokens } from './useCustomTokens';
import { customTokenToAsset } from './customTokensStore';
import { ALL_ASSETS, NATIVES } from './registry';
import { ERC20_TOKENS } from './tokens';
import type { Asset, EvmChainId, TokenAsset } from './types';

/**
 * Все активы (native + curated ERC-20 + пользовательские ERC-20).
 * Реактивно обновляется при добавлении/удалении custom токенов.
 */
export function useAllAssets(): Asset[] {
  const { tokens: customTokens } = useCustomTokens();
  return useMemo(() => {
    const customAssets = customTokens.map(customTokenToAsset);
    return [...ALL_ASSETS, ...customAssets];
  }, [customTokens]);
}

/** Токены конкретной EVM-цепи (curated + custom). */
export function useEvmTokensOnChain(chain: EvmChainId): TokenAsset[] {
  const { tokens: customTokens } = useCustomTokens();
  return useMemo(() => {
    const curated = ERC20_TOKENS.filter((t) => t.chain === chain);
    const custom = customTokens.filter((t) => t.chain === chain).map(customTokenToAsset);
    return [...curated, ...custom];
  }, [chain, customTokens]);
}

/** Все ERC-20 (curated + custom) — для useEvmAssets balance enumeration. */
export function useAllEvmTokens(): TokenAsset[] {
  const { tokens: customTokens } = useCustomTokens();
  return useMemo(() => {
    const custom = customTokens.map(customTokenToAsset);
    return [...ERC20_TOKENS, ...custom];
  }, [customTokens]);
}

/** Native + curated + custom, как `ALL_ASSETS` но с учётом customs. */
export function useAllAssetsArray(): Asset[] {
  const all = useAllAssets();
  return all;
}

// Helper, не hook — для функций вне React (например, поиск в store).
export function findAssetIn(all: readonly Asset[], id: string): Asset | undefined {
  return all.find((a) => a.id === id);
}

export { NATIVES };
