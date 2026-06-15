import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Tabs } from '@rc/ui';
import { MyAssetsTab } from './tabs/MyAssetsTab';
import { MarketTab } from './tabs/MarketTab';

type TabValue = 'my-assets' | 'market';

function readTab(sp: URLSearchParams): TabValue {
  const t = sp.get('tab');
  return t === 'market' ? 'market' : 'my-assets';
}

export function PortfolioPage() {
  const { t } = useTranslation('portfolio');
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = readTab(searchParams);

  const onChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'my-assets') next.delete('tab');
    else next.set('tab', value);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-h1 text-neutral-900">{t('title')}</h1>
        <p className="text-body text-neutral-500">{t('subtitle')}</p>
      </div>

      <Tabs
        value={tab}
        onValueChange={onChange}
        items={[
          { value: 'my-assets', label: t('tabs.my-assets') },
          { value: 'market', label: t('tabs.market') },
        ]}
      />

      {tab === 'my-assets' ? <MyAssetsTab /> : <MarketTab />}
    </div>
  );
}
