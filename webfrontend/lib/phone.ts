import { Country } from "country-state-city";

/**
 * Mirrors repairo-app PhoneInputWithCode behavior:
 * - keeps digits only
 * - de-duplicates a doubled country dial code (e.g. "9191..." typed by user on top of the auto prefix)
 * - strips leading zeros right after the dial code (e.g. "+91098..." -> "+9198...")
 */
export function sanitizePhone(raw: string, iso2?: string): string {
  const dial =
    iso2 && iso2.length === 2
      ? Country.getCountryByCode(iso2.toUpperCase())?.phonecode?.[0] ?? ""
      : "";

  let digits = String(raw).replace(/\D/g, "");

  if (dial) {
    const doubleDial = dial + dial;
    // Only de-dupe when clearly doubled (enough digits left for a real national number)
    if (dial.length >= 2 && digits.startsWith(doubleDial) && digits.length >= doubleDial.length + 7) {
      digits = digits.slice(dial.length);
    }
    while (digits.startsWith(dial) && digits.slice(dial.length).startsWith("0")) {
      digits = dial + digits.slice(dial.length).replace(/^0+/, "");
    }
  }

  return "+" + digits;
}
