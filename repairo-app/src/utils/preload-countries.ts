import { FlagType, getAllCountries } from 'react-native-country-picker-modal';

// Module-level cache & promise — starts loading on first import
let cache: Record<string, any> | null = null;
let resolved = false;
const promise = getAllCountries(FlagType.EMOJI).then((map) => {
  cache = map;
  resolved = true;
}).catch((err) => {
  console.error('preload-countries error:', err);
});

// Static fallback so we never show an empty code even before the async cache loads
const FALLBACK_CODES: Record<string, string> = {
  IN: '+91', US: '+1', GB: '+44', AE: '+971', SA: '+966',
  QA: '+974', KW: '+965', OM: '+968', BH: '+973', MY: '+60',
  SG: '+65', LK: '+94', BD: '+880', NP: '+977', PK: '+92',
  AF: '+93', AU: '+61', NZ: '+64', CA: '+1', CH: '+41',
  SE: '+46', NO: '+47', DK: '+45', JP: '+81', KR: '+82',
  CN: '+86', BR: '+55', ZA: '+27', NG: '+234', KE: '+254',
  EG: '+20', TR: '+90', RU: '+7', TH: '+66', VN: '+84',
  PH: '+63', ID: '+62', DE: '+49', FR: '+33', IT: '+39',
  ES: '+34', PT: '+351', NL: '+31', BE: '+32', AT: '+43',
};

/** Synchronous lookup — falls back to static map if cache not ready */
export function getCallingCode(cca2: string): string {
  return cache?.[cca2]?.callingCode?.[0] ? `+${cache[cca2].callingCode[0]}` : FALLBACK_CODES[cca2] || '';
}

/** Synchronous lookup */
export function getCurrency(cca2: string): string {
  return cache?.[cca2]?.currency?.[0] ?? 'USD';
}

/** Synchronous lookup – returns the common name or empty string if cache not ready */
export function getCountryName(cca2: string): string {
  if (!cca2) return '';
  const c = cache?.[cca2];
  if (c) return typeof c.name === 'string' ? c.name : c.name?.common ?? '';
  return '';
}

/** True once country data is cached */
export function isCountriesReady(): boolean {
  return resolved;
}

/** Await this if you need the data asynchronously */
export function waitForCountries(): Promise<void> {
  return promise;
}

export { cache as countriesCache };
