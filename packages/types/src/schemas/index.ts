import { z } from 'zod';

export * from './backend.js';

export const NetworkIdSchema = z.enum(['xrpl', 'btc', 'eth']);
export type NetworkId = z.infer<typeof NetworkIdSchema>;

export const AccountFlagsSchema = z.object({
  requireDestTag: z.boolean(),
  disallowXRP: z.boolean(),
  depositAuth: z.boolean(),
});

export const NativeBalanceSchema = z.object({
  currency: z.string(),
  drops: z.string(),
});

export const IssuedBalanceSchema = z.object({
  currency: z.string(),
  issuer: z.string(),
  issuerLabel: z.string().optional(),
  amount: z.string(),
});

export const AccountSchema = z.object({
  id: z.string(),
  userId: z.string(),
  label: z.string(),
  address: z.string(),
  network: NetworkIdSchema,
  type: z.enum(['seed_generated', 'imported_seed', 'imported_key', 'ledger_hardware']),
  icon: z
    .object({
      type: z.enum(['color']),
      value: z.string(),
    })
    .optional(),
  ledger: z
    .object({
      model: z.string(),
      derivationPath: z.string(),
    })
    .optional(),
  activated: z.boolean(),
  activationReserveDrops: z.string(),
  ownerReserveDrops: z.string(),
  flags: AccountFlagsSchema,
  balances: z.object({
    native: NativeBalanceSchema,
    issued: z.array(IssuedBalanceSchema),
  }),
  createdAt: z.string(),
  lastActivityAt: z.string().nullable(),
});
export type Account = z.infer<typeof AccountSchema>;

export const SubAccountSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  label: z.string(),
  destinationTag: z.number().int().nonnegative(),
  note: z.string().nullable(),
  createdAt: z.string(),
});
export type SubAccount = z.infer<typeof SubAccountSchema>;

export const TxStatusSchema = z.enum(['pending', 'completed', 'failed']);
export type TxStatus = z.infer<typeof TxStatusSchema>;

export const TxTypeSchema = z.enum([
  'payment',
  'staking_deposit',
  'staking_payout',
  'staking_withdraw',
]);

export const TransactionSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  subAccountId: z.string().nullable(),
  network: NetworkIdSchema,
  type: TxTypeSchema,
  direction: z.enum(['incoming', 'outgoing']),
  counterparty: z.object({
    address: z.string(),
    label: z.string().nullable(),
    destinationTag: z.number().int().nullable(),
  }),
  amount: z.union([
    z.object({
      currency: z.literal('XRP'),
      drops: z.string(),
      issuer: z.null(),
    }),
    z.object({
      currency: z.string(),
      value: z.string(),
      issuer: z.string().nullable(),
    }),
  ]),
  fee: z.object({ drops: z.string() }),
  memo: z.string().nullable(),
  status: TxStatusSchema,
  failure: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .optional(),
  ledgerIndex: z.number().nullable(),
  txHash: z.string(),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

export const OpenIntentSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  intent: z.string(),
  initiatedBy: z.object({ id: z.string(), name: z.string() }),
  status: z.enum(['open', 'closed']),
});
export type OpenIntent = z.infer<typeof OpenIntentSchema>;

export const UserSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  email: z.string().email(),
  locale: z.string(),
  theme: z.enum(['light', 'dark']),
  createdAt: z.string(),
  preferences: z.object({
    fiatCurrency: z.string(),
    compactNumbers: z.boolean(),
    notifications: z.object({ email: z.boolean(), telegram: z.boolean() }),
  }),
  security: z.object({
    passwordSet: z.boolean(),
    twoFactorEnabled: z.boolean(),
    deviceRememberDays: z.number().int(),
  }),
});
export type User = z.infer<typeof UserSchema>;

export const SessionSchema = z.object({
  authenticated: z.boolean(),
  currentUserId: z.string(),
  activeAccountId: z.string(),
  activeSubAccountId: z.string().nullable(),
  walletUnlocked: z.boolean(),
  autoLockMinutes: z.number().int(),
  lastLoginAt: z.string(),
  telegramModeEnabled: z.boolean(),
});
export type Session = z.infer<typeof SessionSchema>;

export const BannerSchema = z.object({
  id: z.string(),
  severity: z.enum(['info', 'success', 'warning', 'danger']),
  title: z.string(),
  body: z.string(),
  primaryAction: z
    .object({
      label: z.string(),
      link: z.string(),
    })
    .optional(),
  dismissible: z.boolean(),
});
export type Banner = z.infer<typeof BannerSchema>;

export const DonutSegmentSchema = z.object({
  label: z.string(),
  percent: z.number(),
  color: z.string(),
});

export const DashboardSchema = z.object({
  greetingName: z.string(),
  primaryCta: z.object({ label: z.string(), action: z.string() }),
  balancesWidget: z.object({
    estimatedTotalUsd: z.string(),
    estimatedTotalUsdCompact: z.string(),
    donut: z.array(DonutSegmentSchema),
  }),
  accountsWidget: z.object({
    items: z.array(
      z.object({
        subAccountId: z.string(),
        label: z.string(),
        assetsPreview: z.array(z.string()),
        overflowCount: z.number().int().nonnegative(),
      }),
    ),
  }),
  openIntentsWidget: z.object({
    items: z.array(z.string()),
    viewAllLink: z.string(),
  }),
  lastTransactionsWidget: z.object({
    items: z.array(z.string()),
    viewAllLink: z.string(),
  }),
  banners: z.array(BannerSchema),
});
export type Dashboard = z.infer<typeof DashboardSchema>;

export const DashboardDataSchema = z.object({
  session: SessionSchema,
  user: UserSchema,
  dashboard: DashboardSchema,
  accounts: z.array(AccountSchema),
  subAccounts: z.array(SubAccountSchema),
  transactions: z.array(TransactionSchema),
  openIntents: z.array(OpenIntentSchema),
});
export type DashboardData = z.infer<typeof DashboardDataSchema>;
