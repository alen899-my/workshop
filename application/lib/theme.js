import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Colors } from '../constants/Colors';

const STORAGE_KEY = 'workshop_theme';
const FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

/** Build a flat design-token object from the Colors palette. */
function buildTheme(isDark) {
  const c = isDark ? Colors.dark : Colors.light;
  return {
    isDark,

    // ── backgrounds ────────────────────────────────────────────────────────
    bg:         c.background,   // light: #FAFDFE  dark: #000000
    surface:    c.card,         // light: #FFFFFF  dark: #0D0D0D
    surfaceAlt: c.sidebar,      // light: #F2FAF9 (teal-white)  dark: #000000

    // ── borders ─────────────────────────────────────────────────────────────
    border:       c.border,     // light: #DAEAEC  dark: #262626
    borderStrong: c.ring,       // light: #5F9899  dark: #3D7A78

    // ── brand ───────────────────────────────────────────────────────────────
    primary:      c.primary,         // light: #3D7A78 (teal facade)   dark: #37BFBA (glowing teal)
    primaryLight: isDark
      ? 'rgba(55,191,186,0.15)'      // subtle glow tint in dark
      : '#D6EFEE',                   // soft teal tint in light
    primaryText:  c.primaryForeground, // light: #EBF5F5  dark: #0D0D0D

    // ── accent ──────────────────────────────────────────────────────────────
    accent:      c.accent,           // light: #7AB4CC (sky blue door)  dark: #4DD4CF (bright teal)
    secondary:   c.secondary,        // light: #8FB8A8 (sage wall)      dark: #1E1E1E

    // ── text ────────────────────────────────────────────────────────────────
    text:       c.foreground,        // light: #0F2321  dark: #FAFAFA
    textMuted:  c.mutedForeground,   // light: #6B8585  dark: #A3A3A3
    textFaint:  isDark ? 'rgba(255,255,255,0.28)' : '#92AAAA',

    // ── destructive ──────────────────────────────────────────────────────────
    destructive: c.destructive,      // light: #C0272D (signal red)  dark: #CF4534

    // ── semantic ─────────────────────────────────────────────────────────────
    success:       '#16A34A',
    successBg:     isDark ? 'rgba(22,163,74,0.15)'  : '#F0FDF4',
    successBorder: isDark ? 'rgba(22,163,74,0.35)'  : '#BBF7D0',

    danger:       c.destructive,
    dangerBg:     isDark ? 'rgba(207,69,52,0.15)'   : '#FEF2F2',
    dangerBorder: isDark ? 'rgba(207,69,52,0.35)'   : '#FECACA',

    warning:      c.chart4,          // #D4A017 – amber lift post
    warningBg:    isDark ? 'rgba(212,160,23,0.15)'  : '#FFFBEB',
    warningBorder:isDark ? 'rgba(212,160,23,0.35)'  : '#FDE68A',

    // ── misc ────────────────────────────────────────────────────────────────
    rowHover: isDark ? 'rgba(255,255,255,0.05)' : c.muted, // #EDF0F4

    // ── typography ──────────────────────────────────────────────────────────
    // Fira Mono on web; Menlo/monospace on device (closest native equivalent)
    font:     FONT,
    fontMono: FONT,

    // ── radii (matching --radius: 5px base) ──────────────────────────────────
    radius:   5,   // base
    radiusSm: 3,
    radiusMd: 4,
    radiusLg: 7,
    radiusXl: 9,

    // ── shadows ─────────────────────────────────────────────────────────────
    shadow: isDark ? {} : {
      shadowColor: Colors.light.primary, // teal-tinted shadow
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    shadowMd: isDark ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    } : {
      shadowColor: Colors.light.primary, // teal-tinted shadow
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.10,
      shadowRadius: 8,
      elevation: 3,
    },

    // ── tab / nav bar ───────────────────────────────────────────────────────
    tabBarBg:     isDark ? '#000000'      : '#FFFFFF',
    tabBarBorder: isDark ? 'rgba(255,255,255,0.08)' : c.border, // #DAEAEC
  };
}

const ThemeContext = createContext(buildTheme(false));

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val === 'dark') setIsDark(true);
      setReady(true);
    });
  }, []);

  const toggleTheme = useCallback(async () => {
    setIsDark(prev => {
      const next = !prev;
      AsyncStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      return next;
    });
  }, []);

  if (!ready) return null; // wait for preference to load

  return (
    <ThemeContext.Provider value={{ ...buildTheme(isDark), isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Hook to access the current theme tokens + toggleTheme */
export function useTheme() {
  return useContext(ThemeContext);
}

/** Convenience: build theme outside of a component (for nav options callbacks) */
export { buildTheme };
