import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Banner, Button } from '@rc/ui';
import { useDashboardData } from './hooks/useDashboardData';
import { GreetingHeader } from './components/GreetingHeader';
import { BalancesCard } from './components/BalancesCard';
import { AccountsCard } from './components/AccountsCard';
import { LastTransactionsCard } from './components/LastTransactionsCard';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { AccountWarnings, type PillWarning } from './components/AccountWarnings';
import { useWalletProfile } from '~/lib/wallet/useWallet';
import type { Banner as BannerT } from '@rc/types';

export function DashboardPage() {
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  const { data, isLoading, isError, refetch } = useDashboardData();
  const { profile } = useWalletProfile();

  // Mock-баннеры из mocks.json игнорируем — они привязаны к Chloe Kim, а не к реальному vault state.
  // Backup seed подтверждается на onboarding'е (ConfirmPage). Activation для XRPL показывается в Receive.
  const pillWarnings = useMemo<PillWarning[]>(() => {
    const list: PillWarning[] = [];
    if (profile?.kind && profile.kind !== 'multi_chain' && profile.kind !== 'ledger_hardware') {
      list.push({
        id: 'evm-reimport',
        severity: 'info',
        label: t('warnings.evmReimport'),
        to: '/settings/security',
      });
    }
    return list;
  }, [profile, t]);

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <Banner
          severity="danger"
          title={t('errors.loadFailed.title')}
          body={t('errors.loadFailed.body')}
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              {tCommon('actions.retry')}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GreetingHeader />

      {pillWarnings.length > 0 && <AccountWarnings warnings={pillWarnings} />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
          <LastTransactionsCard />
        </div>
        <aside className="lg:col-span-4 flex flex-col gap-6 min-w-0">
          <BalancesCard />
          <AccountsCard />
        </aside>
      </div>
    </div>
  );
}

// Unused but kept for type re-export visibility in dependents.
export type { BannerT };
