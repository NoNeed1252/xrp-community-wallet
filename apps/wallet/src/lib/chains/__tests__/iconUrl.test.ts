import { describe, expect, it } from 'vitest';
import { assetIconUrl, nativeIconUrl, tokenIconUrl } from '../assets/iconUrl';
import { NATIVE_ETH, NATIVE_XRP } from '../registry';
import { findToken } from '../tokens';

describe('iconUrl', () => {
  it('nativeIconUrl — Trust Wallet info logo', () => {
    expect(nativeIconUrl('xrpl')).toBe(
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ripple/info/logo.png',
    );
    expect(nativeIconUrl('eth')).toContain('/ethereum/info/logo.png');
    expect(nativeIconUrl('bsc')).toContain('/smartchain/info/logo.png');
    expect(nativeIconUrl('pol')).toContain('/polygon/info/logo.png');
  });

  it('tokenIconUrl — Trust Wallet assets path', () => {
    expect(tokenIconUrl('eth', '0xdAC17F958D2ee523a2206206994597C13D831ec7')).toBe(
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
    );
  });

  it('assetIconUrl — диспатч native vs token', () => {
    expect(assetIconUrl(NATIVE_XRP)).toContain('/ripple/info/logo.png');
    expect(assetIconUrl(NATIVE_ETH)).toContain('/ethereum/info/logo.png');
    const usdt = findToken('eth:usdt')!;
    expect(assetIconUrl(usdt)).toContain('/ethereum/assets/');
  });
});
