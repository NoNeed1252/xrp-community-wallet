import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from '@rc/ui';
import { CoinIcon } from '@rc/ui';
import { CHAINS } from '~/lib/chains/registry';
import type { Asset, ChainId } from '~/lib/chains/types';
import { assetIconUrl } from '~/lib/chains/assets/iconUrl';

interface AssetSelectorProps {
  assets: readonly Asset[];
  selected: Asset;
  onSelect: (asset: Asset) => void;
  /** Опциональные balances для отображения рядом с активом. assetId → human-readable. */
  balances?: Readonly<Record<string, string>>;
  ariaLabel?: string;
}

export function AssetSelector({ assets, selected, onSelect, balances, ariaLabel }: AssetSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const chainLabel = selected.kind === 'native' ? CHAINS[selected.chain as ChainId].shortLabel : `${CHAINS[selected.chain as ChainId].shortLabel} · ERC-20`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex w-full items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-surface px-3 py-2.5 text-left hover:bg-nested focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className="flex items-center gap-3 min-w-0">
          <CoinIcon symbol={selected.symbol} size={28} src={assetIconUrl(selected)} />
          <span className="flex flex-col min-w-0">
            <span className="text-body font-medium text-neutral-900 truncate">{selected.symbol}</span>
            <span className="text-caption text-neutral-500 truncate">{chainLabel}</span>
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="rc-no-scrollbar absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-lg border border-neutral-200 bg-surface shadow-lg py-1"
        >
          {assets.map((asset) => {
            const isSelected = asset.id === selected.id;
            const balance = balances?.[asset.id];
            const chainText = asset.kind === 'native' ? CHAINS[asset.chain as ChainId].shortLabel : `${CHAINS[asset.chain as ChainId].shortLabel} · ERC-20`;
            return (
              <li key={asset.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelect(asset);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-nested focus:outline-none focus:bg-nested ${isSelected ? 'bg-nested' : ''}`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <CoinIcon symbol={asset.symbol} size={24} src={assetIconUrl(asset)} />
                    <span className="flex flex-col min-w-0">
                      <span className="text-body text-neutral-900 truncate">{asset.symbol}</span>
                      <span className="text-caption text-neutral-500 truncate">{chainText}</span>
                    </span>
                  </span>
                  {balance && (
                    <span className="text-caption text-neutral-700 tabular-nums whitespace-nowrap">{balance}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
