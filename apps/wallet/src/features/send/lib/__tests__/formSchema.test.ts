import { describe, it, expect } from 'vitest';
import { sendFormSchema } from '../formSchema';

describe('sendFormSchema', () => {
  it('accepts valid input', () => {
    const r = sendFormSchema.safeParse({
      recipient: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
      amountInput: '1.5',
      destinationTag: '12345',
      memoText: 'invoice 42',
    });
    expect(r.success).toBe(true);
  });

  it('rejects invalid recipient', () => {
    const r = sendFormSchema.safeParse({
      recipient: 'garbage',
      amountInput: '1',
      destinationTag: '',
    });
    expect(r.success).toBe(false);
  });

  it('rejects amount >6 decimals', () => {
    const r = sendFormSchema.safeParse({
      recipient: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
      amountInput: '1.0000001',
      destinationTag: '',
    });
    expect(r.success).toBe(false);
  });

  it('rejects destinationTag out of range', () => {
    const r = sendFormSchema.safeParse({
      recipient: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
      amountInput: '1',
      destinationTag: '9999999999999',
    });
    expect(r.success).toBe(false);
  });

  it('accepts empty destinationTag and memoText', () => {
    const r = sendFormSchema.safeParse({
      recipient: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
      amountInput: '1',
      destinationTag: '',
      memoText: '',
    });
    expect(r.success).toBe(true);
  });

  it('accepts destinationTag 0', () => {
    const r = sendFormSchema.safeParse({
      recipient: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
      amountInput: '1',
      destinationTag: '0',
    });
    expect(r.success).toBe(true);
  });

  it('rejects memoText longer than 100 bytes', () => {
    const r = sendFormSchema.safeParse({
      recipient: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
      amountInput: '1',
      destinationTag: '',
      memoText: 'a'.repeat(101),
    });
    expect(r.success).toBe(false);
  });
});
