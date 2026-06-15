import { Skeleton } from '@rc/ui';
import { useQrDataUrl } from '../hooks/useQrSvg';

interface QrBlockProps {
  value: string | null;
  size?: number;
  ariaLabel: string;
}

export function QrBlock({ value, size = 240, ariaLabel }: QrBlockProps) {
  const dataUrl = useQrDataUrl(value, { size });

  if (!dataUrl) {
    return (
      <div
        className="inline-flex items-center justify-center bg-surface rounded-lg p-3"
        style={{ width: size + 24, height: size + 24 }}
      >
        <Skeleton width={size} height={size} rounded="md" />
      </div>
    );
  }

  return (
    <div className="inline-flex bg-surface rounded-lg p-3">
      <img
        src={dataUrl}
        alt={ariaLabel}
        width={size}
        height={size}
        style={{ width: size, height: size, imageRendering: 'pixelated' }}
      />
    </div>
  );
}
