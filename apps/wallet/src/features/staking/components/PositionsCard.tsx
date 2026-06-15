import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLineDown, Badge, Button, Card, EmptyState, Plant } from '@rc/ui';
import { dropsToXrp, formatCrypto, formatDateTime } from '@rc/types';
import { computeRewardsDrops, useStakingState, type StakingPosition } from '../hooks/useStakingState';

interface Props {
  onStake: () => void;
}

export function PositionsCard({ onStake }: Props) {
  const { t } = useTranslation('staking');
  const positions = useStakingState((s) => s.positions);
  const closePos = useStakingState((s) => s.close);

  if (positions.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Plant className="h-10 w-10" />}
          title={t('positions.empty.title')}
          body={t('positions.empty.body')}
          action={<Button onClick={onStake}>{t('hero.startCta')}</Button>}
        />
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-h3 text-neutral-900">{t('positions.title')}</h3>
        <span className="text-caption text-neutral-500">{positions.length}</span>
      </div>
      <ul className="flex flex-col divide-y divide-neutral-200">
        {positions.map((p) => (
          <PositionRow key={p.id} position={p} onClose={() => closePos(p.id)} />
        ))}
      </ul>
    </Card>
  );
}

function statusVariant(s: StakingPosition['status']) {
  if (s === 'active') return 'success' as const;
  if (s === 'pending') return 'warning' as const;
  if (s === 'withdrawing') return 'info' as const;
  return 'neutral' as const;
}

function PositionRow({ position, onClose }: { position: StakingPosition; onClose: () => void }) {
  const { t } = useTranslation('staking');
  const [, tick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 1_000);
    return () => window.clearInterval(id);
  }, []);

  const depositXrp = formatCrypto(dropsToXrp(position.depositDrops), 'XRP').value;
  const rewardsXrp = formatCrypto(dropsToXrp(computeRewardsDrops(position)), 'XRP').value;

  return (
    <li className="py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-body-strong text-neutral-900 tabular-nums">{depositXrp} XRP</span>
          <Badge variant={statusVariant(position.status)}>{t(`positions.status.${position.status}`)}</Badge>
        </div>
        <div className="text-caption text-neutral-500 mt-1">
          {t('positions.openedAt', { date: formatDateTime(position.openedAt) })}
        </div>
      </div>
      <div className="text-right">
        <div className="text-caption text-neutral-500">{t('positions.accrued')}</div>
        <div className="text-body-strong text-success-700 tabular-nums">+{rewardsXrp} XRP</div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<ArrowLineDown className="h-4 w-4" />}
        disabled={position.status === 'pending'}
        onClick={onClose}
      >
        {t('positions.unstakeCta')}
      </Button>
    </li>
  );
}
