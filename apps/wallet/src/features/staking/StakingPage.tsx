import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StakingHero } from './components/StakingHero';
import { PoolCard } from './components/PoolCard';
import { PositionsCard } from './components/PositionsCard';
import { StakeModal } from './components/StakeModal';

export function StakingPage() {
  const { t } = useTranslation('staking');
  const [searchParams, setSearchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);

  // /staking?action=open — открываем модалку (из QuickActions split-menu на Home).
  useEffect(() => {
    if (searchParams.get('action') === 'open') {
      setModalOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('action');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-h1 text-neutral-900">{t('title')}</h1>
        <p className="text-body text-neutral-500">{t('subtitle')}</p>
      </div>

      <StakingHero onStake={() => setModalOpen(true)} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
          <PositionsCard onStake={() => setModalOpen(true)} />
        </div>
        <aside className="lg:col-span-4 flex flex-col gap-6 min-w-0">
          <PoolCard />
        </aside>
      </div>

      <StakeModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
