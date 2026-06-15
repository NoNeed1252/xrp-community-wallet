import { describe, expect, it } from 'vitest';
import { EVM_PATH, deriveEvm } from '../hd';

const VECTOR = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
// Известный публичный адрес для канонического BIP-39 mnemonic на пути m/44'/60'/0'/0/0
// Reference: ethers Wallet.fromPhrase(VECTOR).address.
const VECTOR_ADDRESS = '0x9858EfFD232B4033E47d90003D41EC34EcaEda94';

describe('deriveEvm', () => {
  it('детерминирован — same mnemonic ⇒ same address', async () => {
    const phrase = 'legal winner thank year wave sausage worth useful legal winner thank yellow';
    const a = await deriveEvm(phrase);
    const b = await deriveEvm(phrase);
    expect(a.address).toBe(b.address);
  });

  it('канонический BIP-44 test vector', async () => {
    const out = await deriveEvm(VECTOR);
    expect(out.address).toBe(VECTOR_ADDRESS);
    expect(out.privateKey).toHaveLength(64);
    expect(out.publicKey).toHaveLength(66);
  });

  it('разные пути → разные адреса', async () => {
    const a = await deriveEvm(VECTOR, EVM_PATH);
    const b = await deriveEvm(VECTOR, "m/44'/60'/0'/0/1");
    expect(a.address).not.toBe(b.address);
  });

  it('address — EIP-55 checksum', async () => {
    const out = await deriveEvm(VECTOR);
    expect(out.address).toMatch(/^0x[0-9a-fA-F]{40}$/u);
    // Mixed case (а не lowercase only) — verifies checksum applied.
    expect(out.address).not.toBe(out.address.toLowerCase());
  });
});
