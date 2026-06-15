import { useMemo } from 'react';
import { toSvg } from 'jdenticon';
import { cn } from '../utils/cn.js';

interface WalletAvatarProps {
  seed: string;
  size?: number;
  className?: string;
}

/**
 * Уникальный SVG-аватар кошелька — identicon в стиле GitHub.
 * Деривация — детерминированная: один и тот же seed даёт идентичный SVG.
 * Используем jdenticon (https://github.com/dmester/jdenticon) — pure-JS,
 * без зависимостей, ~9 KB gzip.
 */
export function WalletAvatar({ seed, size = 32, className }: WalletAvatarProps) {
  const svg = useMemo(() => {
    return toSvg(seed || 'rc-wallet', size, {
      padding: 0.06,
      backColor: '#0F2440FF',
    });
  }, [seed, size]);

  return (
    <span
      role="presentation"
      aria-hidden="true"
      className={cn('inline-block overflow-hidden rounded-full align-middle', className)}
      style={{ width: size, height: size, lineHeight: 0 }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
