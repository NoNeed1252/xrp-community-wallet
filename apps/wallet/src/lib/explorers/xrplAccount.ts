// Multiple endpoints — primary + fallback. Single-RPC = SPOF в случае
// компрометации хоста (security audit I3). Балансы read-only; для submit
// продолжаем использовать xrplcluster.com (см. broadcast.ts).
const XRPL_RPC_ENDPOINTS = [
  'https://xrplcluster.com/',
  'https://s1.ripple.com:51234/',
  'https://s2.ripple.com:51234/',
] as const;

async function xrplRpcCall(body: object): Promise<Response> {
  let lastErr: unknown = null;
  for (const url of XRPL_RPC_ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) return res;
      lastErr = new Error(`xrpl: HTTP ${res.status} (${url})`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('xrpl: all RPC endpoints failed');
}

// Канонические флаги учётной записи XRPL (https://xrpl.org/accountroot.html).
const LSF_REQUIRE_DEST_TAG = 0x00020000;
const LSF_DISALLOW_XRP = 0x00080000;
const LSF_DEPOSIT_AUTH = 0x01000000;

interface AccountInfoResponse {
  result?: {
    status?: 'success' | 'error';
    error?: string;
    account_data?: {
      Balance?: string;
      OwnerCount?: number;
      Sequence?: number;
      Flags?: number;
    };
    validated?: boolean;
  };
}

export interface XrplAccountFlags {
  /** Адрес имеет lsfRequireDestTag — отправка без tag отклоняется. */
  requireDestTag: boolean;
  /** Адрес запретил приём XRP (lsfDisallowXRP). */
  disallowXRP: boolean;
  /** Адрес требует Authorization для трастлайнов. */
  depositAuth: boolean;
  /** Существует ли аккаунт on-chain. */
  activated: boolean;
}

/**
 * Запрашивает on-chain флаги учётной записи XRPL. Используется для real-time
 * проверок (RequireDestTag для бирж), которые раньше дёргались из mocks.json
 * (см. security audit H1).
 */
export async function fetchXrplAccountFlags(address: string): Promise<XrplAccountFlags> {
  const res = await xrplRpcCall({
    method: 'account_info',
    params: [{ account: address, strict: true, ledger_index: 'validated' }],
  });
  const data = (await res.json()) as AccountInfoResponse;
  if (data.result?.error === 'actNotFound') {
    return { requireDestTag: false, disallowXRP: false, depositAuth: false, activated: false };
  }
  if (data.result?.status !== 'success' || !data.result.account_data) {
    throw new Error(`xrpl: ${data.result?.error ?? 'unknown'}`);
  }
  const flags = data.result.account_data.Flags ?? 0;
  return {
    requireDestTag: (flags & LSF_REQUIRE_DEST_TAG) !== 0,
    disallowXRP: (flags & LSF_DISALLOW_XRP) !== 0,
    depositAuth: (flags & LSF_DEPOSIT_AUTH) !== 0,
    activated: true,
  };
}

export interface XrplAccountState {
  /** True если on-chain аккаунт существует (≥ reserve drops). */
  activated: boolean;
  /** Полный баланс в drops (на момент запроса). */
  balanceDrops: string;
  /** OwnerCount × 200_000 drops reserve. */
  ownerReserveDrops: string;
}

/**
 * Запрашивает реальное состояние XRPL-аккаунта через публичный RPC.
 * Если аккаунт не активирован, возвращает `{activated: false, balanceDrops: '0'}`.
 */
export async function fetchXrplAccountState(address: string): Promise<XrplAccountState> {
  const res = await xrplRpcCall({
    method: 'account_info',
    params: [{ account: address, strict: true, ledger_index: 'validated' }],
  });
  const data = (await res.json()) as AccountInfoResponse;

  // actNotFound — нормальный случай для нового, не активированного кошелька.
  if (data.result?.error === 'actNotFound') {
    return { activated: false, balanceDrops: '0', ownerReserveDrops: '0' };
  }
  if (data.result?.status !== 'success' || !data.result.account_data) {
    throw new Error(`xrpl: ${data.result?.error ?? 'unknown'}`);
  }
  const ad = data.result.account_data;
  const ownerCount = ad.OwnerCount ?? 0;
  return {
    activated: true,
    balanceDrops: ad.Balance ?? '0',
    ownerReserveDrops: (BigInt(ownerCount) * 200_000n).toString(),
  };
}
