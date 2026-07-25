import { useCallback, useMemo } from 'react';
import { getCurrentUser } from '@/services/auth.service';

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  GBP: '£',
  EUR: '€',
  AED: 'د.إ',
  SAR: '﷼',
  QAR: '﷼',
  KWD: 'KD',
  OMR: 'OMR',
  BHD: 'BD',
  MYR: 'RM',
  SGD: 'S$',
  LKR: 'Rs',
  BDT: '৳',
  NPR: 'रू',
  PKR: '₨',
  AFN: '؋',
  AUD: 'A$',
  NZD: 'NZ$',
  CAD: 'CA$',
  CHF: 'CHF',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  JPY: '¥',
  KRW: '₩',
  CNY: '¥',
  BRL: 'R$',
  ZAR: 'R',
  NGN: '₦',
  KES: 'KSh',
  EGP: 'E£',
  TRY: '₺',
  RUB: '₽',
  THB: '฿',
  VND: '₫',
  IDR: 'Rp',
  PHP: '₱',
  MXN: 'MX$',
  ARS: '$',
  CLP: '$',
  COP: '$',
  PEN: 'S/',
  HKD: 'HK$',
  TWD: 'NT$',
  ILS: '₪',
  PLN: 'zł',
  CZK: 'Kč',
  HUF: 'Ft',
  RON: 'lei',
  BGN: 'лв',
  ISK: 'kr',
  UAH: '₴',
  GHS: '₵',
  TZS: 'TSh',
  UGX: 'USh',
  MAD: 'د.م.',
  DZD: 'د.ج',
  TND: 'د.ت',
  JOD: 'د.ا',
  IQD: 'ع.د',
  IRR: '﷼',
  MVR: 'ރ.',
  ETB: 'ብር',
  BOB: 'Bs.',
  PYG: '₲',
  UYU: '$U',
  CRC: '₡',
  DOP: 'RD$',
  GTQ: 'Q',
  PAB: 'B/.',
  MNT: '₮',
  KHR: '៛',
  LAK: '₭',
  MMK: 'K',
  BND: 'B$',
  FJD: 'FJ$',
  PGK: 'K',
  MOP: 'MOP$',
  XPF: 'F',
};

export function getCurrencySymbol(code?: string | null): string {
  if (!code) return '₹';
  return CURRENCY_SYMBOLS[code.toUpperCase()] ?? code;
}

export function formatCurrency(amount: number, code?: string | null): string {
  const currencyCode = code || 'INR';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function useCurrency(user?: { shopCurrency?: string } | null) {
  const u = user ?? getCurrentUser();
  const currencyCode = u?.shopCurrency || 'INR';
  const symbol = getCurrencySymbol(currencyCode);
  const format = useCallback((amount: number) => {
    return formatCurrency(amount, currencyCode);
  }, [currencyCode]);
  return useMemo(() => ({ currencyCode, symbol, format }), [currencyCode, symbol, format]);
}
