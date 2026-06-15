import { useEffect } from 'react';
import { lock } from './vault';
import { usePreferences } from './useWallet';

const RESET_THROTTLE_MS = 1_000;

function unlockHref(): string {
  // Wallet может быть развёрнут на префиксе (например, /wallet/) — учитываем
  // `import.meta.env.BASE_URL`, чтобы редирект не уводил на корень домена
  // (security audit L3).
  const base = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL ? import.meta.env.BASE_URL : '/';
  const normalized = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${normalized}/unlock`;
}

/**
 * Регистрирует слушатели активности.
 * Параметры берёт из user preferences (autoLockMinutes, lockOnHidden).
 */
export function useAutoLock() {
  const { prefs } = usePreferences();
  const inactivityMs = (prefs?.autoLockMinutes ?? 15) * 60 * 1000;
  const lockOnHidden = prefs?.lockOnHidden ?? true;

  useEffect(() => {
    let timer: number | null = null;
    let lastResetAt = 0;
    const reset = () => {
      const now = Date.now();
      if (now - lastResetAt < RESET_THROTTLE_MS) return;
      lastResetAt = now;
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        lock();
        if (typeof window !== 'undefined') window.location.assign(unlockHref());
      }, inactivityMs);
    };
    const events: Array<keyof DocumentEventMap | keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
    ];
    const onVisibility = () => {
      if (lockOnHidden && document.visibilityState === 'hidden') {
        lock();
        window.location.assign(unlockHref());
      }
    };
    reset();
    events.forEach((e) => window.addEventListener(e as keyof WindowEventMap, reset, { passive: true }));
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      if (timer !== null) window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e as keyof WindowEventMap, reset));
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [inactivityMs, lockOnHidden]);
}
