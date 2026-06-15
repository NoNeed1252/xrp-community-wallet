import { useQuery } from '@tanstack/react-query';
import { fetchXrplAccountFlags } from '~/lib/explorers/xrplAccount';
import { getContactByAddress } from '../lib/flagsMock';

interface FlagsResult {
  /** RequireDestTag установлен в on-chain `account_data.Flags`. */
  requireDestTag: boolean;
  /** DisallowXRP установлен. */
  disallowXRP: boolean;
  /** Локальный лейбл из контактов (UI nicety, не используется для блокировок). */
  knownLabel: string | null;
  /** Сетевой запрос ещё идёт — UI должен подавлять «выглядит безопасно». */
  loading: boolean;
  /** Сетевой ответ не получен (offline, RPC down). UI обязан вывести «не удалось проверить». */
  error: boolean;
}

const XRPL_ADDRESS = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;

const SAFE_DEFAULT: FlagsResult = {
  requireDestTag: false,
  disallowXRP: false,
  knownLabel: null,
  loading: false,
  error: false,
};

export function useAccountFlags(address: string | null): FlagsResult {
  const valid = Boolean(address && XRPL_ADDRESS.test(address));
  const knownLabel = address ? getContactByAddress(address)?.label ?? null : null;

  const q = useQuery({
    queryKey: ['xrpl-flags', address],
    queryFn: () => fetchXrplAccountFlags(address as string),
    enabled: valid,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  if (!valid) return { ...SAFE_DEFAULT, knownLabel };
  return {
    requireDestTag: q.data?.requireDestTag ?? false,
    disallowXRP: q.data?.disallowXRP ?? false,
    knownLabel,
    loading: q.isLoading,
    error: q.isError,
  };
}
