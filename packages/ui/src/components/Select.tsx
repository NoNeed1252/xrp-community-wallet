import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from '../icons.js';
import { cn } from '../utils/cn.js';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  /** Optional каплет (flag, ISO code, etc.) перед label. */
  caption?: string;
}

interface SelectProps<T extends string> {
  value: T;
  onChange: (next: T) => void;
  options: readonly SelectOption<T>[];
  /** Width. По умолчанию auto. */
  width?: string;
  /** Label вариант: компактный chip или полный listbox-button. */
  ariaLabel?: string;
  className?: string;
}

/**
 * Простой Select без зависимостей. Чисто наш дизайн: trigger-кнопка
 * + popover листбокс с проверкой / scrollbar hidden.
 */
export function Select<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  width,
  className,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={cn('relative', className)} style={{ width }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="inline-flex w-full items-center justify-between gap-2 h-10 px-3 rounded-md border border-neutral-200 bg-surface text-left text-body text-neutral-900 hover:bg-nested focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface"
      >
        <span className="flex items-center gap-2 truncate">
          {selected?.caption && (
            <span className="text-caption text-neutral-500">{selected.caption}</span>
          )}
          <span className="truncate">{selected?.label ?? ''}</span>
        </span>
        <ChevronDown
          className={cn('h-4 w-4 text-neutral-500 shrink-0 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      {open && (
        <ul
          role="listbox"
          className="rc-no-scrollbar absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-lg border border-neutral-200 bg-surface shadow-lg py-1"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-nested focus:outline-none focus:bg-nested',
                    isSelected && 'bg-nested',
                  )}
                >
                  {opt.caption && (
                    <span className="text-caption text-neutral-500 w-8 shrink-0 uppercase tabular-nums">
                      {opt.caption}
                    </span>
                  )}
                  <span className="flex-1 text-body text-neutral-900 truncate">{opt.label}</span>
                  {isSelected && <Check className="h-4 w-4 text-brand-600 shrink-0" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
