import type { ReactNode } from 'react';
import { Logo, StepIndicator } from '@rc/ui';

interface OnboardingLayoutProps {
  step?: number;
  total?: number;
  stepLabel?: string;
  children: ReactNode;
}

export function OnboardingLayout({ step, total, stepLabel, children }: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-page">
      <header className="bg-surface border-b border-neutral-200">
        <div className="mx-auto max-w-[1440px] h-16 flex items-center px-4 sm:px-6 lg:px-8">
          <Logo suffix="wallet" />
        </div>
      </header>
      <main className="mx-auto max-w-[640px] px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-surface rounded-2xl shadow-e2 border border-neutral-200 p-6 sm:p-10 flex flex-col gap-6">
          {step && total ? (
            <div className="flex flex-col items-center gap-2">
              <StepIndicator current={step} total={total} label={stepLabel} />
            </div>
          ) : null}
          {children}
        </div>
      </main>
    </div>
  );
}
