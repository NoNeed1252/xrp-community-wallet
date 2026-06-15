import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Home, ArrowUpRight, ArrowDownLeft, History, PieChart, Coins, Settings, LockKeyhole, MoreHorizontal } from '@rc/ui';
import { useTranslation } from 'react-i18next';
import { Logo, useMediaQuery } from '@rc/ui';
import clsx from 'clsx';
import { lock as vaultLock } from '~/lib/wallet/vault';
import { useAutoLock } from '~/lib/wallet/useAutoLock';
import { useThemeSync } from '~/lib/theme/useThemeSync';
import { AccountSwitcher } from '~/features/settings/components/AccountSwitcher';
import { HeaderSocial, MobileSocialLinks } from './HeaderSocial';

interface NavItem {
  to: string;
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: '/', key: 'home', icon: Home, end: true },
  { to: '/send', key: 'send', icon: ArrowUpRight },
  { to: '/receive', key: 'receive', icon: ArrowDownLeft },
  { to: '/portfolio', key: 'portfolio', icon: PieChart },
  { to: '/history', key: 'history', icon: History },
  { to: '/staking', key: 'staking', icon: Coins },
  { to: '/settings', key: 'settings', icon: Settings },
];

export function AppShell() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  useAutoLock();
  useThemeSync();
  return (
    <div className="min-h-screen bg-page">
      <SkipLink />
      <TopBar />
      <div className="mx-auto max-w-[1440px] px-3 sm:px-4 lg:px-6 py-4 sm:py-6 flex gap-2 pb-[calc(env(safe-area-inset-bottom)+88px)] sm:pb-0">
        {!isMobile && <Sidebar />}
        <main
          id="main-content"
          className="flex-1 min-w-0 min-h-[calc(100vh-7rem)] overflow-x-hidden bg-surface rounded-2xl shadow-e2 border border-neutral-200 px-4 sm:px-6 lg:px-8 pt-6 pb-8"
        >
          <Outlet />
        </main>
      </div>
      {isMobile && <BottomTabBar />}
    </div>
  );
}

function SkipLink() {
  const { t } = useTranslation('common');
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-brand-600 focus:text-neutral-0 focus:px-3 focus:py-2 focus:rounded-md"
    >
      {t('a11y.skipToContent')}
    </a>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-sticky bg-surface border-b border-neutral-200">
      <div className="mx-auto max-w-[1440px] h-16 flex items-center px-4 sm:px-6 lg:px-8 gap-3">
        <Logo suffix="wallet" />
        <span className="hidden sm:inline text-neutral-300" aria-hidden="true">
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </span>
        <AccountSwitcher />
        <div className="ml-auto">
          <HeaderSocial />
        </div>
      </div>
    </header>
  );
}

function Sidebar() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const onLock = () => {
    vaultLock();
    navigate('/unlock', { replace: true });
  };
  return (
    <aside
      className="rc-no-scrollbar w-[200px] shrink-0 py-2 sticky top-20 self-start max-h-[calc(100vh-5rem)] overflow-y-auto flex flex-col"
    >
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => (
          <SidebarItem
            key={item.to}
            to={item.to}
            label={t(`nav.${item.key}`)}
            Icon={item.icon}
            end={item.end}
          />
        ))}
      </nav>
      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={onLock}
          className="w-full h-10 px-3 rounded-md flex items-center gap-3 text-body-strong text-neutral-600 hover:bg-warning-100 hover:text-warning-700 transition-colors"
        >
          <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          <span>{t('nav.lockNow')}</span>
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({
  to,
  label,
  Icon,
  end,
}: {
  to: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        clsx(
          'group relative h-10 px-3 rounded-md flex items-center gap-3 text-body-strong transition-colors duration-120 ease-standard',
          isActive
            ? 'text-brand-600 bg-brand-50'
            : 'text-neutral-700 hover:bg-neutral-100',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              aria-hidden
              className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-brand-600"
            />
          )}
          <Icon className="h-5 w-5" aria-hidden />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

const MOBILE_TABS: NavItem[] = [
  { to: '/', key: 'home', icon: Home, end: true },
  { to: '/send', key: 'send', icon: ArrowUpRight },
  { to: '/receive', key: 'receive', icon: ArrowDownLeft },
  { to: '/staking', key: 'staking', icon: Coins },
];

const MORE_ITEMS: NavItem[] = [
  { to: '/portfolio', key: 'portfolio', icon: PieChart },
  { to: '/history', key: 'history', icon: History },
  { to: '/settings', key: 'settings', icon: Settings },
];

function BottomTabBar() {
  const { t } = useTranslation('common');
  const loc = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const onClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [moreOpen]);

  const moreActive = MORE_ITEMS.some((it) => loc.pathname.startsWith(it.to));

  const go = (path: string) => {
    setMoreOpen(false);
    navigate(path);
  };

  const onLock = () => {
    setMoreOpen(false);
    vaultLock();
    navigate('/unlock', { replace: true });
  };

  return (
    <nav
      ref={moreRef}
      className="fixed bottom-0 left-0 right-0 z-sticky bg-surface border-t border-neutral-200 pb-[env(safe-area-inset-bottom)]"
    >
      {moreOpen && (
        <div
          role="menu"
          className="absolute left-3 right-3 bottom-full mb-2 rounded-xl border border-neutral-200 bg-surface shadow-lg py-1.5"
        >
          {MORE_ITEMS.map((it) => {
            const Icon = it.icon;
            const active = loc.pathname.startsWith(it.to);
            return (
              <button
                key={it.to}
                type="button"
                role="menuitem"
                onClick={() => go(it.to)}
                className={clsx(
                  'flex w-full items-center gap-3 px-4 py-3 text-left text-body',
                  active ? 'text-brand-600 bg-brand-50' : 'text-neutral-700 hover:bg-nested',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{t(`nav.${it.key}`)}</span>
              </button>
            );
          })}
          <MobileSocialLinks />
          <div className="my-1 mx-4 border-t border-neutral-200" aria-hidden="true" />
          <button
            type="button"
            role="menuitem"
            onClick={onLock}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-body text-warning-700 hover:bg-warning-100"
          >
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
            <span>{t('nav.lockNow')}</span>
          </button>
        </div>
      )}
      <ul className="flex">
        {MOBILE_TABS.map((tab) => {
          const isActive = tab.end ? loc.pathname === tab.to : loc.pathname.startsWith(tab.to);
          const Icon = tab.icon;
          return (
            <li key={tab.to} className="flex-1">
              <NavLink
                to={tab.to}
                end={tab.end}
                className={clsx(
                  'flex flex-col items-center justify-center gap-1 py-3 text-caption transition-colors duration-120',
                  isActive ? 'text-brand-600' : 'text-neutral-500',
                )}
                aria-label={t(`nav.${tab.key}`)}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{t(`nav.${tab.key}`)}</span>
              </NavLink>
            </li>
          );
        })}
        <li className="flex-1">
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            className={clsx(
              'w-full flex flex-col items-center justify-center gap-1 py-3 text-caption transition-colors duration-120',
              moreOpen || moreActive ? 'text-brand-600' : 'text-neutral-500',
            )}
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
            <span>{t('nav.more')}</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
