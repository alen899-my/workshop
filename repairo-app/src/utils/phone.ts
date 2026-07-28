import { countriesCache, waitForCountries } from './preload-countries';

export function stripCallingCode(fullNumber: string): { code: string; localNumber: string } {
  if (!fullNumber) return { code: '', localNumber: '' };
  const trimmed = fullNumber.trim();
  if (!trimmed.startsWith('+')) return { code: '', localNumber: trimmed };
  if (countriesCache) {
    const entries = Object.entries(countriesCache) as any[];
    const sorted = entries
      .filter(([_, c]: any) => c.callingCode?.[0])
      .sort(([_, a]: any, [__, b]: any) => (b.callingCode[0].length) - (a.callingCode[0].length));
    for (const [_, country] of sorted) {
      const code = `+${country.callingCode[0]}`;
      if (trimmed.startsWith(code)) {
        return { code, localNumber: trimmed.slice(code.length) };
      }
    }
  }
  return { code: '+', localNumber: trimmed };
}

export function formatPhoneForDisplay(fullNumber: string): string {
  const { code, localNumber } = stripCallingCode(fullNumber);
  if (!code && !localNumber) return '';
  if (!code) return localNumber;
  return `${code} ${localNumber}`;
}
