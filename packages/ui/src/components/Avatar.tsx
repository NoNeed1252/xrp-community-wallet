import { cn } from '../utils/cn.js';

interface AvatarProps {
  initial?: string;
  size?: 24 | 28 | 32 | 40;
  className?: string;
}

export function Avatar({ initial = '?', size = 32, className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold ring-2 ring-surface',
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, size / 2.4) }}
      aria-hidden
    >
      {initial.slice(0, 1).toUpperCase()}
    </span>
  );
}
