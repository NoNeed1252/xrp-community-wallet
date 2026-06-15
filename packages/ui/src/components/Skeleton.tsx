import type { HTMLAttributes } from 'react';
import { cn } from '../utils/cn.js';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: number | string;
  height?: number | string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const roundedClass = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
};

export function Skeleton({ width, height, rounded = 'md', className, style, ...rest }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'rc-shimmer bg-neutral-100',
        roundedClass[rounded],
        className,
      )}
      style={{ width, height, ...style }}
      {...rest}
    />
  );
}
