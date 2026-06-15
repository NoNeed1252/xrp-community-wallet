import { useMemo, useState } from 'react';
import { Card, LoadingState, useMediaQuery } from '@rc/ui';
import { useTranslation } from 'react-i18next';
import { useWalletProfile } from '~/lib/wallet/useWallet';
import { useEffectiveXrpBalance } from '~/features/send/hooks/useEffectiveXrpBalance';
import { getChainAddress } from '~/lib/wallet/vault';
import { ActivationPill } from '~/features/_shared/ActivationPill';
import { AddressBlock } from './components/AddressBlock';
import { QrBlock } from './components/QrBlock';
import { SubAccountQuick } from './components/SubAccountQuick';
import { NetworkSelector, type ReceiveNetwork } from './components/NetworkSelector';

export function ReceivePage() {
  const { t } = useTranslation('receive');
  const { profile, loading } = useWalletProfile();
  const xrp = useEffectiveXrpBalance();
  const isCompact = useMediaQuery('(max-width: 767px)');
  const qrSize = isCompact ? 200 : 240;

  const evmEnabled = profile?.kind === 'multi_chain';
  const [network, setNetwork] = useState<ReceiveNetwork>('xrp');
  const [activeDt, setActiveDt] = useState<number | null>(null);

  // EVM address — общий для ETH/BSC/POL.
  const chainAddress = useMemo(() => {
    if (!profile) return null;
    if (network === 'xrp') return getChainAddress(profile, 'xrpl');
    return getChainAddress(profile, 'eth');
  }, [profile, network]);

  const qrValue = useMemo(() => {
    if (!chainAddress) return null;
    if (network === 'xrp' && activeDt !== null) {
      return `xrpl:${chainAddress}?dt=${activeDt}`;
    }
    return chainAddress;
  }, [chainAddress, network, activeDt]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-h1 text-neutral-900">{t('title')}</h1>
        <p className="text-body text-neutral-500">{t('subtitle')}</p>
      </div>

      <NetworkSelector
        selected={network}
        onSelect={(next) => {
          setNetwork(next);
          setActiveDt(null);
        }}
        evmEnabled={Boolean(evmEnabled)}
      />

      <Card>
        {loading || !profile || !chainAddress ? (
          <LoadingState variant="card" label={t('title')} />
        ) : (
          <div className={isCompact ? 'flex flex-col items-center gap-6' : 'flex items-center gap-8'}>
            <div className="shrink-0 rounded-2xl bg-gradient-to-br from-brand-50 to-surface p-3 ring-1 ring-brand-100">
              <QrBlock
                value={qrValue}
                size={qrSize}
                ariaLabel={t('qr.alt', { address: chainAddress })}
              />
            </div>
            <div className="flex-1 min-w-0 w-full space-y-3">
              <AddressBlock address={chainAddress} />
              {network === 'xrp' && !xrp.activated && (
                <div>
                  <ActivationPill />
                </div>
              )}
              {network === 'evm' && (
                <p className="text-caption text-neutral-500">
                  {t('network.evm.helper')}
                </p>
              )}
              {activeDt !== null && (
                <p className="text-caption text-neutral-600">
                  {t('qr.destinationTagHint', { tag: activeDt })}
                </p>
              )}
            </div>
          </div>
        )}
      </Card>

      {profile && network === 'xrp' && (
        <Card>
          <SubAccountQuick
            accountId={profile.id}
            onCreated={({ destinationTag }) => setActiveDt(destinationTag)}
          />
        </Card>
      )}
    </div>
  );
}
