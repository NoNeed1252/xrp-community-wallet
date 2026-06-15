import { useMemo } from 'react';
import { dropsToXrp } from '@rc/types';
import { formatDecimal } from '~/lib/chains/balances';
import { useEvmAssets } from '~/features/portfolio/hooks/useEvmAssets';
import { useEffectiveXrpBalance } from './useEffectiveXrpBalance';
import type { Asset } from '~/lib/chains/types';

export interface UseAssetBalancesResult {
  /** Map asset.id → human-readable amount + symbol для AssetSelector. */
  balances: Record<string, string>;
  /** assets, отсортированные по убыванию (sortKey = valueUsd либо balance). */
  sortedAssets: Asset[];
}

/**
 * Объединяет баланс XRP (XRPL live) + EVM (RPC) для UI селектора активов.
 * Активы без баланса попадают в конец списка (но не скрываются).
 */
export function useAssetBalances(assets: readonly Asset[]): UseAssetBalancesResult {
  const xrp = useEffectiveXrpBalance();
  const evm = useEvmAssets();

  return useMemo(() => {
    const balances: Record<string, string> = {};
    const sortKey: Record<string, number> = {};

    // XRP — live balance.
    const xrpAmount = dropsToXrp(xrp.balanceDrops);
    if (Number(xrpAmount) > 0) {
      balances['xrpl:xrp'] = `${xrpAmount} XRP`;
    }
    sortKey['xrpl:xrp'] = Number(xrpAmount);

    // EVM — из useEvmAssets (которые уже отфильтрованы по non-zero для tokens).
    for (const h of evm.holdings) {
      const human = h.amountHuman;
      if (Number(human) > 0) {
        balances[h.asset.id] = `${human} ${h.asset.symbol}`;
      }
      // Сортировка предпочтительно по USD value; если цены нет — по числовому балансу.
      sortKey[h.asset.id] = h.valueUsd || Number(human) || 0;
    }

    // Для assets, по которым нет данных — sortKey остаётся 0 (хвост списка).
    const sorted = [...assets].sort((a, b) => {
      const av = sortKey[a.id] ?? 0;
      const bv = sortKey[b.id] ?? 0;
      if (av === bv) return 0;
      return bv - av;
    });

    return { balances, sortedAssets: sorted };
  }, [assets, xrp.balanceDrops, evm.holdings]);
}
