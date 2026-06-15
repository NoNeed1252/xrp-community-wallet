import * as Tooltip from '@radix-ui/react-tooltip';
import { HelpCircle } from '../icons.js';
import { cn } from '../utils/cn.js';

interface HelperProps {
  text: string;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function Helper({ text, className, side = 'top' }: HelperProps) {
  return (
    <Tooltip.Provider delayDuration={120}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            aria-label={text}
            className={cn(
              'inline-flex h-4 w-4 items-center justify-center rounded-full text-neutral-500 hover:text-neutral-700',
              className,
            )}
          >
            <HelpCircle className="h-4 w-4" aria-hidden />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side={side}
            sideOffset={6}
            className="z-tooltip max-w-[280px] rounded-md bg-neutral-900 text-neutral-0 px-3 py-2 text-caption shadow-e2 data-[state=delayed-open]:duration-120"
          >
            {text}
            <Tooltip.Arrow className="fill-neutral-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
