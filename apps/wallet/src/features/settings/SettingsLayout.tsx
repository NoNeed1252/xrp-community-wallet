import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@rc/ui';
import clsx from 'clsx';

const NAV = [
  { to: '/settings/general', key: 'general' },
  { to: '/settings/security', key: 'security' },
  { to: '/settings/accounts', key: 'accounts' },
  { to: '/settings/sub-accounts', key: 'subAccounts' },
  { to: '/settings/tokens', key: 'tokens' },
];

export function SettingsLayout() {
  const { t } = useTranslation('settings');
  const isCompact = useMediaQuery('(max-width: 767px)');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-h1 text-neutral-900">{t('title')}</h1>
        <p className="text-body text-neutral-500">{t('subtitle')}</p>
      </div>

      {isCompact ? (
        <nav className="rc-no-scrollbar overflow-x-auto -mx-4 px-4">
          <ul className="flex gap-2 min-w-max">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      'inline-flex items-center h-8 px-3 rounded-full text-caption font-medium border transition-colors',
                      isActive
                        ? 'bg-brand-600 text-neutral-0 border-brand-600'
                        : 'bg-surface text-neutral-700 border-neutral-300',
                    )
                  }
                >
                  {t(`nav.${item.key}`)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <div className={isCompact ? '' : 'grid grid-cols-[220px_1fr] gap-6'}>
        {!isCompact && (
          <aside>
            <nav className="flex flex-col gap-1 sticky top-20">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      'h-10 px-3 rounded-md flex items-center text-body-strong transition-colors',
                      isActive ? 'bg-brand-50 text-brand-600' : 'text-neutral-700 hover:bg-neutral-100',
                    )
                  }
                >
                  {t(`nav.${item.key}`)}
                </NavLink>
              ))}
            </nav>
          </aside>
        )}
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
