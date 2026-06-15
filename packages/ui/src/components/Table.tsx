import type { HTMLAttributes, ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import { cn } from '../utils/cn.js';

export function Table({
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full border-collapse', className)} {...rest}>
        {children}
      </table>
    </div>
  );
}

export function Tr({ children, className, ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('border-b border-neutral-200 last:border-0', className)} {...rest}>
      {children}
    </tr>
  );
}

export function Th({
  children,
  className,
  align = 'left',
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right' | 'center' }) {
  return (
    <th
      scope="col"
      className={cn(
        'py-3 px-3 first:pl-0 last:pr-0 text-caption font-medium text-neutral-500 whitespace-nowrap text-left',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  align = 'left',
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right' | 'center' }) {
  return (
    <td
      className={cn(
        'py-4 px-3 first:pl-0 last:pr-0 text-body text-neutral-900 align-middle whitespace-nowrap text-left',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
      {...rest}
    >
      {children}
    </td>
  );
}
