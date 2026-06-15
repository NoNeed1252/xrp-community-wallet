import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ChevronDown, Coins } from '@rc/ui';
import { Button } from '@rc/ui';

export function QuickActions() {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
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

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div ref={ref} className="relative">
      <Button
        size="lg"
        rightIcon={<ChevronDown className="h-4 w-4" aria-hidden="true" />}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {t('cta.createTransaction')}
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 right-0 z-30 mt-2 rounded-lg border border-neutral-200 bg-surface shadow-lg py-1 sm:left-auto sm:right-0 sm:min-w-[220px]"
        >
          <button
            role="menuitem"
            type="button"
            onClick={() => go('/send')}
            className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-nested focus:outline-none focus:bg-nested"
          >
            <ArrowUpRight className="h-4 w-4 text-brand-600" aria-hidden="true" />
            <span className="text-body text-neutral-900">{t('cta.menu.send')}</span>
          </button>
          <button
            role="menuitem"
            type="button"
            onClick={() => go('/staking?action=open')}
            className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-nested focus:outline-none focus:bg-nested"
          >
            <Coins className="h-4 w-4 text-brand-600" aria-hidden="true" />
            <span className="text-body text-neutral-900">{t('cta.menu.stake')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
