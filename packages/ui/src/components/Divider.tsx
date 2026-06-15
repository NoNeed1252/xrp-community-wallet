import { cn } from '../utils/cn.js';

export function Divider({ className }: { className?: string }) {
  return <hr aria-hidden className={cn('border-0 border-t border-neutral-200', className)} />;
}
