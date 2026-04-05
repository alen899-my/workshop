/**
 * 🔧 WORKSHOP GARAGE THEME — Expo Application Colors
 *
 * Exactly mirrors the web frontend's globals.css design tokens.
 *
 * Light mode palette derived from two workshop illustrations:
 *   Image 1 (large): teal steel facade, sandy beige walls, deep garage
 *   interior, signal red roller doors, amber hydraulic lift posts.
 *   Image 2 (mobile): soft sage-mint walls, sky-blue roller door,
 *   dark brick cornice, fire-engine red truck, hazard orange crate.
 *
 * Dark mode: Pitch black base with vibrant glowing teal as primary.
 *
 * oklch → hex conversions performed manually for React Native.
 */

const lightTheme = {
  // Base — snow-white clean surfaces
  background:           '#FAFDFE', // oklch(0.99 0.003 248)
  foreground:           '#0F2321', // oklch(0.14 0.025 168) — deep garage teal-black

  // Cards — clean plaster surface
  card:                 '#FFFFFF', // oklch(1.00 0.000 0)
  cardForeground:       '#0F2321',

  // Popover
  popover:              '#FFFFFF',
  popoverForeground:    '#0F2321',

  // Primary — teal steel facade (oklch(0.48 0.072 188) ≈ #3D7A78)
  primary:              '#3D7A78',
  primaryForeground:    '#EBF5F5', // oklch(0.96 0.014 188) — pale teal-white

  // Secondary — sage-mint wall (oklch(0.74 0.058 162) ≈ #8FB8A8)
  secondary:            '#8FB8A8',
  secondaryForeground:  '#0F2321',

  // Muted — cool asphalt grey (oklch(0.94 0.008 248) ≈ #EDF0F4)
  muted:                '#EDF0F4',
  mutedForeground:      '#6B8585', // oklch(0.52 0.030 168)

  // Accent — sky blue roller door (oklch(0.72 0.075 218) ≈ #7AB4CC)
  accent:               '#7AB4CC',
  accentForeground:     '#0F2321',

  // Destructive — signal red (oklch(0.44 0.175 22) ≈ #C0272D)
  destructive:          '#C0272D',
  destructiveForeground:'#FFFFFF',

  // Borders
  border:               '#DAEAEC', // oklch(0.88 0.012 248)
  input:                '#E3ECEE', // oklch(0.91 0.010 248)
  ring:                 '#5F9899', // oklch(0.52 0.065 185)

  // Charts — teal → sage → sky → amber → hazard orange
  chart1:               '#3D7A78',
  chart2:               '#8FB8A8',
  chart3:               '#7AB4CC',
  chart4:               '#D4A017', // oklch(0.68 0.130 80) — amber lift post
  chart5:               '#D4622A', // oklch(0.60 0.145 44) — hazard orange

  // Sidebar — teal-white panel
  sidebar:              '#F2FAF9', // oklch(0.985 0.008 188)
  sidebarForeground:    '#182E2C', // oklch(0.18 0.030 168)
  sidebarPrimary:       '#3D7A78',
  sidebarAccent:        '#E0F2EF', // oklch(0.95 0.015 188)

  // Radius token (5px base, scaled variants)
  radiusBase:           5,
  radiusSm:             3,
  radiusMd:             4,
  radiusLg:             5,
  radiusXl:             7,
  radius2xl:            9,
};

const darkTheme = {
  // Pitch Black Dark Mode
  background:           '#000000',
  foreground:           '#FAFAFA',

  card:                 '#0D0D0D',
  cardForeground:       '#FAFAFA',

  popover:              '#0D0D0D',
  popoverForeground:    '#FAFAFA',

  // Primary: Vibrantly Glowing Teal (oklch(0.68 0.12 188) ≈ #37BFBA)
  primary:              '#37BFBA',
  primaryForeground:    '#0D0D0D',

  secondary:            '#1E1E1E',
  secondaryForeground:  '#E0E0E0',

  muted:                '#262626',
  mutedForeground:      '#A3A3A3',

  // Accent — dark teal for hover states
  accent:               '#122928', // oklch(0.15 0.040 188)
  accentForeground:     '#4DD4CF', // oklch(0.85 0.090 188) — bright teal text

  destructive:          '#CF4534', // oklch(0.52 0.190 20)
  destructiveForeground:'#FFFFFF',

  border:               '#262626',
  input:                '#262626',
  ring:                 '#3D7A78',

  chart1:               '#3D7A78',
  chart2:               '#66A890',
  chart3:               '#7B72D4', // oklch(0.70 0.100 280) — purple
  chart4:               '#D4A017',
  chart5:               '#D4622A',

  sidebar:              '#000000',
  sidebarForeground:    '#E0E0E0',
  sidebarPrimary:       '#37BFBA',
  sidebarAccent:        '#1A1A1A',

  radiusBase:           5,
  radiusSm:             3,
  radiusMd:             4,
  radiusLg:             5,
  radiusXl:             7,
  radius2xl:            9,
};

export const Colors = {
  light: lightTheme,
  dark:  darkTheme,
};
