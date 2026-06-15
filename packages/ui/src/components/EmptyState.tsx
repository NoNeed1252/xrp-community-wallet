import type { ReactNode } from 'react';
import { cn } from '../utils/cn.js';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, body, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-10 gap-3', className)}>
      {icon && (
        <span className="text-neutral-300" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="text-h3 text-neutral-900">{title}</div>
      {body && <div className="text-body text-neutral-500 max-w-sm">{body}</div>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
