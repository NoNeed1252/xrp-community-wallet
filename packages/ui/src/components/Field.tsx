import { useId, type ReactNode } from 'react';
import { cn } from '../utils/cn.js';

interface FieldProps {
  label?: ReactNode;
  helper?: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  /** Renders children with auto-bound id from the label. */
  children: (id: string) => ReactNode;
}

export function Field({ label, helper, error, required, className, children }: FieldProps) {
  const id = useId();
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-caption font-medium text-neutral-700">
          {label}
          {required && <span aria-hidden className="text-danger-700 ml-0.5">*</span>}
        </label>
      )}
      {children(id)}
      {error ? (
        <span role="alert" className="text-caption text-danger-700">
          {error}
        </span>
      ) : helper ? (
        <span className="text-caption text-neutral-500">{helper}</span>
      ) : null}
    </div>
  );
}
