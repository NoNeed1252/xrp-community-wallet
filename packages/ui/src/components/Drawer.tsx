import * as Dialog from '@radix-ui/react-dialog';
import { X } from '../icons.js';
import type { ReactNode } from 'react';
import { cn } from '../utils/cn.js';
import { IconButton } from './IconButton.js';

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  side?: 'right' | 'left';
  width?: 360 | 480 | 560;
  closeAriaLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

const widthClass: Record<NonNullable<DrawerProps['width']>, string> = {
  360: 'sm:w-[360px]',
  480: 'sm:w-[480px]',
  560: 'sm:w-[560px]',
};

export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  side = 'right',
  width = 480,
  closeAriaLabel = 'Close',
  children,
  footer,
  className,
}: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-drawer bg-black/50" />
        <Dialog.Content
          className={cn(
            'fixed top-0 bottom-0 z-drawer bg-surface shadow-e3 outline-none flex flex-col',
            'w-full',
            widthClass[width],
            side === 'right' ? 'right-0' : 'left-0',
            className,
          )}
        >
          {(title || description) && (
            <div className="flex items-start gap-3 px-6 py-4 border-b border-neutral-200 shrink-0">
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
          <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
          {footer && (
            <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-2 shrink-0">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
