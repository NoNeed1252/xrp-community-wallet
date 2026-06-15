import {
  ArticleListResponseSchema,
  ArticleDetailResponseSchema,
  AuthTokensResponseSchema,
  AccrualsListResponseSchema,
  DepositIntentResponseSchema,
  DepositIntentsListResponseSchema,
  MeResponseSchema,
  ProblemSchema,
  PublicStakingPolicyResponseSchema,
  PublicStakingStatsResponseSchema,
  RefreshResponseSchema,
  WalletNonceResponseSchema,
  WithdrawalIntentResponseSchema,
  WithdrawalIntentsListResponseSchema,
  AdminUsersListResponseSchema,
  AdminUserDetailResponseSchema,
  AdminStatsResponseSchema,
  AdminPolicyResponseSchema,
  AdminArticlesListResponseSchema,
  AdminArticleResponseSchema,
  AdminWithdrawalsListResponseSchema,
  AdminDemoDepositResponseSchema,
  AuditListResponseSchema,
  OkResponseSchema,
  type Locale,
  type ArticleStatus,
} from '@rc/types';
import type { ZodSchema, infer as ZInfer } from 'zod';

export interface TokenStore {
  get(): string | null;
  set(value: string | null): void;
}

export function createMemoryTokenStore(): TokenStore {
  let token: string | null = null;
  return {
    get: () => token,
    set: (v) => {
      token = v;
    },
  };
}

export interface ApiClientOptions {
  baseUrl: string;
  fetcher?: typeof fetch;
  tokenStore?: TokenStore;
  /**
   * When true, on 401 the client will try `POST /v1/auth/refresh` once and retry the request
   * with the new access token. Refresh cookie must be set by the auth flow.
   */
  autoRefresh?: boolean;
  refreshPath?: string;
}

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly problem: Record<string, unknown>) {
    super(typeof problem.title === 'string' ? problem.title : `HTTP ${status}`);
  }
}

export function createHttpApiClient(opts: ApiClientOptions) {
  const fetcher = opts.fetcher ?? fetch;
  const tokens = opts.tokenStore ?? createMemoryTokenStore();
  const baseUrl = opts.baseUrl.replace(/\/$/, '');
  const autoRefresh = opts.autoRefresh ?? true;
  const refreshPath = opts.refreshPath ?? '/v1/auth/refresh';

  let refreshInFlight: Promise<boolean> | null = null;

  async function refreshAccess(): Promise<boolean> {
    if (refreshInFlight) return refreshInFlight;
    refreshInFlight = (async () => {
      try {
        const res = await fetcher(`${baseUrl}${refreshPath}`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) return false;
        const json = (await res.json()) as unknown;
        const parsed = RefreshResponseSchema.safeParse(json);
        if (!parsed.success) return false;
        tokens.set(parsed.data.data.accessToken);
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
    return refreshInFlight;
  }

  async function request<T extends ZodSchema>(
    path: string,
    schema: T,
    init: RequestInit = {},
    requireAuth = false,
  ): Promise<ZInfer<T>> {
    const url = `${baseUrl}${path}`;
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    if (requireAuth) {
      const t = tokens.get();
      if (t) headers.set('Authorization', `Bearer ${t}`);
    }
    let res = await fetcher(url, { ...init, headers, credentials: 'include' });
    if (res.status === 401 && requireAuth && autoRefresh) {
      const refreshed = await refreshAccess();
      if (refreshed) {
        const t = tokens.get();
        if (t) headers.set('Authorization', `Bearer ${t}`);
        res = await fetcher(url, { ...init, headers, credentials: 'include' });
      }
    }
    if (!res.ok) {
      let problem: Record<string, unknown> = { type: 'about:blank', title: res.statusText, status: res.status };
      try {
        const j = (await res.json()) as unknown;
        const p = ProblemSchema.safeParse(j);
        if (p.success) problem = p.data as unknown as Record<string, unknown>;
        else if (j && typeof j === 'object') problem = j as Record<string, unknown>;
      } catch {
        // ignore
      }
      throw new ApiError(res.status, problem);
    }
    const json = (await res.json()) as unknown;
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      throw new ApiError(0, {
        type: 'rc:api/schema-mismatch',
        title: 'schema_mismatch',
        status: 0,
        detail: parsed.error.message,
      });
    }
    return parsed.data;
  }

  return {
    tokens,
    request,

    // public
    async listArticles(params: { locale?: Locale; page?: number; pageSize?: number; tag?: string } = {}) {
      const query = new URLSearchParams();
      if (params.locale) query.set('locale', params.locale);
      if (params.page) query.set('page', String(params.page));
      if (params.pageSize) query.set('pageSize', String(params.pageSize));
      if (params.tag) query.set('tag', params.tag);
      const qs = query.toString();
      return request(`/v1/articles${qs ? `?${qs}` : ''}`, ArticleListResponseSchema);
    },
    async getArticle(slug: string, locale: Locale = 'en') {
      return request(
        `/v1/articles/${encodeURIComponent(slug)}?locale=${locale}`,
        ArticleDetailResponseSchema,
      );
    },
    async getStakingPolicy() {
      return request('/v1/staking/policy', PublicStakingPolicyResponseSchema);
    },
    async getStakingStats() {
      return request('/v1/staking/stats', PublicStakingStatsResponseSchema);
    },

    // wallet auth
    async createWalletNonce(address: string) {
      return request('/v1/auth/wallet/nonce', WalletNonceResponseSchema, {
        method: 'POST',
        body: JSON.stringify({ address }),
      });
    },
    async verifyWalletSignature(input: {
      address: string;
      nonce: string;
      signature: string;
      publicKey: string;
    }) {
      const tokens = await request('/v1/auth/wallet/verify', AuthTokensResponseSchema, {
        method: 'POST',
        body: JSON.stringify(input),
      });
      this.tokens.set(tokens.data.accessToken);
      return tokens;
    },
    async refresh() {
      const tokens = await request('/v1/auth/refresh', RefreshResponseSchema, { method: 'POST' });
      this.tokens.set(tokens.data.accessToken);
      return tokens;
    },
    async logout() {
      await fetcher(`${baseUrl}/v1/auth/logout`, { method: 'POST', credentials: 'include' });
      this.tokens.set(null);
    },

    // wallet (authenticated)
    async getMe() {
      return request('/v1/me', MeResponseSchema, { method: 'GET' }, true);
    },
    async createDepositIntent(amountDrops: string) {
      return request(
        '/v1/staking/deposits/intent',
        DepositIntentResponseSchema,
        { method: 'POST', body: JSON.stringify({ amountDrops }) },
        true,
      );
    },
    async listDeposits() {
      return request('/v1/staking/deposits', DepositIntentsListResponseSchema, undefined, true);
    },
    async createWithdrawalIntent(input: { amountDrops: string; destinationAddress: string }) {
      return request(
        '/v1/staking/withdrawals/intent',
        WithdrawalIntentResponseSchema,
        { method: 'POST', body: JSON.stringify(input) },
        true,
      );
    },
    async listWithdrawals() {
      return request('/v1/staking/withdrawals', WithdrawalIntentsListResponseSchema, undefined, true);
    },
    async listAccruals(params: { from?: string; to?: string } = {}) {
      const q = new URLSearchParams();
      if (params.from) q.set('from', params.from);
      if (params.to) q.set('to', params.to);
      const qs = q.toString();
      return request(
        `/v1/staking/accruals${qs ? `?${qs}` : ''}`,
        AccrualsListResponseSchema,
        undefined,
        true,
      );
    },

    // === Admin ===

    async adminLogin(email: string, password: string) {
      const res = await request('/v1/admin/auth/login', AuthTokensResponseSchema, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      this.tokens.set(res.data.accessToken);
      return res;
    },
    async adminRefresh() {
      const res = await request('/v1/admin/auth/refresh', RefreshResponseSchema, {
        method: 'POST',
      });
      this.tokens.set(res.data.accessToken);
      return res;
    },
    async adminLogout() {
      await fetcher(`${baseUrl}/v1/admin/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      this.tokens.set(null);
    },

    async adminListArticles(params: { page?: number; pageSize?: number } = {}) {
      const q = new URLSearchParams();
      if (params.page) q.set('page', String(params.page));
      if (params.pageSize) q.set('pageSize', String(params.pageSize));
      const qs = q.toString();
      return request(
        `/v1/admin/articles${qs ? `?${qs}` : ''}`,
        AdminArticlesListResponseSchema,
        undefined,
        true,
      );
    },
    async adminGetArticle(id: string) {
      return request(
        `/v1/admin/articles/${encodeURIComponent(id)}`,
        AdminArticleResponseSchema,
        undefined,
        true,
      );
    },
    async adminCreateArticle(input: {
      slug: string;
      locale: Locale;
      title: string;
      description: string;
      body: string;
      tags?: string[];
      coverUrl?: string;
      status?: ArticleStatus;
    }) {
      return request(
        '/v1/admin/articles',
        AdminArticleResponseSchema,
        { method: 'POST', body: JSON.stringify(input) },
        true,
      );
    },
    async adminPatchArticle(
      id: string,
      patch: Partial<{
        slug: string;
        locale: Locale;
        title: string;
        description: string;
        body: string;
        tags: string[];
        coverUrl: string;
      }>,
    ) {
      return request(
        `/v1/admin/articles/${encodeURIComponent(id)}`,
        AdminArticleResponseSchema,
        { method: 'PATCH', body: JSON.stringify(patch) },
        true,
      );
    },
    async adminDeleteArticle(id: string) {
      return request(
        `/v1/admin/articles/${encodeURIComponent(id)}`,
        OkResponseSchema,
        { method: 'DELETE' },
        true,
      );
    },
    async adminPublishArticle(id: string) {
      return request(
        `/v1/admin/articles/${encodeURIComponent(id)}/publish`,
        AdminArticleResponseSchema,
        { method: 'POST' },
        true,
      );
    },
    async adminUnpublishArticle(id: string) {
      return request(
        `/v1/admin/articles/${encodeURIComponent(id)}/unpublish`,
        AdminArticleResponseSchema,
        { method: 'POST' },
        true,
      );
    },

    async adminListUsers(params: { q?: string; page?: number; pageSize?: number } = {}) {
      const query = new URLSearchParams();
      if (params.q) query.set('q', params.q);
      if (params.page) query.set('page', String(params.page));
      if (params.pageSize) query.set('pageSize', String(params.pageSize));
      const qs = query.toString();
      return request(
        `/v1/admin/users${qs ? `?${qs}` : ''}`,
        AdminUsersListResponseSchema,
        undefined,
        true,
      );
    },
    async adminGetUser(id: string) {
      return request(
        `/v1/admin/users/${encodeURIComponent(id)}`,
        AdminUserDetailResponseSchema,
        undefined,
        true,
      );
    },
    async adminDemoDeposit(userId: string, drops: string) {
      return request(
        `/v1/admin/users/${encodeURIComponent(userId)}/demo-deposit`,
        AdminDemoDepositResponseSchema,
        { method: 'POST', body: JSON.stringify({ drops }) },
        true,
      );
    },

    async adminGetPolicy() {
      return request('/v1/admin/staking/policy', AdminPolicyResponseSchema, undefined, true);
    },
    async adminPatchPolicy(patch: Partial<{
      aprPct: string;
      epochDurationDays: number;
      minDepositDrops: string;
      maxSingleWithdrawDrops: string;
      payoutSourceAddress: string;
      demoStakersBoost: number;
      demoStakedDrops: string;
    }>) {
      return request(
        '/v1/admin/staking/policy',
        AdminPolicyResponseSchema,
        { method: 'PATCH', body: JSON.stringify(patch) },
        true,
      );
    },
    async adminGetStats() {
      return request('/v1/admin/staking/stats', AdminStatsResponseSchema, undefined, true);
    },

    async adminListWithdrawals(params: { status?: string } = {}) {
      const q = new URLSearchParams();
      if (params.status) q.set('status', params.status);
      const qs = q.toString();
      return request(
        `/v1/admin/withdrawals${qs ? `?${qs}` : ''}`,
        AdminWithdrawalsListResponseSchema,
        undefined,
        true,
      );
    },
    async adminForceCompleteWithdrawal(id: string, txHash: string) {
      return request(
        `/v1/admin/withdrawals/${encodeURIComponent(id)}/force-complete`,
        OkResponseSchema,
        { method: 'POST', body: JSON.stringify({ txHash }) },
        true,
      );
    },
    async adminCancelWithdrawal(id: string) {
      return request(
        `/v1/admin/withdrawals/${encodeURIComponent(id)}/cancel`,
        OkResponseSchema,
        { method: 'POST' },
        true,
      );
    },

    async adminListAudit(params: { actor?: string; action?: string; from?: string; to?: string } = {}) {
      const q = new URLSearchParams();
      if (params.actor) q.set('actor', params.actor);
      if (params.action) q.set('action', params.action);
      if (params.from) q.set('from', params.from);
      if (params.to) q.set('to', params.to);
      const qs = q.toString();
      return request(
        `/v1/admin/audit${qs ? `?${qs}` : ''}`,
        AuditListResponseSchema,
        undefined,
        true,
      );
    },
  };
}

export type HttpApiClient = ReturnType<typeof createHttpApiClient>;
