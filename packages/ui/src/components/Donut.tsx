import type { ReactNode } from 'react';
import { cn } from '../utils/cn.js';

interface Segment {
  label: string;
  percent: number;
  color: string;
}

interface DonutProps {
  segments: Segment[];
  size?: number;
  thickness?: number;
  centerLabel?: ReactNode;
  centerCaption?: ReactNode;
  className?: string;
}

/**
 * Lightweight SVG donut. Без сторонней chart-либы.
 * Цвета — токены brand.600/500/300 + warning.700 (или своя palette по segment.color).
 */
export function Donut({
  segments,
  size = 156,
  thickness = 18,
  centerLabel,
  centerCaption,
  className,
}: DonutProps) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((s, x) => s + x.percent, 0) || 1;
  const palette: Record<string, string> = {
    'brand.600': 'rgb(var(--rc-brand-600))',
    'brand.500': 'rgb(var(--rc-brand-500))',
    'brand.100': 'rgb(var(--rc-brand-100))',
    'warning.700': 'rgb(var(--rc-warning-700))',
    'success.700': 'rgb(var(--rc-success-700))',
    'neutral.300': 'rgb(var(--rc-neutral-300))',
  };

  let offset = 0;
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Balances distribution">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--rc-neutral-100))"
          strokeWidth={thickness}
        />
        {segments.map((seg, i) => {
          const fraction = seg.percent / total;
          const dash = fraction * circumference;
          const gap = circumference - dash;
          const dashOffset = circumference - offset;
          offset += dash;
          const color = palette[seg.color] ?? seg.color;
          return (
            <circle
              key={`${seg.label}-${i}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {centerCaption && <span className="text-caption text-neutral-500">{centerCaption}</span>}
        {centerLabel && <span className="text-h2 text-neutral-900">{centerLabel}</span>}
      </div>
    </div>
  );
}
