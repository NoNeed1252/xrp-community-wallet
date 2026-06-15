import { Construction } from '@rc/ui';
import { EmptyState } from '@rc/ui';
import { useTranslation } from 'react-i18next';

export function ComingSoonPage({ section }: { section: string }) {
  const { t } = useTranslation('dashboard');
  return (
    <div className="py-12">
      <EmptyState
        icon={<Construction className="h-12 w-12" />}
        title={t('placeholder.comingSoon.title')}
        body={`${t('placeholder.comingSoon.body')} (${section})`}
      />
    </div>
  );
}
