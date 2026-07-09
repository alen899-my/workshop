/**
 * Repairo Theme — Vercel/ShadCN-inspired white + black + teal.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  text: '#09090B',
  textSecondary: '#71717A',
  textInverse: '#FFFFFF',
  background: '#FFFFFF',
  backgroundElement: '#FAFAFA',
  backgroundSelected: '#F4F4F5',
  card: '#FFFFFF',
  cardDark: '#F4F4F5',
  primary: '#0D9488',
  primaryLight: '#CCFBF1',
  primaryForeground: '#FFFFFF',
  accent: '#F2C230',
  accentForeground: '#09090B',
  border: '#E4E4E7',
  tabIconDefault: '#A1A1AA',
  tabIconSelected: '#0D9488',
  destructive: '#EF4444',
  gold: '#F2C230',
  success: '#0D9488',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#0D9488',
  tealTint: '#CCFBF1',
  divider: '#E4E4E7',
  dark: '#09090B',
  nearBlack: '#0A0A0A',
  tealMid: '#14B8A6',
  tealDeep: '#115E59',
  mutedDark: '#A1A1AA',
  borderDark: '#27272A',
  floatingBar: '#FFFFFF',
  priorityHigh: '#EF4444',
  priorityMedium: '#F59E0B',
  priorityLow: '#0D9488',
  tealAccent: '#14B8A6',
  tealAccentForeground: '#09090B',
  cardElevated: '#FFFFFF',
  surface: '#FFFFFF',
} as const;

export const DarkColors = {
  text: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textInverse: '#0A0A0A',
  background: '#000000',
  backgroundElement: '#09090B',
  backgroundSelected: '#1A1A1A',
  card: '#0A0A0A',
  cardDark: '#000000',
  primary: '#2DD4BF',
  primaryLight: '#134E4A',
  primaryForeground: '#0A0A0A',
  accent: '#F2C230',
  accentForeground: '#0A0A0A',
  border: '#27272A',
  tabIconDefault: '#52525B',
  tabIconSelected: '#2DD4BF',
  destructive: '#EF4444',
  gold: '#F2C230',
  success: '#2DD4BF',
  warning: '#FBBF24',
  error: '#EF4444',
  info: '#2DD4BF',
  tealTint: '#134E4A',
  divider: '#27272A',
  dark: '#0A0A0A',
  nearBlack: '#09090B',
  tealMid: '#14B8A6',
  tealDeep: '#115E59',
  mutedDark: '#52525B',
  borderDark: '#3B3B3B',
  floatingBar: '#000000',
  priorityHigh: '#EF4444',
  priorityMedium: '#FBBF24',
  priorityLow: '#2DD4BF',
  tealAccent: '#2DD4BF',
  tealAccentForeground: '#0A0A0A',
  cardElevated: '#141414',
  surface: '#000000',
} as const;

export type ThemeColor = keyof typeof Colors;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 800;
