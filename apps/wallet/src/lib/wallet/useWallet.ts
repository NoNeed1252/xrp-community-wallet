import { useEffect, useState } from 'react';
import {
  getActiveAccount,
  getAllSubAccounts,
  getPreferences,
  getProfiles,
  getSubAccounts,
  subscribe,
} from './vault';
import type { SubAccount, UserPreferences, WalletProfile } from './types';

/** Active account — reactive через subscribe. */
export function useActiveAccount(): { profile: WalletProfile | null; loading: boolean } {
  const [profile, setProfile] = useState<WalletProfile | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      void getActiveAccount().then((p) => {
        if (!cancelled) {
          setProfile(p);
          setLoading(false);
        }
      });
    };
    refresh();
    const unsub = subscribe(refresh);
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);
  return { profile, loading };
}

/** All accounts. */
export function useAllAccounts(): { profiles: WalletProfile[]; loading: boolean } {
  const [profiles, setProfiles] = useState<WalletProfile[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      void getProfiles().then((p) => {
        if (!cancelled) {
          setProfiles(p);
          setLoading(false);
        }
      });
    };
    refresh();
    const unsub = subscribe(refresh);
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);
  return { profiles, loading };
}

/** Backward-compat: используется с W3. Возвращает active account. */
export function useWalletProfile() {
  return useActiveAccount();
}

export function useWalletAddress(): string | null {
  return useActiveAccount().profile?.address ?? null;
}

export function usePreferences(): { prefs: UserPreferences | null; loading: boolean } {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      void getPreferences().then((p) => {
        if (!cancelled) {
          setPrefs(p);
          setLoading(false);
        }
      });
    };
    refresh();
    const unsub = subscribe(refresh);
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);
  return { prefs, loading };
}

export function useSubAccounts(accountId: string | null): { subs: SubAccount[]; loading: boolean } {
  const [subs, setSubs] = useState<SubAccount[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!accountId) {
      setSubs([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const refresh = () => {
      void getSubAccounts(accountId).then((s) => {
        if (!cancelled) {
          setSubs(s);
          setLoading(false);
        }
      });
    };
    refresh();
    const unsub = subscribe(refresh);
    return () => {
      cancelled = true;
      unsub();
    };
  }, [accountId]);
  return { subs, loading };
}

export function useAllSubAccounts(): { all: Record<string, SubAccount[]>; loading: boolean } {
  const [all, setAll] = useState<Record<string, SubAccount[]>>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      void getAllSubAccounts().then((a) => {
        if (!cancelled) {
          setAll(a);
          setLoading(false);
        }
      });
    };
    refresh();
    const unsub = subscribe(refresh);
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);
  return { all, loading };
}
