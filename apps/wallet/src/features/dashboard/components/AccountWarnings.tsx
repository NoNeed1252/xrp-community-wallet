import type { ReactNode } from 'react';
import { AlertTriangle, Info } from '@rc/ui';
import { useNavigate } from 'react-router-dom';

export interface PillWarning {
  id: string;
  severity: 'warning' | 'info';
  label: string;
  to?: string;
}

interface Props {
  warnings: readonly PillWarning[];
}

function severityClass(s: PillWarning['severity']): string {
  return s === 'warning'
    ? 'bg-warning-100 text-warning-700 hover:bg-warning-200 ring-warning-200'
    : 'bg-brand-50 text-brand-700 hover:bg-brand-100 ring-brand-100';
}

function severityIcon(s: PillWarning['severity']): ReactNode {
  return s === 'warning' ? (
    <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
  ) : (
    <Info className="h-3.5 w-3.5" aria-hidden="true" />
  );
}

export function AccountWarnings({ warnings }: Props) {
  const navigate = useNavigate();
  if (warnings.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {warnings.map((w) => {
        const className = `inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption ring-1 transition-colors ${severityClass(w.severity)}`;
        if (w.to) {
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => navigate(w.to!)}
              className={className}
            >
              {severityIcon(w.severity)}
              <span>{w.label}</span>
            </button>
          );
        }
        return (
          <span key={w.id} className={className}>
            {severityIcon(w.severity)}
            <span>{w.label}</span>
          </span>
        );
      })}
    </div>
  );
}
