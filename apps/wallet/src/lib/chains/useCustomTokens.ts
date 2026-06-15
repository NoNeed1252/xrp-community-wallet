import { useEffect, useState } from 'react';
import { getCustomTokens, subscribeCustomTokens, type CustomToken } from './customTokensStore';

export function useCustomTokens(): { tokens: CustomToken[]; loading: boolean } {
  const [tokens, setTokens] = useState<CustomToken[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      void getCustomTokens().then((list) => {
        if (!cancelled) {
          setTokens(list);
          setLoading(false);
        }
      });
    };
    refresh();
    const unsub = subscribeCustomTokens(refresh);
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  return { tokens, loading };
}
