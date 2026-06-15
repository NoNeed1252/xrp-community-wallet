import { useCallback, useEffect, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'rc:theme';

function readStored(): Theme {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === 'dark' || v === 'light') return v;
  } catch {
    // ignore
  }
  return 'light';
}

function apply(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

let current: Theme = typeof window === 'undefined' ? 'light' : readStored();

export function getTheme(): Theme {
  return current;
}

export function setTheme(next: Theme) {
  current = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // ignore
  }
  apply(next);
  emit();
}

export function useTheme(): [Theme, (next: Theme) => void] {
  const theme = useSyncExternalStore(
    subscribe,
    () => current,
    () => 'light' as Theme,
  );
  useEffect(() => {
    apply(theme);
  }, [theme]);
  const set = useCallback((next: Theme) => setTheme(next), []);
  return [theme, set];
}
