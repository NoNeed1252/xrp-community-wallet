import { useState } from 'react';
import { cn } from '../utils/cn.js';

interface CoinIconProps {
  symbol: string;
  size?: 16 | 20 | 24 | 28 | 32;
  className?: string;
  /** Опциональный URL картинки (Trust Wallet CDN). Fallback на буквенный плейсхолдер. */
  src?: string;
}

/**
 * Простой плейсхолдер монеты: круг с уникальным цветом + первая буква.
 * Реальные SVG-иконки криптоактивов подгружаем позже в @rc/ui/coins.
 */
const COLOR_MAP: Record<string, { bg: string; fg: string }> = {
  XRP: { bg: 'bg-brand-600', fg: 'text-neutral-0' },
  BTC: { bg: 'bg-[#F7931A]', fg: 'text-neutral-0' },
  ETH: { bg: 'bg-neutral-700', fg: 'text-neutral-0' },
  USDT: { bg: 'bg-[#26A17B]', fg: 'text-neutral-0' },
  USDC: { bg: 'bg-brand-500', fg: 'text-neutral-0' },
  RLUSD: { bg: 'bg-brand-600', fg: 'text-neutral-0' },
  SOL: { bg: 'bg-[#9945FF]', fg: 'text-neutral-0' },
  ADA: { bg: 'bg-[#0033AD]', fg: 'text-neutral-0' },
};

function colorsFor(symbol: string): { bg: string; fg: string } {
  return COLOR_MAP[symbol.toUpperCase()] ?? { bg: 'bg-neutral-200', fg: 'text-neutral-700' };
}

export function CoinIcon({ symbol, size = 24, className, src }: CoinIconProps) {
  const { bg, fg } = colorsFor(symbol);
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold ring-2 ring-surface overflow-hidden',
        !showImage && bg,
        !showImage && fg,
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(8, size / 2.6),
      }}
      aria-label={symbol}
      role="img"
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        symbol.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}
