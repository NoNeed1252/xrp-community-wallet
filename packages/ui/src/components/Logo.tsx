import { cn } from '../utils/cn.js';

interface LogoProps {
  suffix?: string;
  className?: string;
  /**
   * Force a variant. When omitted, the mark follows `:root[data-theme]`:
   * black on light, white on dark — driven by a single background-image
   * rule so the DOM stays one element.
   */
  variant?: 'white' | 'black';
}

export function Logo({ suffix, className, variant }: LogoProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2.5 leading-none text-neutral-900',
        className,
      )}
    >
      <span
        role="img"
        aria-label="Ripple Community"
        className={cn(
          'rc-logo-mark inline-block',
          variant === 'white' && 'rc-logo-mark-white',
          variant === 'black' && 'rc-logo-mark-black',
        )}
      />
      {suffix && (
        <>
          <span className="text-neutral-300" aria-hidden>
            |
          </span>
          <span className="text-h3 font-semibold text-neutral-700">{suffix}</span>
        </>
      )}
    </span>
  );
}
