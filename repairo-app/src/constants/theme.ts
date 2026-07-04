/**
 * Repairo Theme — light cream + green palette only.
 *
 * Token              Hex         Usage
 * ─────────────────────────────────────────────
 * bg-primary         #FAF6EE     App background
 * bg-card-dark       #1A1A1A     Balance/dark cards
 * bg-card-light      #FFFFFF     Elevated cards on cream
 * accent-primary     #8CE64B     CTAs, active states
 * text-primary       #1A1A1A     Headings
 * text-secondary     #8A8A80     Subtext
 * text-inverse       #FFFFFF     Text on dark cards
 * accent-gold        #F2C230     Rewards/coins
 * border-subtle      #E8E0CC     Card outlines
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  text: '#1A1A1A',
  textSecondary: '#8A8A80',
  textInverse: '#FFFFFF',
  background: '#FAF6EE',
  backgroundElement: '#F3EDDD',
  backgroundSelected: '#E8E0CC',
  card: '#FFFFFF',
  cardDark: '#1A1A1A',
  primary: '#3D7A78',
  primaryForeground: '#FFFFFF',
  accent: '#F2C230',
  accentForeground: '#1A1A1A',
  border: '#E8E0CC',
  tabIconDefault: '#B0AA97',
  tabIconSelected: '#3D7A78',
  destructive: '#E5544D',
  gold: '#F2C230',
  success: '#5FB84A',
  warning: '#F2C230',
  error: '#E5544D',
  info: '#5FA8D3',
  greenTint: '#DCF2C8',
  pink: '#F2A6C4',
  blue: '#5FA8D3',
  purple: '#B399D4',
  divider: '#D9D2BC',
  dark: '#1A1A1A',
  nearBlack: '#0F0F0F',
  greenMid: '#5FB84A',
  greenDeep: '#2E5C2E',
  mutedDark: '#B8B8B0',
  borderDark: '#2E2E2E',
  floatingBar: '#FDF8E1',
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
