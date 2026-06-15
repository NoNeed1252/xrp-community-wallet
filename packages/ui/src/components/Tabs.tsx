import * as RadixTabs from '@radix-ui/react-tabs';
import { cn } from '../utils/cn.js';

interface TabsProps {
  value: string;
  onValueChange: (v: string) => void;
  items: Array<{ value: string; label: string }>;
  className?: string;
}

export function Tabs({ value, onValueChange, items, className }: TabsProps) {
  return (
    <RadixTabs.Root value={value} onValueChange={onValueChange} className={className}>
      <RadixTabs.List className="inline-flex items-center gap-6 border-b border-neutral-200">
        {items.map((it) => (
          <RadixTabs.Trigger
            key={it.value}
            value={it.value}
            className={cn(
              'relative pb-3 pt-1 text-body text-neutral-500 transition-colors duration-120',
              'data-[state=active]:text-neutral-900 data-[state=active]:font-medium',
              'hover:text-neutral-700',
              'focus-visible:outline-none focus-visible:text-neutral-900',
              'after:absolute after:left-0 after:right-0 after:bottom-0 after:h-0.5 after:bg-transparent',
              'data-[state=active]:after:bg-brand-600',
            )}
          >
            {it.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
    </RadixTabs.Root>
  );
}
