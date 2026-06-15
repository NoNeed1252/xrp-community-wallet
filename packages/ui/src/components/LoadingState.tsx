import { cn } from '../utils/cn.js';
import { Skeleton } from './Skeleton.js';

interface LoadingStateProps {
  variant?: 'list' | 'card' | 'grid' | 'inline';
  rows?: number;
  className?: string;
  /** ARIA label for screen readers describing what's loading. */
  label?: string;
}

export function LoadingState({
  variant = 'list',
  rows = 3,
  className,
  label = 'Loading',
}: LoadingStateProps) {
  const items = Array.from({ length: rows });

  if (variant === 'card') {
    return (
      <div
        className={cn('flex flex-col gap-3 p-4 rounded-xl bg-surface', className)}
        role="status"
        aria-busy="true"
        aria-label={label}
      >
        <Skeleton height={20} width="40%" />
        <Skeleton height={32} width="70%" />
        <Skeleton height={16} width="60%" />
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div
        className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4', className)}
        role="status"
        aria-busy="true"
        aria-label={label}
      >
        {items.map((_, i) => (
          <div key={i} className="flex flex-col gap-3 p-4 rounded-xl bg-surface">
            <Skeleton height={120} rounded="lg" />
            <Skeleton height={18} width="70%" />
            <Skeleton height={14} width="50%" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div
        className={cn('flex items-center gap-2', className)}
        role="status"
        aria-busy="true"
        aria-label={label}
      >
        <Skeleton height={16} width={80} />
        <Skeleton height={16} width={120} />
      </div>
    );
  }

  return (
    <ul
      className={cn('flex flex-col gap-2', className)}
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      {items.map((_, i) => (
        <li key={i} className="flex items-center gap-3 py-3">
          <Skeleton height={36} width={36} rounded="full" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton height={14} width="50%" />
            <Skeleton height={12} width="30%" />
          </div>
          <Skeleton height={16} width={64} />
        </li>
      ))}
    </ul>
  );
}
