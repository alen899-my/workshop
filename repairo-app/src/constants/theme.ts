/** Repairo premium automotive system: warm ivory, vivid yellow, charcoal surfaces.
 *  Light = primary product surface. Dark = same hierarchy, inverted.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  text: '#171717',
  textSecondary: '#62635C',
  textInverse: '#FFFFFF',
  background: '#F4F2E5',
  backgroundElement: '#E4E4DD',
  backgroundSelected: '#FBEFC0',
  card: '#FFFEF6',
  cardDark: '#292929',
  primary: '#171717',
  primaryLight: '#EFEEE7',
  primaryForeground: '#FFFFFF',
  accent: '#FFD43B',
  accentPressed: '#EFC329',
  accentForeground: '#171717',
  border: '#E2E1D6',
  tabIconDefault: '#A8A29A',
  tabIconSelected: '#FFD43B',
  destructive: '#C94B45',
  gold: '#8A6D1B',
  success: '#23865A',
  successForeground: '#FFFFFF',
  errorForeground: '#FFFFFF',
  warning: '#E9A523',
  error: '#C94B45',
  info: '#52616D',
  tealTint: '#E5F1EA',
  divider: '#EAE6D9',
  dark: '#292929',
  nearBlack: '#171717',
  tealMid: '#737373',
  tealDeep: '#171717',
  mutedDark: '#6E6A5E',
  borderDark: '#363636',
  floatingBar: '#292929',
  textMuted: '#737373',
  muted: '#737373',
  priorityHigh: '#C94B45',
  priorityMedium: '#E9A523',
  priorityLow: '#23865A',
  tealAccent: '#FFD43B',
  tealAccentForeground: '#171717',
  cardElevated: '#FFFFFF',
  surface: '#FFFDF6',
  warmTint: '#FBEFC0',
  coolTint: '#EFEEE7',
  successTint: '#E5F1EA',
  heroStart: '#E4E6E8',
  heroEnd: '#FFF1B0',
  heroText: '#171717',
  heroMuted: '#6B6759',
  heroGlass: '#17171714',
  panel: '#292929',
  panelText: '#F7F5ED',
  panelMuted: '#B9B5A6',
  panelBorder: '#363636',
  canvasStart: '#E4E6E8',
  canvasEnd: '#FFF4BC',
} as const;

export const DarkColors = {
  text: '#FAF9F0',
  textSecondary: '#D0D3C2',
  textInverse: '#171715',
  background: '#252720',
  backgroundElement: '#404338',
  backgroundSelected: '#3D3413',
  card: '#34372F',
  cardDark: '#F5F3EA',
  primary: '#F5F3EA',
  primaryLight: '#2B2B24',
  primaryForeground: '#171715',
  accent: '#FFD43B',
  accentPressed: '#EFC329',
  accentForeground: '#171715',
  border: '#5B604F',
  tabIconDefault: '#8E8A7E',
  tabIconSelected: '#FFD43B',
  destructive: '#E08A84',
  gold: '#F0D079',
  success: '#5CB98A',
  successForeground: '#12291F',
  errorForeground: '#2E1414',
  warning: '#E9A523',
  error: '#E08A84',
  info: '#B6C6D0',
  tealTint: '#1E2B24',
  divider: '#4E5345',
  dark: '#292929',
  nearBlack: '#101010',
  tealMid: '#B9B5A6',
  tealDeep: '#F5F3EA',
  mutedDark: '#8E8A7E',
  borderDark: '#363636',
  floatingBar: '#23261F',
  textMuted: '#BEC3AF',
  muted: '#BEC3AF',
  priorityHigh: '#E08A84',
  priorityMedium: '#E9A523',
  priorityLow: '#5CB98A',
  tealAccent: '#FFD43B',
  tealAccentForeground: '#171715',
  cardElevated: '#42463A',
  surface: '#1F1F1B',
  warmTint: '#373213',
  coolTint: '#23231E',
  successTint: '#1E2B24',
  heroStart: '#FFE27A',
  heroEnd: '#FFD43B',
  heroText: '#171715',
  heroMuted: '#5C5733',
  heroGlass: '#17171526',
  panel: '#292C25',
  panelText: '#F5F3EA',
  panelMuted: '#CACFBD',
  panelBorder: '#515749',
  canvasStart: '#363D35',
  canvasEnd: '#50472B',
} as const;

export type ThemeColor = keyof typeof Colors;
export type ThemeColors = { [Key in ThemeColor]: string };

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

/** Type scale (px): screen 28-34, section 17-21, card 15-18, body 13-15, meta 11-13, metric 30-38. */
export const Type = {
  screenTitle: 30,
  sectionTitle: 19,
  cardTitle: 16,
  body: 14,
  meta: 12,
  metric: 34,
} as const;

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
  radius: 18,
  sheetRadius: 28,
  controlHeight: 50,
  card: { borderRadius: 24, borderWidth: 1, padding: 16 },
  cardSmallRadius: 20,
  buttonRadius: 16,
  chipRadius: 999,
  iconBox: 40,
  thumbSmall: 48,
  heroAspect: 16 / 10,
} as const;

/** Restrained shadows — flat tactile surfaces first. */
export const Shadows = {
  card: {
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  raised: {
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
} as const;
