import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Spinner, Toaster } from '@rc/ui';
import { AppShell } from '~/layouts/AppShell';
import { DashboardPage } from '~/features/dashboard/DashboardPage';
import { ComingSoonPage } from '~/features/_placeholders/ComingSoonPage';
import { getStatus, subscribe } from '~/lib/wallet/vault';
import type { VaultStatus } from '~/lib/wallet/types';
import { OnboardingProvider } from '~/features/onboarding/state';

const WelcomePage = lazy(() =>
  import('~/features/onboarding/WelcomePage').then((m) => ({ default: m.WelcomePage })),
);
const CreatePage = lazy(() =>
  import('~/features/onboarding/CreatePage').then((m) => ({ default: m.CreatePage })),
);
const ConfirmPage = lazy(() =>
  import('~/features/onboarding/ConfirmPage').then((m) => ({ default: m.ConfirmPage })),
);
const ImportSeedPage = lazy(() =>
  import('~/features/onboarding/ImportSeedPage').then((m) => ({ default: m.ImportSeedPage })),
);
const ImportKeyPage = lazy(() =>
  import('~/features/onboarding/ImportKeyPage').then((m) => ({ default: m.ImportKeyPage })),
);
const SetPasswordPage = lazy(() =>
  import('~/features/onboarding/SetPasswordPage').then((m) => ({ default: m.SetPasswordPage })),
);
const DonePage = lazy(() =>
  import('~/features/onboarding/DonePage').then((m) => ({ default: m.DonePage })),
);
const LedgerPage = lazy(() =>
  import('~/features/onboarding/LedgerPage').then((m) => ({ default: m.LedgerPage })),
);
const UnlockPage = lazy(() =>
  import('~/features/unlock/UnlockPage').then((m) => ({ default: m.UnlockPage })),
);
const ReceivePage = lazy(() =>
  import('~/features/receive/ReceivePage').then((m) => ({ default: m.ReceivePage })),
);
const SendPage = lazy(() =>
  import('~/features/send/SendPage').then((m) => ({ default: m.SendPage })),
);
const SendReviewPage = lazy(() =>
  import('~/features/send/ReviewPage').then((m) => ({ default: m.ReviewPage })),
);
const HistoryPage = lazy(() =>
  import('~/features/history/HistoryPage').then((m) => ({ default: m.HistoryPage })),
);
const PortfolioPage = lazy(() =>
  import('~/features/portfolio/PortfolioPage').then((m) => ({ default: m.PortfolioPage })),
);
const StakingPage = lazy(() =>
  import('~/features/staking/StakingPage').then((m) => ({ default: m.StakingPage })),
);
const SettingsLayout = lazy(() =>
  import('~/features/settings/SettingsLayout').then((m) => ({ default: m.SettingsLayout })),
);
const GeneralSettings = lazy(() =>
  import('~/features/settings/pages/GeneralSettings').then((m) => ({ default: m.GeneralSettings })),
);
const SecuritySettings = lazy(() =>
  import('~/features/settings/pages/SecuritySettings').then((m) => ({ default: m.SecuritySettings })),
);
const AccountsSettings = lazy(() =>
  import('~/features/settings/pages/AccountsSettings').then((m) => ({ default: m.AccountsSettings })),
);
const SubAccountsSettings = lazy(() =>
  import('~/features/settings/pages/SubAccountsSettings').then((m) => ({ default: m.SubAccountsSettings })),
);
const TokensSettings = lazy(() =>
  import('~/features/settings/pages/TokensSettings').then((m) => ({ default: m.TokensSettings })),
);

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size={32} />
    </div>
  );
}

/**
 * Fallback для lazy-роутов внутри AppShell: занимает доступную высоту
 * без скачка layout'а (не разворачивает min-h-screen).
 */
function RouteFallback() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-8 w-48 rounded-md bg-neutral-100" />
      <div className="h-4 w-72 rounded-md bg-neutral-100" />
      <div className="h-40 w-full rounded-xl bg-neutral-100 mt-4" />
      <div className="h-40 w-full rounded-xl bg-neutral-100" />
    </div>
  );
}

function VaultGate({ allow, children }: { allow: VaultStatus[]; children: React.ReactNode }) {
  const [status, setStatus] = useState<VaultStatus | null>(null);
  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      void getStatus().then((s) => {
        if (!cancelled) setStatus(s);
      });
    };
    refresh();
    const unsub = subscribe(refresh);
    return () => {
      cancelled = true;
      unsub();
    };
  }, [allow]);

  if (status === null) return <LoadingScreen />;

  if (!allow.includes(status)) {
    if (status === 'empty') return <Navigate to="/onboarding/welcome" replace />;
    if (status === 'locked') return <Navigate to="/unlock" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

export function App() {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, refetchOnWindowFocus: false },
        },
      }),
    [],
  );

  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          path: '/',
          element: (
            <VaultGate allow={['unlocked']}>
              <AppShell />
            </VaultGate>
          ),
          children: [
            { index: true, element: <DashboardPage /> },
            {
              path: 'send',
              element: (
                <Lazy>
                  <SendPage />
                </Lazy>
              ),
            },
            {
              path: 'send/review',
              element: (
                <Lazy>
                  <SendReviewPage />
                </Lazy>
              ),
            },
            {
              path: 'receive',
              element: (
                <Lazy>
                  <ReceivePage />
                </Lazy>
              ),
            },
            {
              path: 'history',
              element: (
                <Lazy>
                  <HistoryPage />
                </Lazy>
              ),
            },
            {
              path: 'portfolio',
              element: (
                <Lazy>
                  <PortfolioPage />
                </Lazy>
              ),
            },
            {
              path: 'staking',
              element: (
                <Lazy>
                  <StakingPage />
                </Lazy>
              ),
            },
            {
              path: 'settings',
              element: (
                <Lazy>
                  <SettingsLayout />
                </Lazy>
              ),
              children: [
                { index: true, element: <Navigate to="/settings/general" replace /> },
                {
                  path: 'general',
                  element: (
                    <Lazy>
                      <GeneralSettings />
                    </Lazy>
                  ),
                },
                {
                  path: 'security',
                  element: (
                    <Lazy>
                      <SecuritySettings />
                    </Lazy>
                  ),
                },
                {
                  path: 'accounts',
                  element: (
                    <Lazy>
                      <AccountsSettings />
                    </Lazy>
                  ),
                },
                {
                  path: 'sub-accounts',
                  element: (
                    <Lazy>
                      <SubAccountsSettings />
                    </Lazy>
                  ),
                },
                {
                  path: 'tokens',
                  element: (
                    <Lazy>
                      <TokensSettings />
                    </Lazy>
                  ),
                },
              ],
            },
            { path: '*', element: <ComingSoonPage section="404" /> },
          ],
        },
        {
          path: '/onboarding',
          element: (
            <VaultGate allow={['empty', 'unlocked']}>
              <OnboardingProvider>
                <Lazy>
                  <Outlet />
                </Lazy>
              </OnboardingProvider>
            </VaultGate>
          ),
          children: [
            { path: 'welcome', element: <WelcomePage /> },
            { path: 'create', element: <CreatePage /> },
            { path: 'confirm', element: <ConfirmPage /> },
            { path: 'import-seed', element: <ImportSeedPage /> },
            { path: 'import-key', element: <ImportKeyPage /> },
            { path: 'set-password', element: <SetPasswordPage /> },
            { path: 'done', element: <DonePage /> },
            { path: 'ledger', element: <LedgerPage /> },
          ],
        },
        {
          path: '/unlock',
          element: (
            <VaultGate allow={['locked']}>
              <Lazy>
                <UnlockPage />
              </Lazy>
            </VaultGate>
          ),
        },
      ], { basename: routerBasename() }),
    [],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  );
}

function routerBasename(): string {
  const base = import.meta.env.BASE_URL || '/';
  return base !== '/' && base.endsWith('/') ? base.slice(0, -1) : base;
}
