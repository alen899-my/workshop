import { isSupportedCountry, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/max';

export const DEFAULT_PHONE_COUNTRY = 'IN';
export const DEFAULT_CALLING_CODE = '+91';

// Keep national input separate from its country. Add the prefix only here,
// using metadata so trunk prefixes (for example the UK's 0) are handled safely.
export function normalizeAuthPhone(value: string, country: string): string | null {
  if (value.length > 64 || !/^(?:\+|00)?[\d\s().-]+$/.test(value.trim())) return null;
  const input = value.trim().replace(/^00/, '+');
  const region = country.toUpperCase();
  if (!isSupportedCountry(region)) return null;
  const phone = parsePhoneNumberFromString(input, { defaultCountry: region as CountryCode, extract: false });
  return phone?.isValid() && !phone.ext ? phone.number : null;
}

export function passwordError(value: string): string | undefined {
  if ([...value].length < 15) return 'Use at least 15 characters';
  // UTF-8 byte count without a Node Buffer dependency in native builds.
  const bytes = [...value].reduce((total, char) => {
    const point = char.codePointAt(0)!;
    return total + (point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4);
  }, 0);
  if (bytes > 72) return 'Use at most 72 UTF-8 bytes (fewer characters for some languages)';
}

export function validEmail(value: string): boolean {
  return value.trim().length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
