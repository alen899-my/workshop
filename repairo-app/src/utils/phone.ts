import { countriesCache } from './preload-countries';

// Static fallback dial codes (without '+') so stripping works before async cache loads.
const FALLBACK_DIALS = [
  '880', '977', '351', '234', '254', '971', '966', '974', '965', '968', '973',
  '91', '44', '61', '64', '41', '46', '47', '45', '81', '82', '86', '55', '27',
  '20', '90', '60', '65', '94', '92', '93', '49', '33', '39', '34', '31', '32',
  '43', '52', '63', '62', '66', '84', '7', '1',
];

function getKnownDials(): string[] {
  const set = new Set<string>(FALLBACK_DIALS);
  if (countriesCache) {
    for (const c of Object.values(countriesCache) as any[]) {
      const d = c?.callingCode?.[0];
      if (d) set.add(String(d));
    }
  }
  return [...set].sort((a, b) => b.length - a.length);
}

function cleanPlusNumber(value: string): string {
  const t = (value || '').trim().replace(/^00/, '+');
  if (!t.startsWith('+')) return t;
  // Collapse duplicate '+' signs: "+91+919..." -> "+91919..."
  return '+' + t.slice(1).replace(/\+/g, '').trimStart();
}

export function stripCallingCode(fullNumber: string): { code: string; localNumber: string } {
  if (!fullNumber) return { code: '', localNumber: '' };
  const raw = (fullNumber || '').trim();
  if (!raw) return { code: '', localNumber: '' };
  let s = cleanPlusNumber(raw);
  // Remove visual separators for matching, keep '+' prefix.
  s = s.startsWith('+') ? '+' + s.slice(1).replace(/[\s\-.()]/g, '') : s.replace(/[\s\-.()]/g, '');
  if (!s.startsWith('+')) return { code: '', localNumber: s.replace(/\D/g, '') || s };

  const dials = getKnownDials();
  for (const dial of dials) {
    if (s.startsWith(`+${dial}`)) {
      let local = s.slice(dial.length + 1).replace(/\D/g, '');
      // Strip trunk zero(s): "+91098..." -> "987..."
      local = local.replace(/^0+/, '');
      // De-dupe doubled code: "+91+919..." collapsed above still leaves "9191..."
      // Only strip when enough digits remain for a real national number.
      while (local.startsWith(dial) && local.length >= dial.length + 7) {
        local = local.slice(dial.length).replace(/^0+/, '');
      }
      return { code: `+${dial}`, localNumber: local };
    }
  }
  // Unknown dial code: don't fabricate a "+" code (caused "+ +91..." bug).
  // Return raw digits so display never repeats the code.
  return { code: '', localNumber: s.replace(/\D/g, '') ? `+${s.slice(1).replace(/\D/g, '')}` : s };
}

export function formatPhoneForDisplay(fullNumber: string): string {
  if (!fullNumber) return '';
  const { code, localNumber } = stripCallingCode(fullNumber);
  if (!code && !localNumber) return '';
  if (!code) return localNumber;
  if (!localNumber) return code;
  return `${code} ${localNumber}`;
}

/** Join a calling code with raw user input without ever doubling the code. */
export function buildFullPhone(callingCode: string, rawInput: string): string {
  const input = (rawInput || '').trim();
  if (!input) return '';
  const code = (callingCode || '').trim();
  if (!code) {
    const s = cleanPlusNumber(input).replace(/[\s\-.()]/g, '');
    return s.startsWith('+') ? `+${s.slice(1).replace(/\D/g, '')}` : `+${s.replace(/\D/g, '')}`;
  }
  const codeDigits = code.replace(/\D/g, '');
  // Input already international: extract its national part, ignore its old code.
  if (input.startsWith('+') || input.startsWith('00')) {
    const { localNumber } = stripCallingCode(input);
    // stripCallingCode returns "+digits" when dial unknown; handle that.
    const national = localNumber.startsWith('+') ? localNumber.slice(1).replace(/\D/g, '') : localNumber;
    return `${code}${national.replace(/^0+/, '')}`;
  }
  let digits = input.replace(/\D/g, '');
  digits = digits.replace(/^0+/, '');
  // Dedupe "9191..." typed on top of auto prefix (needs 7+ digit remainder).
  if (codeDigits && digits.startsWith(codeDigits) && digits.length >= codeDigits.length + 7) {
    const rest = digits.slice(codeDigits.length);
    // For 10-digit NANP-style plans avoid stripping legit leading digits;
    // the length guard above keeps this safe for IN (+91) and similar.
    digits = rest.replace(/^0+/, '');
  }
  return `${code}${digits}`;
}

/** Safe `tel:` URI without spaces or doubled codes. */
export function toTelUri(fullNumber: string): string {
  if (!fullNumber) return '';
  const { code, localNumber } = stripCallingCode(fullNumber);
  if (code) return `tel:${code}${localNumber}`.replace(/\s/g, '');
  const digits = (fullNumber || '').replace(/\D/g, '');
  if (!digits) return '';
  return `tel:+${digits}`;
}

/** Digits-only number for wa.me / whatsapp://send?phone=. */
export function toWhatsAppDigits(fullNumber: string): string {
  if (!fullNumber) return '';
  const { code, localNumber } = stripCallingCode(fullNumber);
  if (code) return `${code}${localNumber}`.replace(/\D/g, '');
  return (fullNumber || '').replace(/\D/g, '');
}
