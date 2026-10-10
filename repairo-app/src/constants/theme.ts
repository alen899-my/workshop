/** Repairo: quiet workshop neutrals with semantic status colors. */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  text: '#292824',
  textSecondary: '#706E67',
  textInverse: '#FFFFFF',
  background: '#F7F7F5',
  backgroundElement: '#F1F1EE',
  backgroundSelected: '#EAEAE6',
  card: '#FFFFFF',
  cardDark: '#292824',
  primary: '#33332F',
  primaryLight: '#EAEAE6',
  primaryForeground: '#FFFFFF',
  accent: '#A66B2B',
  accentForeground: '#FFFFFF',
  border: '#E3E3DE',
  tabIconDefault: '#77766E',
  tabIconSelected: '#292824',
  destructive: '#BA4540',
  gold: '#A66B2B',
  success: '#39745A',
  warning: '#9A651F',
  error: '#BA4540',
  info: '#4D6C88',
  tealTint: '#EAEAE6',
  divider: '#E3E3DE',
  dark: '#292824',
  nearBlack: '#22221F',
  tealMid: '#66675E',
  tealDeep: '#41463D',
  mutedDark: '#A6A69D',
  borderDark: '#3B3B36',
  floatingBar: '#FFFFFF',
  textMuted: '#77766E',
  muted: '#77766E',
  priorityHigh: '#BA4540',
  priorityMedium: '#9A651F',
  priorityLow: '#39745A',
  tealAccent: '#66675E',
  tealAccentForeground: '#FFFFFF',
  cardElevated: '#FFFFFF',
  surface: '#FFFFFF',
} as const;

export const DarkColors = {
  text: '#E9E9E3',
  textSecondary: '#ABABA1',
  textInverse: '#22221F',
  background: '#1C1D1B',
  backgroundElement: '#282925',
  backgroundSelected: '#34352F',
  card: '#242521',
  cardDark: '#E9E9E3',
  primary: '#E3E4DA',
  primaryLight: '#34352F',
  primaryForeground: '#22231F',
  accent: '#D6AA70',
  accentForeground: '#22231F',
  border: '#3A3B34',
  tabIconDefault: '#A4A69B',
  tabIconSelected: '#E3E4DA',
  destructive: '#EC8D84',
  gold: '#D6AA70',
  success: '#8CC5A6',
  warning: '#D6AA70',
  error: '#EC8D84',
  info: '#9DBAD2',
  tealTint: '#34352F',
  divider: '#3A3B34',
  dark: '#292824',
  nearBlack: '#22221F',
  tealMid: '#B6BDA8',
  tealDeep: '#BAC4AD',
  mutedDark: '#A6A69D',
  borderDark: '#3B3B36',
  floatingBar: '#242521',
  textMuted: '#A4A69B',
  muted: '#A4A69B',
  priorityHigh: '#EC8D84',
  priorityMedium: '#D6AA70',
  priorityLow: '#8CC5A6',
  tealAccent: '#B6BDA8',
  tealAccentForeground: '#22231F',
  cardElevated: '#2C2D28',
  surface: '#242521',
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

// Shared geometry for cards, fields, buttons, and sheets.
export const UI = {
  radius: 8,
  sheetRadius: 16,
  controlHeight: 48,
  card: { borderRadius: 8, borderWidth: 1, padding: 16 },
} as const;
