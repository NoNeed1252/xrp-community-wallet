import { useTranslation } from 'react-i18next';
import { WalletAvatar } from '@rc/ui';
import { maskAddress } from '@rc/types';
import { useWalletProfile } from '~/lib/wallet/useWallet';
import { QuickActions } from './QuickActions';

export function GreetingHeader() {
  const { t } = useTranslation('dashboard');
  const { profile } = useWalletProfile();

  return (
    <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
      <div className="flex items-center gap-3 min-w-0">
        {profile && <WalletAvatar seed={profile.id} size={40} className="shrink-0" />}
        <div className="min-w-0 flex flex-col">
          <h1 className="text-h1 text-neutral-900 truncate">
            {t('greeting.welcomeBack')}
          </h1>
          {profile && (
            <p className="text-caption text-neutral-500 flex items-center gap-2">
              <span className="truncate">{profile.label}</span>
              <span className="text-neutral-300">·</span>
              <span className="font-mono">{maskAddress(profile.address, 6, 6)}</span>
            </p>
          )}
        </div>
      </div>
      <QuickActions />
    </div>
  );
}
