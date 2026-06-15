import { useEffect } from 'react';
import { setTheme } from './useTheme';
import { usePreferences } from '~/lib/wallet/useWallet';
import type { Theme } from '~/lib/wallet/types';

function resolve(t: Theme): 'light' | 'dark' {
  if (t === 'system') {
    return typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return t;
}

/**
 * Синхронизирует preferences.theme → data-theme на <html>.
 * 'system' слушает prefers-color-scheme и реагирует на смену OS темы.
 */
export function useThemeSync() {
  const { prefs } = usePreferences();
  const pref = prefs?.theme ?? 'light';

  useEffect(() => {
    setTheme(resolve(pref));
    if (pref !== 'system' || typeof window === 'undefined') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setTheme(resolve('system'));
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [pref]);
}
