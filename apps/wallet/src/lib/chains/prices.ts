import type { MarketRow, PriceQuote } from './types';

const BASE = 'https://api.coingecko.com/api/v3';

function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...init,
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
  });
}

async function fetchWithRetry(url: string, attempts = 3, baseDelayMs = 400): Promise<Response> {
  let lastErr: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await safeFetch(url);
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`prices: HTTP ${res.status}`);
      } else {
        return res;
      }
    } catch (err) {
      lastErr = err;
    }
    if (i < attempts - 1) {
      const delay = Math.min(5_000, baseDelayMs * 2 ** i);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export async function fetchPrices(ids: readonly string[]): Promise<Map<string, PriceQuote>> {
  const result = new Map<string, PriceQuote>();
  if (ids.length === 0) return result;
  const url = `${BASE}/simple/price?ids=${encodeURIComponent(ids.join(','))}&vs_currencies=usd&include_24hr_change=true`;
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`prices: HTTP ${res.status}`);
  const data = (await res.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;
  const fetchedAt = Date.now();
  for (const id of ids) {
    const entry = data[id];
    if (!entry || typeof entry.usd !== 'number') continue;
    result.set(id, {
      coingeckoId: id,
      usd: entry.usd,
      change24h: typeof entry.usd_24h_change === 'number' ? entry.usd_24h_change : null,
      fetchedAt,
    });
  }
  return result;
}

export interface MarketsInput {
  readonly ids?: readonly string[];
  readonly perPage?: number;
  readonly sparkline?: boolean;
}

interface CoinGeckoMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number | null;
  price_change_percentage_24h: number | null;
  market_cap: number | null;
  sparkline_in_7d?: { price: number[] };
}

export async function fetchMarkets(input: MarketsInput = {}): Promise<MarketRow[]> {
  const params = new URLSearchParams({
    vs_currency: 'usd',
    order: 'market_cap_desc',
    per_page: String(input.perPage ?? 20),
    page: '1',
    sparkline: String(input.sparkline ?? true),
    price_change_percentage: '24h',
  });
  if (input.ids && input.ids.length > 0) {
    params.set('ids', input.ids.join(','));
  }
  const res = await fetchWithRetry(`${BASE}/coins/markets?${params.toString()}`);
  if (!res.ok) throw new Error(`markets: HTTP ${res.status}`);
  const data = (await res.json()) as CoinGeckoMarket[];
  return data
    .filter((row) => typeof row.current_price === 'number' && Number.isFinite(row.current_price))
    .map((row) => ({
      id: row.id,
      symbol: row.symbol.toUpperCase(),
      name: row.name,
      image: row.image,
      priceUsd: row.current_price as number,
      change24h: row.price_change_percentage_24h,
      marketCap: row.market_cap,
      sparkline: row.sparkline_in_7d?.price ?? [],
    }));
}
