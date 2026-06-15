import type { ReactNode } from 'react';
import { cn } from '../utils/cn.js';

export function MobileList({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-2', className)}>{children}</div>;
}

export function MobileListItem({
  top,
  middle,
  bottom,
  className,
}: {
  top?: ReactNode;
  middle?: ReactNode;
  bottom?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg bg-nested p-4 flex flex-col gap-1', className)}>
      {top && <div className="flex items-center justify-between text-caption text-neutral-500">{top}</div>}
      {middle && <div className="text-body text-neutral-900">{middle}</div>}
      {bottom && <div className="text-body-strong text-neutral-900">{bottom}</div>}
    </div>
  );
}
