import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from '../icons.js';
import { cn } from '../utils/cn.js';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'subtle' | 'destructive' | 'link';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClass: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-brand-600 text-neutral-0 hover:bg-brand-700 active:bg-brand-700 disabled:bg-neutral-100 disabled:text-neutral-400',
  secondary:
    'bg-surface text-brand-600 border border-brand-600 hover:bg-brand-50 disabled:opacity-60',
  ghost:
    'bg-transparent text-neutral-700 hover:bg-neutral-100 disabled:opacity-50',
  subtle:
    'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 disabled:opacity-50',
  destructive:
    'bg-danger-700 text-neutral-0 hover:opacity-90 disabled:opacity-50',
  link:
    'bg-transparent text-brand-600 hover:underline disabled:opacity-50 px-0 py-0',
};

const sizeClass: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-3 text-caption rounded-md',
  md: 'h-10 px-4 text-body-strong rounded-md',
  lg: 'h-12 px-5 text-body-strong rounded-md',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    leftIcon,
    rightIcon,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-120 ease-standard select-none',
        variantClass[variant],
        variant === 'link' ? '' : sizeClass[size],
        isDisabled && 'cursor-not-allowed',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        leftIcon && <span aria-hidden>{leftIcon}</span>
      )}
      <span>{children}</span>
      {!loading && rightIcon && <span aria-hidden>{rightIcon}</span>}
    </button>
  );
});
