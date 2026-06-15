import { useEffect, useState } from 'react';

/**
 * Лениво грузит `qrcode` и генерирует data:image URL для адреса.
 * Используем PNG data URL (а не inline SVG), чтобы избежать dangerouslySetInnerHTML.
 */
export function useQrDataUrl(value: string | null, opts: { size?: number; margin?: number } = {}) {
  const { size = 240, margin = 1 } = opts;
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setDataUrl(null);
      return;
    }
    let cancelled = false;
    void import('qrcode').then((mod) => {
      mod
        .toDataURL(value, {
          errorCorrectionLevel: 'M',
          margin,
          width: size,
          color: { dark: '#0E1116', light: '#FFFFFF' },
        })
        .then((url) => {
          if (!cancelled) setDataUrl(url);
        })
        .catch(() => {
          if (!cancelled) setDataUrl(null);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [value, size, margin]);

  return dataUrl;
}
