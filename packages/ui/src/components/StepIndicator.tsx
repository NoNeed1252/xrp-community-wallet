import { cn } from '../utils/cn.js';

interface StepIndicatorProps {
  current: number;
  total: number;
  label?: string;
  className?: string;
}

export function StepIndicator({ current, total, label, className }: StepIndicatorProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="flex items-center gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current}>
        {Array.from({ length: total }).map((_, i) => {
          const idx = i + 1;
          const passed = idx < current;
          const active = idx === current;
          return (
            <span
              key={i}
              className={cn(
                'inline-block rounded-full transition-all duration-120',
                active ? 'h-2 w-2 bg-brand-600' : passed ? 'h-1.5 w-1.5 bg-brand-600' : 'h-1.5 w-1.5 bg-neutral-300',
              )}
            />
          );
        })}
      </div>
      {label && <span className="text-caption text-neutral-500">{label}</span>}
    </div>
  );
}
