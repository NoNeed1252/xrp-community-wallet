import { Badge, type BadgeVariant } from '@rc/ui';
import { useTranslation } from 'react-i18next';
import type { TxStatus } from '../lib/types';

const variantByStatus: Record<TxStatus, BadgeVariant> = {
  pending: 'warning',
  completed: 'success',
  failed: 'danger',
};

export function TxStatusBadge({ status }: { status: TxStatus }) {
  const { t } = useTranslation('common');
  return <Badge variant={variantByStatus[status]}>{t(`status.${status}`)}</Badge>;
}
