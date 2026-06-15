import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils/cn.js';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, leftIcon, rightSlot, type = 'text', ...rest },
  ref,
) {
  return (
    <div
      className={cn(
        'inline-flex items-center w-full h-10 rounded-md bg-surface border transition-colors duration-120',
        invalid ? 'border-danger-700' : 'border-neutral-300',
        'focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-100',
        invalid ? 'focus-within:border-danger-700' : 'focus-within:border-brand-600',
        rest.disabled && 'bg-neutral-100 opacity-60 cursor-not-allowed',
        className,
      )}
    >
      {leftIcon && (
        <span className="pl-3 text-neutral-400 shrink-0" aria-hidden>
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        type={type}
        className={cn(
          'flex-1 min-w-0 h-full bg-transparent px-3 text-body text-neutral-900 placeholder-neutral-400',
          'focus:outline-none',
        )}
        {...rest}
      />
      {rightSlot && <span className="pr-2 shrink-0">{rightSlot}</span>}
    </div>
  );
});
