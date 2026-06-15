import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ChartLineUp, HandCoins, Percent, Vault } from '@rc/ui';
import { dropsToXrp, formatCrypto } from '@rc/types';
import { computeRewardsDrops, POOL_APR_PCT, sumDrops, useStakingState } from '../hooks/useStakingState';

interface Props {
  onStake: () => void;
}

export function StakingHero({ onStake }: Props) {
  const { t } = useTranslation('staking');
  const positions = useStakingState((s) => s.positions);

  // Перерисовываем счётчик rewards раз в секунду, чтобы было видно начисление.
  const [, tick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 1_000);
    return () => window.clearInterval(id);
  }, []);

  const totals = useMemo(() => {
    const deposits = positions.filter((p) => p.status === 'active' || p.status === 'pending').map((p) => p.depositDrops);
    const rewards = positions.map((p) => computeRewardsDrops(p));
    return {
      depositDrops: sumDrops(deposits),
      rewardsDrops: sumDrops(rewards),
    };
  }, [positions]);

  const depositXrp = formatCrypto(dropsToXrp(totals.depositDrops), 'XRP').value;
  const rewardsXrp = formatCrypto(dropsToXrp(totals.rewardsDrops), 'XRP').value;

  return (
    <div className="rounded-xl border border-brand-700/30 overflow-hidden">
      <div className="bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700 text-neutral-0 px-6 py-7 sm:px-8 sm:py-9">
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1.5 text-caption uppercase tracking-wide text-neutral-0/80">
            <HandCoins className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('hero.tagline')}</span>
          </span>
          <h2 className="text-h2 font-semibold">{t('hero.title')}</h2>
          <p className="text-body text-neutral-0/85 max-w-xl">{t('hero.body', { apr: POOL_APR_PCT.toFixed(2) })}</p>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <HeroMetric
            icon={<Vault className="h-5 w-5" aria-hidden="true" />}
            label={t('hero.totalStaked')}
            value={`${depositXrp} XRP`}
          />
          <HeroMetric
            icon={<ChartLineUp className="h-5 w-5" aria-hidden="true" />}
            label={t('hero.totalRewards')}
            value={`${rewardsXrp} XRP`}
            highlight
          />
          <HeroMetric
            icon={<Percent className="h-5 w-5" aria-hidden="true" />}
            label={t('hero.apr')}
            value={`${POOL_APR_PCT.toFixed(2)}%`}
          />
        </div>

        <div className="mt-6">
          <Button size="lg" variant="secondary" onClick={onStake}>
            {t('hero.startCta')}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface MetricProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}

function HeroMetric({ icon, label, value, highlight }: MetricProps) {
  return (
    <div className="rounded-xl bg-neutral-0/10 backdrop-blur-sm px-4 py-3 ring-1 ring-neutral-0/15">
      <div className="inline-flex items-center gap-1.5 text-caption text-neutral-0/85">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`mt-1.5 ${highlight ? 'text-h3 font-semibold' : 'text-h3 font-medium'} text-neutral-0 tabular-nums`}>
        {value}
      </div>
    </div>
  );
}
