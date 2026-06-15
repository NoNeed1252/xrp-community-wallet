import {
  AccountSchema,
  DashboardSchema,
  OpenIntentSchema,
  SessionSchema,
  SubAccountSchema,
  TransactionSchema,
  UserSchema,
  type Account,
  type Dashboard,
  type DashboardData,
  type OpenIntent,
  type Session,
  type SubAccount,
  type Transaction,
  type User,
} from '@rc/types';
import type { ApiClient, MockScenario, RawMockData } from './types.js';

/**
 * MockAdapter — единственная реализация ApiClient в W1. Читает из переданного объекта (mocks.json),
 * парсит секции через Zod-схемы из @rc/types и применяет scenario-overrides.
 */
export function createMockAdapter(raw: RawMockData): ApiClient {
  function getBase(): DashboardData {
    const session = SessionSchema.parse((raw as Record<string, unknown>).session);
    const usersRaw = (raw as Record<string, unknown>).users as unknown[];
    const user = UserSchema.parse(
      usersRaw.find((u) => (u as { id: string }).id === session.currentUserId),
    );
    const accounts = (raw as Record<string, unknown>).accounts as unknown[];
    const subAccounts = (raw as Record<string, unknown>).subAccounts as unknown[];
    const transactions = (raw as Record<string, unknown>).transactions as unknown[];
    const openIntents = (raw as Record<string, unknown>).openIntents as unknown[];
    const dashboardRaw = (raw as Record<string, unknown>).dashboard;

    const parsedAccounts: Account[] = accounts.map((a) => AccountSchema.parse(a));
    const parsedSubAccounts: SubAccount[] = subAccounts.map((s) => SubAccountSchema.parse(s));
    const parsedTransactions: Transaction[] = transactions.map((t) => TransactionSchema.parse(t));
    const parsedIntents: OpenIntent[] = openIntents.map((o) => OpenIntentSchema.parse(o));
    const dashboard: Dashboard = DashboardSchema.parse(dashboardRaw);

    return {
      session,
      user,
      dashboard,
      accounts: parsedAccounts,
      subAccounts: parsedSubAccounts,
      transactions: parsedTransactions,
      openIntents: parsedIntents,
    };
  }

  function applyScenario(base: DashboardData, scenario: MockScenario): DashboardData {
    if (scenario === 'happy') return base;

    if (scenario === 'loading') {
      // Loading-сценарий обрабатывается на уровне UI (Skeleton); адаптер просто никогда не резолвится,
      // но для предсказуемости отдаём базу — UI решает, как рендерить.
      return base;
    }

    if (scenario === 'empty') {
      return {
        ...base,
        accounts: [],
        subAccounts: [],
        transactions: [],
        openIntents: [],
        dashboard: {
          ...base.dashboard,
          balancesWidget: {
            estimatedTotalUsd: '0.00',
            estimatedTotalUsdCompact: '0',
            donut: [{ label: 'Empty', percent: 100, color: 'neutral.300' }],
          },
          accountsWidget: { items: [] },
          openIntentsWidget: { items: [], viewAllLink: '/intents' },
          lastTransactionsWidget: { items: [], viewAllLink: '/history' },
          banners: [],
        },
      };
    }

    if (scenario === 'inactive') {
      const inactiveAcc =
        base.accounts.find((a) => !a.activated) ?? {
          ...base.accounts[0]!,
          activated: false,
        };
      return {
        ...base,
        accounts: [inactiveAcc],
        subAccounts: [],
        transactions: [],
        openIntents: [],
        dashboard: {
          ...base.dashboard,
          balancesWidget: {
            estimatedTotalUsd: '0.00',
            estimatedTotalUsdCompact: '0',
            donut: [{ label: 'Inactive', percent: 100, color: 'neutral.300' }],
          },
          accountsWidget: { items: [] },
          openIntentsWidget: { items: [], viewAllLink: '/intents' },
          lastTransactionsWidget: { items: [], viewAllLink: '/history' },
          banners: [
            {
              id: 'banner_inactive_only',
              severity: 'warning',
              title: `Account "${inactiveAcc.label}" is not activated`,
              body: 'Receive at least 1 XRP to activate it on the XRP Ledger.',
              dismissible: false,
            },
          ],
        },
      };
    }

    // error — здесь возвращаем «как есть»; UI ловит и показывает Banner+retry,
    // решение об ошибке делается на уровне query (см. useDashboardData в apps/wallet).
    return base;
  }

  return {
    async getDashboardData(scenario: MockScenario = 'happy'): Promise<DashboardData> {
      // Эмулируем сеть, но коротко — чтобы Skeleton успел появиться при scenario=loading.
      const delay = scenario === 'loading' ? 9_000_000 : 0;
      if (delay > 0) {
        // Никогда не резолвимся — фактический loading в UI до отмены/перехода. Это контролируемое поведение.
        await new Promise<void>(() => {});
      }
      if (scenario === 'error') {
        throw new Error('Mocked: failed to load dashboard data');
      }
      const base = getBase();
      return applyScenario(base, scenario);
    },
  };
}
