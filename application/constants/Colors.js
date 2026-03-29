/**
 * WORKSHOP BLUE THEME - Expo Application Colors
 * Inspired by mechanic workwear — navy coveralls, steel blue panels,
 * grease-worn denim, oil-stained concrete floors, and chrome highlights.
 */

const lightTheme = {
  background: '#F4F6F8', // oklch(0.96 0.008 240)
  foreground: '#1D212A', // oklch(0.15 0.025 240)
  card: '#F8FAFC',
  cardForeground: '#1D212A',
  popover: '#F8FAFC',
  popoverForeground: '#1D212A',
  primary: '#163C63', // oklch(0.38 0.13 248) - coverall blue
  primaryForeground: '#F5F8FA',
  secondary: '#DFE4E9',
  secondaryForeground: '#2B3138',
  muted: '#E7EAEE',
  mutedForeground: '#747D8C',
  accent: '#4E88BA', // oklch(0.62 0.12 235) - steel blue
  accentForeground: '#F8FAFC',
  destructive: '#AF3E1D',
  border: '#CED4DA',
  input: '#D8DDE2',
  ring: '#4E88BA',
  sidebar: '#2A303A',
  sidebarForeground: '#EFF2F5',
};

const darkTheme = {
  background: '#131922', // oklch(0.13 0.03 248)
  foreground: '#EFF2F5', // oklch(0.93 0.012 225)
  card: '#1B212D',
  cardForeground: '#EFF2F5',
  popover: '#1B212D',
  popoverForeground: '#EFF2F5',
  primary: '#5B87CD', // oklch(0.58 0.175 248) - electric blue
  primaryForeground: '#F5F8FA',
  secondary: '#2A303A',
  secondaryForeground: '#EFF2F5',
  muted: '#2A303A',
  mutedForeground: '#8E9AAB',
  accent: '#3D71A8', // oklch(0.50 0.13 240) - chrome
  accentForeground: '#F5F8FA',
  destructive: '#B9442C',
  border: 'rgba(255, 255, 255, 0.1)',
  input: 'rgba(255, 255, 255, 0.14)',
  ring: '#5B87CD',
  sidebar: '#161C24',
  sidebarForeground: '#EFF2F5',
};

export const Colors = {
  light: lightTheme,
  dark: darkTheme,
};
