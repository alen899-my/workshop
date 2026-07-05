import { useMemo } from 'react';
import { getCurrentUser } from '@/services/auth.service';

// ISO 4217 code → symbol mapping
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
};

export function getCurrencySymbol(code?: string | null): string {
  if (!code) return '₹';
  return CURRENCY_SYMBOLS[code.toUpperCase()] ?? code;
}

/** Returns the current shop's currency symbol (e.g. ₹, $, £) */
export function useCurrency(): string {
  const symbol = useMemo(() => {
    const user = getCurrentUser();
    return getCurrencySymbol(user?.shopCurrency);
  }, []);
  return symbol;
}
