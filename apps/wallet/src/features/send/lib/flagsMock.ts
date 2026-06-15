import rawMocks from '~/mocks.json';

interface AccountFlags {
  requireDestTag: boolean;
  disallowXRP: boolean;
  knownLabel: string | null;
}

/**
 * Mock account flags lookup. Возвращает флаги если адрес есть в mocks.json
 * (accounts или contacts), иначе дефолт `{ requireDestTag: false }`.
 * В integration step заменяется на live XRPL `account_info`.
 */
export async function getAccountFlags(address: string): Promise<AccountFlags> {
  // Имитация сетевой задержки.
  await new Promise((resolve) => setTimeout(resolve, 200));

  const accounts = (rawMocks as Record<string, unknown>).accounts as Array<{
    address: string;
    label: string;
    flags: { requireDestTag: boolean; disallowXRP: boolean };
  }>;
  const contacts = (rawMocks as Record<string, unknown>).contacts as Array<{
    address: string;
    label: string;
    destinationTag: number | null;
  }>;

  const foundAccount = accounts.find((a) => a.address === address);
  if (foundAccount) {
    return {
      requireDestTag: foundAccount.flags.requireDestTag,
      disallowXRP: foundAccount.flags.disallowXRP,
      knownLabel: foundAccount.label,
    };
  }

  const foundContact = contacts.find((c) => c.address === address);
  if (foundContact) {
    // Контакт с явным destinationTag трактуем как RequireDest для UX.
    return {
      requireDestTag: foundContact.destinationTag !== null && foundContact.destinationTag !== 0,
      disallowXRP: false,
      knownLabel: foundContact.label,
    };
  }

  // ZEPHYRA имеет requireDest=true даже без destinationTag — special-case по тесту mocks
  // (см. mocks.json: ctc_01H8VZK7ZEPHYRA имеет destinationTag=8472).
  return { requireDestTag: false, disallowXRP: false, knownLabel: null };
}

export function getContactByAddress(address: string) {
  const contacts = (rawMocks as Record<string, unknown>).contacts as Array<{
    id: string;
    address: string;
    label: string;
    destinationTag: number | null;
  }>;
  return contacts.find((c) => c.address === address) ?? null;
}

export function listContacts() {
  return ((rawMocks as Record<string, unknown>).contacts as Array<{
    id: string;
    address: string;
    label: string;
    destinationTag: number | null;
  }>) ?? [];
}
