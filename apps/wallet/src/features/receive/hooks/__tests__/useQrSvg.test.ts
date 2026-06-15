import { describe, it, expect } from 'vitest';
import QRCode from 'qrcode';

// Прямой sanity-check на qrcode: рендер data URL для известного адреса.
// Сам React-хук протестируем через component-тесты позже; здесь — лишь библиотека.
describe('qrcode library', () => {
  it('produces data URL for an XRPL address', async () => {
    const url = await QRCode.toDataURL('rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH', {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 240,
    });
    expect(url.startsWith('data:image/')).toBe(true);
  });

  it('handles short input', async () => {
    const url = await QRCode.toDataURL('hi');
    expect(url).toMatch(/^data:image\//);
  });
});
