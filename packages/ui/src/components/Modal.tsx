import * as Dialog from '@radix-ui/react-dialog';
import { X } from '../icons.js';
import type { ReactNode } from 'react';
import { cn } from '../utils/cn.js';
import { IconButton } from './IconButton.js';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeAriaLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

const sizeClass: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-[400px]',
  md: 'max-w-[480px]',
  lg: 'max-w-[640px]',
  xl: 'max-w-[800px]',
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  size = 'md',
  closeAriaLabel = 'Close',
  children,
  footer,
  className,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-modal bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out"
        />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-modal w-[calc(100vw-2rem)]',
            sizeClass[size],
            'bg-surface rounded-2xl shadow-e3 p-6 flex flex-col gap-4 outline-none',
            className,
          )}
        >
          {(title || description) && (
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                {title && <Dialog.Title className="text-h3 text-neutral-900">{title}</Dialog.Title>}
                {description && (
                  <Dialog.Description className="text-body text-neutral-500 mt-1">
                    {description}
                  </Dialog.Description>
                )}
              </div>
              <Dialog.Close asChild>
                <IconButton aria-label={closeAriaLabel} size="sm">
                  <X className="h-4 w-4" />
                </IconButton>
              </Dialog.Close>
            </div>
          )}
          <div>{children}</div>
          {footer && <div className="flex justify-end gap-2">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
