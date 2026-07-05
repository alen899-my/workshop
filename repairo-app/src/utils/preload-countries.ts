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

/** Synchronous lookup — returns '' if cache not ready */
export function getCallingCode(cca2: string): string {
  return cache?.[cca2]?.callingCode?.[0] ? `+${cache[cca2].callingCode[0]}` : '';
}

/** Synchronous lookup */
export function getCurrency(cca2: string): string {
  return cache?.[cca2]?.currency?.[0] ?? 'USD';
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
