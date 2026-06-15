import { CoinIcon } from './CoinIcon.js';
import { cn } from '../utils/cn.js';

interface CoinStackProps {
  symbols: string[];
  overflow?: number;
  size?: 20 | 24 | 28;
  className?: string;
}

export function CoinStack({ symbols, overflow = 0, size = 24, className }: CoinStackProps) {
  return (
    <span className={cn('inline-flex items-center', className)}>
      {symbols.map((s, idx) => (
        <span
          key={`${s}-${idx}`}
          style={{ marginLeft: idx === 0 ? 0 : -8 }}
          className="relative"
        >
          <CoinIcon symbol={s} size={size} />
        </span>
      ))}
      {overflow > 0 && (
        <span
          style={{ marginLeft: -8 }}
          className="relative inline-flex items-center justify-center rounded-full bg-neutral-100 text-neutral-700 text-caption font-medium ring-2 ring-surface"
        >
          <span
            className="px-1.5"
            style={{ minWidth: size, height: size, lineHeight: `${size}px`, display: 'inline-block', textAlign: 'center' }}
          >
            +{overflow}
          </span>
        </span>
      )}
    </span>
  );
}
