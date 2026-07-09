import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Appearance } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { Colors, DarkColors } from '@/constants/theme';

const THEME_STORAGE_KEY = 'repairo_theme_preference';

type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
  isDark: false,
});

function getSystemTheme(): ResolvedTheme {
  const scheme = Appearance.getColorScheme();
  return scheme === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  // Load stored preference on mount
  useEffect(() => {
    SecureStore.getItemAsync(THEME_STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemeState(stored);
      }
    }).catch(() => {});
  }, []);

  // Recompute resolved theme when preference or system theme changes
  const computeResolved = useCallback((pref: ThemePreference) => {
    return pref === 'system' ? getSystemTheme() : pref;
  }, []);

  useEffect(() => {
    setResolvedTheme(computeResolved(theme));
  }, [theme, computeResolved]);

  // Listen for system theme changes
  useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      if (theme === 'system') {
        setResolvedTheme(colorScheme === 'dark' ? 'dark' : 'light');
      }
    });
    return () => listener.remove();
  }, [theme]);

  const setTheme = useCallback((pref: ThemePreference) => {
    setThemeState(pref);
    setResolvedTheme(computeResolved(pref));
    SecureStore.setItemAsync(THEME_STORAGE_KEY, pref).catch(() => {});
  }, [computeResolved]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, isDark: resolvedTheme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const { resolvedTheme } = useContext(ThemeContext);
  return resolvedTheme === 'dark' ? DarkColors : Colors;
}

export function useThemePreference() {
  return useContext(ThemeContext);
}
