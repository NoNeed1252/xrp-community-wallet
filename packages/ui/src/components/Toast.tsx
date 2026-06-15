import { useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from '../icons.js';
import { cn } from '../utils/cn.js';

/**
 * Singleton-based toaster. Use `toast.show({...})` from anywhere.
 * Toaster mounts the container; show() dispatches messages.
 */

export type ToastSeverity = 'info' | 'success' | 'warning' | 'danger';

export interface ToastEvent {
  id: number;
  severity: ToastSeverity;
  title: string;
  body?: string;
  durationMs?: number;
}

type Listener = (ev: ToastEvent) => void;
const listeners = new Set<Listener>();
let nextId = 1;

function dispatch(input: Omit<ToastEvent, 'id'>) {
  const ev: ToastEvent = { id: nextId++, ...input };
  for (const l of [...listeners]) l(ev);
}

export const toast = {
  show: (ev: Omit<ToastEvent, 'id'>) => dispatch(ev),
  info: (title: string, body?: string) => dispatch({ severity: 'info', title, body }),
  success: (title: string, body?: string) => dispatch({ severity: 'success', title, body }),
  warning: (title: string, body?: string) => dispatch({ severity: 'warning', title, body }),
  danger: (title: string, body?: string) => dispatch({ severity: 'danger', title, body }),
};

const severityClass: Record<ToastSeverity, { bar: string; icon: ReactNode }> = {
  info: { bar: 'bg-info-700', icon: <Info className="h-5 w-5 text-info-700" aria-hidden /> },
  success: { bar: 'bg-success-700', icon: <CheckCircle2 className="h-5 w-5 text-success-700" aria-hidden /> },
  warning: { bar: 'bg-warning-700', icon: <AlertTriangle className="h-5 w-5 text-warning-700" aria-hidden /> },
  danger: { bar: 'bg-danger-700', icon: <XCircle className="h-5 w-5 text-danger-700" aria-hidden /> },
};

export function Toaster() {
  const [items, setItems] = useState<ToastEvent[]>([]);

  useEffect(() => {
    const l: Listener = (ev) => setItems((prev) => [...prev.slice(-2), ev]);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-toast flex flex-col gap-2 pointer-events-none"
    >
      {items.map((ev) => (
        <ToastItem key={ev.id} event={ev} onDismiss={() => setItems((p) => p.filter((x) => x.id !== ev.id))} />
      ))}
    </div>
  );
}

function ToastItem({ event, onDismiss }: { event: ToastEvent; onDismiss: () => void }) {
  const duration = event.durationMs ?? (event.severity === 'danger' ? 8000 : 4000);
  const cls = severityClass[event.severity];

  useEffect(() => {
    const id = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(id);
  }, [duration, onDismiss]);

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto w-[360px] max-w-[90vw] bg-surface rounded-lg shadow-e2 border border-neutral-200 overflow-hidden',
        'flex',
      )}
    >
      <span className={cn('w-1 shrink-0', cls.bar)} aria-hidden />
      <div className="flex-1 p-4 flex items-start gap-3">
        <span className="mt-0.5 shrink-0">{cls.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-body-strong text-neutral-900">{event.title}</div>
          {event.body && <div className="text-body text-neutral-500 mt-0.5">{event.body}</div>}
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="text-neutral-400 hover:text-neutral-700 shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
