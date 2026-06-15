import type { ReactNode } from 'react';
import { cn } from '../utils/cn.js';
import { Banner } from './Banner.js';
import { Button } from './Button.js';

interface ErrorStateProps {
  title: string;
  body?: ReactNode;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title, body, retryLabel, onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-stretch gap-3 py-2', className)} role="alert">
      <Banner severity="danger" title={title} body={body} />
      {onRetry && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={onRetry}>
            {retryLabel ?? 'Retry'}
          </Button>
        </div>
      )}
    </div>
  );
}
