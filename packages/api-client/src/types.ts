import type { DashboardData } from '@rc/types';

export type MockScenario = 'happy' | 'loading' | 'empty' | 'error' | 'inactive';

export interface ApiClient {
  getDashboardData(scenario?: MockScenario): Promise<DashboardData>;
}

/**
 * Raw тип mocks.json — нарочно «широкий», чтобы не дублировать всю схему до того,
 * как явные доменные срезы зрелы. Парсинг конкретных секций — через @rc/types schemas.
 */
export type RawMockData = Record<string, unknown>;
