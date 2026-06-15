import { Loader2 } from '../icons.js';
import { cn } from '../utils/cn.js';

interface SpinnerProps {
  size?: 16 | 20 | 24 | 32 | 48;
  className?: string;
  'aria-label'?: string;
}

export function Spinner({ size = 24, className, 'aria-label': ariaLabel = 'Loading' }: SpinnerProps) {
  return (
    <Loader2
      className={cn('animate-spin text-brand-600', className)}
      style={{ width: size, height: size }}
      role="status"
      aria-label={ariaLabel}
    />
  );
}
