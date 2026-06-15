import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Flow = 'create' | 'import_seed' | 'import_key' | null;

interface OnboardingValue {
  flow: Flow;
  generatedSeed: string | null;
  importedSecret: string | null;
  setFlow(f: Flow): void;
  setGeneratedSeed(s: string | null): void;
  setImportedSecret(s: string | null): void;
  clear(): void;
}

const OnboardingContext = createContext<OnboardingValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [flow, setFlow] = useState<Flow>(null);
  const [generatedSeed, setGeneratedSeed] = useState<string | null>(null);
  const [importedSecret, setImportedSecret] = useState<string | null>(null);

  // Если пользователь покидает онбординг до DonePage (back-button / закрытие
  // вкладки), убираем расшифрованный материал из state — иначе он живёт в
  // memory до GC (security audit M4).
  useEffect(() => {
    return () => {
      setFlow(null);
      setGeneratedSeed(null);
      setImportedSecret(null);
    };
  }, []);

  const value: OnboardingValue = {
    flow,
    generatedSeed,
    importedSecret,
    setFlow,
    setGeneratedSeed,
    setImportedSecret,
    clear: () => {
      setFlow(null);
      setGeneratedSeed(null);
      setImportedSecret(null);
    },
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboardingState(): OnboardingValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboardingState: missing <OnboardingProvider>');
  return ctx;
}
