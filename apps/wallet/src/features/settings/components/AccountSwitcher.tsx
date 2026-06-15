import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Plus, Usb } from '@rc/ui';
import { WalletAvatar, cn } from '@rc/ui';
import { useActiveAccount, useAllAccounts } from '~/lib/wallet/useWallet';
import { setActiveAccount } from '~/lib/wallet/vaultMutations';
import { maskAddress, truncateMiddle } from '@rc/types';

function HardwareBadge() {
  const { t } = useTranslation('ledger');
  return (
    <span
      className="inline-flex items-center gap-1 h-5 px-1.5 rounded-full bg-neutral-100 text-neutral-700 text-caption"
      title={t('badge')}
    >
      <Usb className="h-3 w-3" aria-hidden />
    </span>
  );
}

export function AccountSwitcher() {
  const { t } = useTranslation('settings');
  const navigate = useNavigate();
  const { profile: active } = useActiveAccount();
  const { profiles } = useAllAccounts();
  const [open, setOpen] = useState(false);

  if (!active) return null;

  const onPick = async (id: string) => {
    if (id !== active.id) await setActiveAccount(id);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 px-2 h-10 rounded-md hover:bg-neutral-100 text-neutral-900 transition-colors max-w-[200px]"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <WalletAvatar seed={active.id} size={24} />
        <span className="hidden sm:inline text-body-strong truncate">
          {truncateMiddle(active.label, 18)}
        </span>
        <ChevronDown className="h-4 w-4 text-neutral-500" aria-hidden />
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-dropdown cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="fixed left-3 right-3 top-16 z-dropdown rounded-lg bg-surface border border-neutral-200 shadow-e2 py-1 sm:absolute sm:left-0 sm:right-auto sm:top-12 sm:w-[320px]"
          >
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                role="menuitem"
                onClick={() => onPick(p.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-neutral-100 transition-colors',
                  p.id === active.id && 'bg-brand-50',
                )}
              >
                <WalletAvatar seed={p.id} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="text-body-strong text-neutral-900 truncate flex items-center gap-1">
                    {p.label}
                    {p.kind === 'ledger_hardware' && <HardwareBadge />}
                  </div>
                  <div className="text-caption text-neutral-500 font-mono truncate">
                    {maskAddress(p.address, 6, 6)}
                  </div>
                </div>
                {p.id === active.id && <Check className="h-4 w-4 text-brand-600" aria-hidden />}
              </button>
            ))}
            <div className="border-t border-neutral-200 my-1" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                navigate('/onboarding/welcome?mode=add');
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-brand-600 hover:bg-brand-50 transition-colors"
            >
              <span className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center">
                <Plus className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-body-strong">{t('accounts.add.cta')}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
