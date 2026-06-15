import { createHttpApiClient, createMemoryTokenStore, type HttpApiClient } from '@rc/api-client';

/**
 * Access-токен живёт только в памяти процесса — никакого localStorage.
 * Refresh-токен в httpOnly cookie восстанавливает сессию через `autoRefresh`
 * при первом 401, либо явным вызовом `walletSignIn()` после unlock.
 */

function defaultBaseUrl(): string {
  const fromEnv = import.meta.env?.VITE_BACKEND_URL;
  if (typeof fromEnv === 'string' && fromEnv.length > 0) return fromEnv.replace(/\/$/, '');
  return 'http://localhost:3001';
}

let cached: HttpApiClient | null = null;

export function getApiClient(): HttpApiClient {
  if (cached) return cached;
  const memory = createMemoryTokenStore();
  cached = createHttpApiClient({
    baseUrl: defaultBaseUrl(),
    tokenStore: memory,
    autoRefresh: true,
  });
  return cached;
}

export function clearAccessToken(): void {
  const client = getApiClient();
  client.tokens.set(null);
}
