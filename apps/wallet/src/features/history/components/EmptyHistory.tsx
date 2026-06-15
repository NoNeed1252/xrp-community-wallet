import { Button, EmptyState } from '@rc/ui';
import { History } from '@rc/ui';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function EmptyHistory({ filtered }: { filtered: boolean }) {
  const { t } = useTranslation('history');
  const navigate = useNavigate();
  if (filtered) {
    return (
      <EmptyState
        icon={<History className="h-10 w-10" />}
        title={t('empty.filtered.title')}
        body={t('empty.filtered.body')}
      />
    );
  }
  return (
    <EmptyState
      icon={<History className="h-10 w-10" />}
      title={t('empty.title')}
      body={t('empty.body')}
      action={
        <div className="flex gap-2">
          <Button onClick={() => navigate('/send')}>{t('empty.send')}</Button>
          <Button variant="secondary" onClick={() => navigate('/receive')}>
            {t('empty.receive')}
          </Button>
        </div>
      }
    />
  );
}
