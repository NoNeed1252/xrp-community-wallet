export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

/**
 * Простая эвристика без сторонних либ. Достаточно для onboarding gate.
 */
export function scorePassword(pwd: string): { score: number; strength: PasswordStrength } {
  if (!pwd) return { score: 0, strength: 'weak' };
  let s = 0;
  if (pwd.length >= 8) s += 1;
  if (pwd.length >= 12) s += 1;
  if (pwd.length >= 16) s += 1;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) s += 1;
  if (/\d/.test(pwd)) s += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) s += 1;
  if (/^(.)\1+$/.test(pwd)) s = Math.min(s, 1);
  const strength: PasswordStrength =
    s <= 2 ? 'weak' : s <= 3 ? 'fair' : s <= 4 ? 'good' : 'strong';
  return { score: s, strength };
}

export function meetsRequirements(pwd: string): boolean {
  return pwd.length >= 10 && scorePassword(pwd).strength !== 'weak';
}
