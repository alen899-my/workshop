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

    // ── backgrounds
    bg:         c.background,
    surface:    c.card,
    surfaceAlt: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',

    // ── borders
    border:       c.border,
    borderStrong: isDark ? 'rgba(255,255,255,0.18)' : '#CBD5E1',

    // ── brand
    primary:      c.primary,
    primaryLight: isDark ? 'rgba(91,135,205,0.18)' : '#EBF1F8',
    primaryText:  c.primaryForeground,

    // ── text
    text:       c.foreground,
    textMuted:  c.mutedForeground,
    textFaint:  isDark ? 'rgba(255,255,255,0.28)' : '#94A3B8',

    // ── semantic
    success:       '#16A34A',
    successBg:     isDark ? 'rgba(22,163,74,0.15)'  : '#F0FDF4',
    successBorder: isDark ? 'rgba(22,163,74,0.35)'  : '#BBF7D0',

    danger:       '#DC2626',
    dangerBg:     isDark ? 'rgba(220,38,38,0.15)'   : '#FEF2F2',
    dangerBorder: isDark ? 'rgba(220,38,38,0.35)'   : '#FECACA',

    warning:      '#D97706',
    warningBg:    isDark ? 'rgba(217,119,6,0.15)'   : '#FFFBEB',
    warningBorder:isDark ? 'rgba(217,119,6,0.35)'   : '#FDE68A',

    // ── misc
    rowHover: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',

    // ── typography
    font:     FONT,
    fontMono: FONT,

    // ── radii
    radius:   10,
    radiusSm: 7,
    radiusLg: 16,

    // ── shadows (subtle in dark mode)
    shadow: isDark ? {} : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    shadowMd: isDark ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },

    // ── tab / nav bar
    tabBarBg:     isDark ? '#161C24' : '#FFFFFF',
    tabBarBorder: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
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
