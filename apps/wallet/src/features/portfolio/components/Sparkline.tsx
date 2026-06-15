interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
  ariaLabel?: string;
}

/**
 * Lightweight inline SVG sparkline. No external chart lib.
 * positive=true → success-700, positive=false → danger-700.
 * Edge cases: empty data → пустой <svg>; min==max → horizontal line.
 */
export function Sparkline({
  data,
  width = 96,
  height = 24,
  positive = true,
  ariaLabel,
}: SparklineProps) {
  if (!data || data.length === 0) {
    return <svg width={width} height={height} aria-hidden />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = data.length > 1 ? width / (data.length - 1) : 0;
  const points = data
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  const color = positive ? 'rgb(var(--rc-success-700))' : 'rgb(var(--rc-danger-700))';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role={ariaLabel ? 'img' : 'presentation'}
      aria-label={ariaLabel}
    >
      <path d={points} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
