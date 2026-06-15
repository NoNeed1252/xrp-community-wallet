import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils/cn.js';

export type BadgeVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: ReactNode;
  children: ReactNode;
}

const variantClass: Record<BadgeVariant, string> = {
  info: 'bg-info-100 text-info-700',
  success: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-700',
  danger: 'bg-danger-100 text-danger-700',
  neutral: 'bg-neutral-100 text-neutral-700',
};

export function Badge({ variant = 'info', icon, children, className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 h-6 px-2 rounded-full text-caption font-medium whitespace-nowrap',
        variantClass[variant],
        className,
      )}
      {...rest}
    >
      {icon && <span aria-hidden>{icon}</span>}
      {children}
    </span>
  );
}
