/**
 * Design tokens for the light theme — mirrors the Next.js web frontend.
 */
import { Platform } from 'react-native';

export const T = {
  // Colors
  bg:             '#F4F6F8',
  surface:        '#FFFFFF',
  surfaceAlt:     '#F8FAFC',
  border:         '#E2E8F0',
  borderStrong:   '#CBD5E1',

  primary:        '#163C63',
  primaryLight:   '#EBF1F8',
  primaryText:    '#FFFFFF',

  text:           '#1D212A',
  textMuted:      '#64748B',
  textFaint:      '#94A3B8',

  success:        '#16A34A',
  successBg:      '#F0FDF4',
  successBorder:  '#BBF7D0',

  danger:         '#DC2626',
  dangerBg:       '#FEF2F2',
  dangerBorder:   '#FECACA',

  warning:        '#D97706',
  warningBg:      '#FFFBEB',

  // row hover tint
  rowHover:       '#F1F5F9',

  // Typography
  font:           Platform.OS === 'ios' ? '-apple-system' : 'sans-serif',
  fontMono:       Platform.OS === 'ios' ? 'Menlo' : 'monospace',

  // Radii
  radius:         10,
  radiusSm:       7,
  radiusLg:       16,

  // Shadows
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  shadowMd: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
};
