/**
 * Sub-account CRUD — отдельный модуль, импортируется только
 * страницей Settings/Sub-accounts и SubAccountQuick на Receive.
 */
import { __vaultInternals, getAllSubAccounts, getProfiles } from './vault';
import type { SubAccount } from './types';

const { STORE, KEY_SUB_ACCOUNTS, getDb, notify, nextId } = __vaultInternals;

export async function addSubAccount(
  accountId: string,
  input: Omit<SubAccount, 'id' | 'accountId' | 'createdAt'>,
): Promise<SubAccount> {
  const profiles = await getProfiles();
  if (!profiles.some((p) => p.id === accountId)) throw new Error('vault: unknown account');
  if (
    !Number.isInteger(input.destinationTag) ||
    input.destinationTag < 0 ||
    input.destinationTag > 4_294_967_295
  ) {
    throw new Error('vault: invalid destination tag');
  }
  const all = await getAllSubAccounts();
  const list = all[accountId] ?? [];
  if (list.some((s) => s.destinationTag === input.destinationTag)) {
    throw new Error('vault: destination tag already used in this account');
  }
  const sub: SubAccount = {
    id: await nextId(),
    accountId,
    label: input.label.trim(),
    destinationTag: input.destinationTag,
    note: input.note?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  const next = { ...all, [accountId]: [...list, sub] };
  const db = await getDb();
  await db.put(STORE, next, KEY_SUB_ACCOUNTS);
  notify();
  return sub;
}

export async function renameSubAccount(subId: string, label: string): Promise<void> {
  const all = await getAllSubAccounts();
  const next: Record<string, SubAccount[]> = {};
  for (const [k, list] of Object.entries(all)) {
    next[k] = list.map((s) => (s.id === subId ? { ...s, label: label.trim() || s.label } : s));
  }
  const db = await getDb();
  await db.put(STORE, next, KEY_SUB_ACCOUNTS);
  notify();
}

export async function deleteSubAccount(subId: string): Promise<void> {
  const all = await getAllSubAccounts();
  const next: Record<string, SubAccount[]> = {};
  for (const [k, list] of Object.entries(all)) {
    next[k] = list.filter((s) => s.id !== subId);
  }
  const db = await getDb();
  await db.put(STORE, next, KEY_SUB_ACCOUNTS);
  notify();
}
