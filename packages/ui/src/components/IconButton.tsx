import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils/cn.js';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  children: ReactNode;
  size?: 'sm' | 'md';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, children, size = 'md', type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-md text-neutral-700 hover:bg-neutral-100 transition-colors duration-120 ease-standard',
        size === 'md' ? 'h-10 w-10' : 'h-8 w-8',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
