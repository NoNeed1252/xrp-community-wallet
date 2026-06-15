import { z } from 'zod';

const Drops = z.string().regex(/^[0-9]+$/, { message: 'drops must be a non-negative integer string' });
const XrplAddress = z.string().regex(/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/);
const ISODate = z.string().datetime({ offset: true }).or(z.string().datetime());
const ISODay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const LocaleSchema = z.enum([
  'en',
  'es',
  'zh',
  'de',
  'ar',
  'fr',
  'it',
  'pt',
  'pt_BR',
  'ja',
  'ko',
]);
export type Locale = z.infer<typeof LocaleSchema>;

export const ArticleStatusSchema = z.enum(['draft', 'published', 'archived']);
export type ArticleStatus = z.infer<typeof ArticleStatusSchema>;

export const PublicArticleListItemSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  locale: LocaleSchema,
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  coverUrl: z.string().nullable(),
  publishedAt: ISODate,
  readingTime: z.number().int().min(1),
});
export type PublicArticleListItem = z.infer<typeof PublicArticleListItemSchema>;

export const PublicArticleSchema = PublicArticleListItemSchema.extend({
  body: z.string(),
  author: z.string(),
});
export type PublicArticle = z.infer<typeof PublicArticleSchema>;

export const AdminArticleSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  locale: LocaleSchema,
  title: z.string(),
  description: z.string(),
  body: z.string(),
  tags: z.array(z.string()),
  coverUrl: z.string().nullable(),
  status: ArticleStatusSchema,
  authorAdminId: z.string().uuid(),
  publishedAt: ISODate.nullable(),
  createdAt: ISODate,
  updatedAt: ISODate,
});
export type AdminArticle = z.infer<typeof AdminArticleSchema>;

export const StakingPolicyPublicSchema = z.object({
  aprPct: z.string(),
  epochDurationDays: z.number().int().positive(),
  minDepositDrops: Drops,
  maxSingleWithdrawDrops: Drops,
  payoutSourceAddress: XrplAddress,
  updatedAt: ISODate,
});
export type StakingPolicyPublic = z.infer<typeof StakingPolicyPublicSchema>;

export const StakingStatsPublicSchema = z.object({
  totalStakedDrops: Drops,
  totalUsers: z.number().int().nonnegative(),
  lastEpochAt: ISODate.nullable(),
});
export type StakingStatsPublic = z.infer<typeof StakingStatsPublicSchema>;

export const StakingPositionSchema = z.object({
  id: z.string().uuid(),
  principalDrops: Drops,
  accruedDrops: Drops,
  availableDrops: Drops,
  createdAt: ISODate,
});
export type StakingPosition = z.infer<typeof StakingPositionSchema>;

export const WalletUserSchema = z.object({
  id: z.string().uuid(),
  xrplAddress: XrplAddress,
  evmAddress: z.string().nullable(),
  label: z.string().nullable(),
  createdAt: ISODate,
});
export type WalletUser = z.infer<typeof WalletUserSchema>;

export const MeResponseSchema = z.object({
  data: z.object({
    user: WalletUserSchema,
    position: StakingPositionSchema.nullable(),
  }),
});

export const DepositIntentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  expectedDrops: Drops,
  depositAddress: XrplAddress,
  destinationTag: z.number().int().nonnegative(),
  expiresAt: ISODate,
  status: z.enum(['pending', 'confirmed', 'expired', 'cancelled']),
  externalTxHash: z.string().nullable(),
  confirmedDrops: Drops.nullable(),
  confirmedAt: ISODate.nullable(),
  createdAt: ISODate,
});
export type DepositIntent = z.infer<typeof DepositIntentSchema>;

export const WithdrawalIntentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  amountDrops: Drops,
  destinationAddress: XrplAddress,
  status: z.enum(['queued', 'epoch_pending', 'ready', 'broadcasting', 'paid', 'failed']),
  epochId: z.string().uuid().nullable(),
  externalTxHash: z.string().nullable(),
  requestedAt: ISODate,
  readyAt: ISODate.nullable(),
  completedAt: ISODate.nullable(),
  failureReason: z.string().nullable(),
});
export type WithdrawalIntent = z.infer<typeof WithdrawalIntentSchema>;

export const AccrualEntrySchema = z.object({
  id: z.string().uuid(),
  drops: Drops,
  accruedForDate: ISODay,
  createdAt: ISODate,
});
export type AccrualEntry = z.infer<typeof AccrualEntrySchema>;

export const WalletNonceResponseSchema = z.object({
  data: z.object({
    nonce: z.string(),
    expiresAt: ISODate,
    message: z.string(),
  }),
});

export const AuthTokensResponseSchema = z.object({
  data: z.object({
    accessToken: z.string(),
    accessExpiresAt: ISODate,
    userId: z.string().uuid().optional(),
    adminId: z.string().uuid().optional(),
  }),
});

export const RefreshResponseSchema = z.object({
  data: z.object({
    accessToken: z.string(),
    accessExpiresAt: ISODate,
  }),
});

export const ProblemSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number(),
  detail: z.string().optional(),
  instance: z.string().optional(),
});
export type Problem = z.infer<typeof ProblemSchema>;

export const PageMetaSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});

export const ArticleListResponseSchema = z.object({
  data: z.array(PublicArticleListItemSchema),
  meta: PageMetaSchema,
});

export const ArticleDetailResponseSchema = z.object({ data: PublicArticleSchema });

export const PublicStakingPolicyResponseSchema = z.object({ data: StakingPolicyPublicSchema });

export const PublicStakingStatsResponseSchema = z.object({ data: StakingStatsPublicSchema });

export const DepositIntentResponseSchema = z.object({ data: DepositIntentSchema });
export const DepositIntentsListResponseSchema = z.object({ data: z.array(DepositIntentSchema) });

export const WithdrawalIntentResponseSchema = z.object({ data: WithdrawalIntentSchema });
export const WithdrawalIntentsListResponseSchema = z.object({ data: z.array(WithdrawalIntentSchema) });

export const AccrualsListResponseSchema = z.object({ data: z.array(AccrualEntrySchema) });

// === Admin-specific schemas (A1) ===

export const AdminPositionSummarySchema = z.object({
  principalDrops: Drops,
  accruedDrops: Drops,
  availableDrops: Drops,
});

export const AdminUserListItemSchema = z.object({
  id: z.string().uuid(),
  xrplAddress: XrplAddress,
  evmAddress: z.string().nullable(),
  label: z.string().nullable(),
  createdAt: ISODate,
  position: AdminPositionSummarySchema.nullable(),
});
export type AdminUserListItem = z.infer<typeof AdminUserListItemSchema>;

export const AdminUserDetailSchema = z.object({
  id: z.string().uuid(),
  xrplAddress: XrplAddress,
  evmAddress: z.string().nullable(),
  label: z.string().nullable(),
  createdAt: ISODate,
  position: AdminPositionSummarySchema.nullable(),
  recentDeposits: z.array(
    z.object({
      id: z.string().uuid(),
      status: z.enum(['pending', 'confirmed', 'expired', 'cancelled']),
      expectedDrops: Drops,
      confirmedDrops: Drops.nullable(),
      createdAt: ISODate,
    }),
  ),
  recentWithdrawals: z.array(
    z.object({
      id: z.string().uuid(),
      status: z.enum(['queued', 'epoch_pending', 'ready', 'broadcasting', 'paid', 'failed']),
      amountDrops: Drops,
      requestedAt: ISODate,
    }),
  ),
});
export type AdminUserDetail = z.infer<typeof AdminUserDetailSchema>;

export const AdminUsersListResponseSchema = z.object({
  data: z.array(AdminUserListItemSchema),
  meta: PageMetaSchema,
});
export const AdminUserDetailResponseSchema = z.object({ data: AdminUserDetailSchema });

export const AdminStatsSchema = z.object({
  totalStakedDrops: Drops,
  totalUsers: z.number().int().nonnegative(),
  depositsToday: z.number().int().nonnegative(),
  withdrawalsPending: z.number().int().nonnegative(),
  accrualsLast30dDrops: Drops,
  accrualsLast30dCount: z.number().int().nonnegative(),
});
export type AdminStats = z.infer<typeof AdminStatsSchema>;
export const AdminStatsResponseSchema = z.object({ data: AdminStatsSchema });

export const AdminPolicySchema = z.object({
  id: z.number().int(),
  aprPct: z.string(),
  epochDurationDays: z.number().int().positive(),
  minDepositDrops: Drops,
  maxSingleWithdrawDrops: Drops,
  payoutSourceAddress: z.string(),
  demoStakersBoost: z.number().int().nonnegative(),
  demoStakedDrops: Drops,
  updatedAt: ISODate,
  updatedByAdminId: z.string().uuid().nullable(),
});
export type AdminPolicy = z.infer<typeof AdminPolicySchema>;
export const AdminPolicyResponseSchema = z.object({ data: AdminPolicySchema });

export const AdminArticlesListResponseSchema = z.object({
  data: z.array(AdminArticleSchema),
  meta: PageMetaSchema,
});
export const AdminArticleResponseSchema = z.object({ data: AdminArticleSchema });

export const AdminWithdrawalsListResponseSchema = z.object({
  data: z.array(WithdrawalIntentSchema),
});

export const AuditEntrySchema = z.object({
  id: z.string().uuid(),
  actorKind: z.enum(['admin', 'wallet', 'system']),
  actorId: z.string().nullable(),
  action: z.string(),
  targetKind: z.string(),
  targetId: z.string().nullable(),
  payload: z.unknown().nullable(),
  createdAt: ISODate,
});
export type AuditEntry = z.infer<typeof AuditEntrySchema>;
export const AuditListResponseSchema = z.object({ data: z.array(AuditEntrySchema) });

export const AdminDemoDepositResponseSchema = z.object({
  data: z.object({
    userId: z.string().uuid(),
    amountDrops: Drops,
  }),
});

export const OkResponseSchema = z.object({ data: z.object({ ok: z.boolean() }) });
