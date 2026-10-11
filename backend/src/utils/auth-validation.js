const { parsePhoneNumberFromString, isSupportedCountry } = require('libphonenumber-js/max');

function normalizePhone(value, country) {
  if (typeof value !== 'string' || value.length > 64) return null;
  let input = value.trim();
  if (!/^(?:\+|00)?[\d\s().-]+$/.test(input)) return null;
  if (input.startsWith('00')) input = '+' + input.slice(2);
  const region = typeof country === 'string' ? country.toUpperCase() : undefined;
  // Older web clients send international digits without '+'. Never guess a country.
  if (!input.startsWith('+') && !region) input = '+' + input;
  const parsed = parsePhoneNumberFromString(input, {
    defaultCountry: region && isSupportedCountry(region) ? region : undefined,
    extract: false,
  });
  return parsed?.isValid() && !parsed.ext ? parsed.number : null;
}

function passwordError(value) {
  if (typeof value !== 'string' || [...value].length < 15) return 'Use at least 15 characters for your password';
  if (Buffer.byteLength(value, 'utf8') > 72) return 'Password must be at most 72 UTF-8 bytes';
  return null;
}

function normalizeEmail(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

// Compatibility for stored formatting and the old '+91+91...' bug. Ambiguous
// matches are rejected by callers; this never rewrites existing account data.
const PHONE_DIGITS_SQL = "regexp_replace(regexp_replace(phone, '^.*\\+', ''), '[^0-9]', '', 'g')";

module.exports = { normalizePhone, normalizeEmail, passwordError, PHONE_DIGITS_SQL };
