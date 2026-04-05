/**
 * 🔧 WORKSHOP GARAGE DESIGN TOKENS — Expo Application
 *
 * Mirrors the theme system from the web frontend's globals.css.
 * Font: Fira Mono (monospace) — falls back to Menlo / monospace on device.
 */
import { Platform } from 'react-native';
import { Colors } from './Colors';

const t = Colors.light;
const d = Colors.dark;

// Light theme design tokens
export const T = {
  // ── Colors ────────────────────────────────────────────────────────────────

  bg:               t.background,          // #FAFDFE  – snow-white
  surface:          t.card,                // #FFFFFF  – card surface
  surfaceAlt:       t.sidebar,             // #F2FAF9  – teal-white sidebar
  border:           t.border,              // #DAEAEC  – clean metal seam
  borderStrong:     t.ring,               // #5F9899  – ring teal

  primary:          t.primary,             // #3D7A78  – teal steel facade
  primaryLight:     '#D6EFEE',             //           soft teal tint
  primaryText:      t.primaryForeground,   // #EBF5F5  – pale white

  secondary:        t.secondary,           // #8FB8A8  – sage-mint wall
  accent:           t.accent,              // #7AB4CC  – sky-blue door

  text:             t.foreground,          // #0F2321  – deep teal-black
  textMuted:        t.mutedForeground,     // #6B8585  – cool-teal grey
  textFaint:        '#92AAAA',             //           even fainter teal-grey

  success:          '#16A34A',
  successBg:        '#F0FDF4',
  successBorder:    '#BBF7D0',

  danger:           t.destructive,         // #C0272D  – signal red
  dangerBg:         '#FEF2F2',
  dangerBorder:     '#FECACA',

  warning:          t.chart4,              // #D4A017  – amber post
  warningBg:        '#FFFBEB',

  rowHover:         t.muted,               // #EDF0F4  – asphalt mist

  // ── Typography ────────────────────────────────────────────────────────────
  // Fira Mono matches the web's font-family: "Fira Mono", monospace
  font:             Platform.OS === 'ios' ? 'Menlo'       : 'monospace',
  fontMono:         Platform.OS === 'ios' ? 'Menlo'       : 'monospace',

  // ── Radius (matching --radius: 0.3125rem = 5px) ───────────────────────────
  radius:           t.radiusLg,   // 5
  radiusSm:         t.radiusSm,   // 3
  radiusMd:         t.radiusMd,   // 4
  radiusLg:         t.radiusXl,   // 7
  radiusXl:         t.radius2xl,  // 9

  // ── Shadows ────────────────────────────────────────────────────────────────
  shadow: {
    shadowColor: t.primary,          // teal-tinted shadows
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  shadowMd: {
    shadowColor: t.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  shadowLg: {
    shadowColor: t.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
  },
};

// Dark theme design tokens (ready for future dark mode support)
export const DT = {
  bg:               d.background,
  surface:          d.card,
  surfaceAlt:       d.sidebar,
  border:           d.border,
  borderStrong:     d.ring,

  primary:          d.primary,
  primaryLight:     '#0A3535',
  primaryText:      d.primaryForeground,

  secondary:        d.secondary,
  accent:           d.accentForeground,

  text:             d.foreground,
  textMuted:        d.mutedForeground,
  textFaint:        '#606060',

  success:          '#22C55E',
  successBg:        '#052E16',
  successBorder:    '#166534',

  danger:           d.destructive,
  dangerBg:         '#3B0909',
  dangerBorder:     '#7F1D1D',

  warning:          d.chart4,
  warningBg:        '#3B2700',

  rowHover:         d.muted,

  font:             Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  fontMono:         Platform.OS === 'ios' ? 'Menlo' : 'monospace',

  radius:           d.radiusLg,
  radiusSm:         d.radiusSm,
  radiusMd:         d.radiusMd,
  radiusLg:         d.radiusXl,
  radiusXl:         d.radius2xl,

  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  shadowMd: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
};
