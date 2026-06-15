import type { ReactNode } from 'react';
import { AlertTriangle, Info, CheckCircle2, XCircle, X } from '../icons.js';
import { cn } from '../utils/cn.js';
import { IconButton } from './IconButton.js';

export type BannerSeverity = 'info' | 'success' | 'warning' | 'danger';

interface BannerProps {
  severity: BannerSeverity;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const severityClass: Record<BannerSeverity, { wrap: string; iconColor: string }> = {
  info: { wrap: 'bg-info-100 text-info-700', iconColor: 'text-info-700' },
  success: { wrap: 'bg-success-100 text-success-700', iconColor: 'text-success-700' },
  warning: { wrap: 'bg-warning-100 text-warning-700', iconColor: 'text-warning-700' },
  danger: { wrap: 'bg-danger-100 text-danger-700', iconColor: 'text-danger-700' },
};

function SeverityIcon({ severity }: { severity: BannerSeverity }) {
  const C = { info: Info, success: CheckCircle2, warning: AlertTriangle, danger: XCircle }[severity];
  return <C className="h-5 w-5" aria-hidden />;
}

export function Banner({ severity, title, body, action, onDismiss, className }: BannerProps) {
  const cls = severityClass[severity];
  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-3 rounded-lg px-4 py-3 border border-transparent',
        cls.wrap,
        className,
      )}
    >
      <span className={cn('mt-0.5 shrink-0', cls.iconColor)}>
        <SeverityIcon severity={severity} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-body-strong">{title}</div>
        {body && <div className="text-body opacity-90">{body}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
      {onDismiss && (
        <IconButton
          aria-label="Dismiss"
          size="sm"
          onClick={onDismiss}
          className="text-current hover:bg-black/5"
        >
          <X className="h-4 w-4" />
        </IconButton>
      )}
    </div>
  );
}
