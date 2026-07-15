/** Keep only digits from a phone string. */
export function normalizePhoneDigits(input: string): string {
  return (input || '').replace(/\D/g, '');
}

/** Brazilian landline/mobile: DDD (2) + number (8 or 9). */
export function isValidBrazilianPhone(input: string): boolean {
  const digits = normalizePhoneDigits(input);
  return digits.length >= 10 && digits.length <= 11;
}
