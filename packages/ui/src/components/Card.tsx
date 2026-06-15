import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils/cn.js';

export function Card({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl bg-surface border border-neutral-200',
        'p-4 sm:p-6',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex items-center gap-2 mb-4', className)}>{children}</div>;
}

export function CardTitle({
  children,
  helper,
  className,
}: {
  children: ReactNode;
  helper?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2 text-h3 text-neutral-900', className)}>
      <span>{children}</span>
      {helper}
    </div>
  );
}

export function CardActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('ml-auto flex items-center gap-2', className)}>{children}</div>;
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(className)}>{children}</div>;
}
