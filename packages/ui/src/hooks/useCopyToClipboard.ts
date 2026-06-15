import { useCallback, useState } from 'react';

export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      return true;
    } catch {
      return false;
    }
  }, []);
  return { copy, copied };
}
