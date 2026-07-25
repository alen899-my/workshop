import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Appearance } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { Colors, DarkColors } from '@/constants/theme';
import { getCurrentUser } from '@/services/auth.service';

const THEME_STORAGE_KEY = 'repairo_theme_preference';

type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  isDark: boolean;
  shopPrimaryColor: string | null;
  setShopPrimaryColor: (color: string | null) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
  isDark: false,
  shopPrimaryColor: null,
  setShopPrimaryColor: () => {},
});

function getSystemTheme(): ResolvedTheme {
  const scheme = Appearance.getColorScheme();
  return scheme === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [shopPrimaryColor, setShopPrimaryColorState] = useState<string | null>(null);

  // Load stored preference and primary color on mount
  useEffect(() => {
    SecureStore.getItemAsync(THEME_STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemeState(stored);
      }
    }).catch(() => {});
    const user = getCurrentUser();
    if (user?.shopPrimaryColor) {
      setShopPrimaryColorState(user.shopPrimaryColor);
    }
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

  const setShopPrimaryColor = useCallback((color: string | null) => {
    setShopPrimaryColorState(color);
  }, []);

  const contextValue = useMemo(() => ({
    theme,
    resolvedTheme,
    setTheme,
    isDark: resolvedTheme === 'dark',
    shopPrimaryColor,
    setShopPrimaryColor,
  }), [theme, resolvedTheme, setTheme, shopPrimaryColor, setShopPrimaryColor]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function lighten(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const f = (c: number) => Math.min(255, Math.round(c + (255 - c) * amount));
  return rgbToHex(f(r), f(g), f(b));
}

function darken(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const f = (c: number) => Math.max(0, Math.round(c * (1 - amount)));
  return rgbToHex(f(r), f(g), f(b));
}

export function useTheme() {
  const { resolvedTheme, shopPrimaryColor } = useContext(ThemeContext);
  const base = resolvedTheme === 'dark' ? DarkColors : Colors;

  return useMemo(() => {
    if (!shopPrimaryColor) return base;

    const primary = shopPrimaryColor;
    const primaryLight = lighten(primary, 0.85);
    const primaryForeground = '#FFFFFF';
    const success = primary;
    const info = primary;
    const tealMid = primary;
    const tealDeep = darken(primary, 0.25);
    const tealAccent = primary;
    const tabIconSelected = primary;

    return {
      ...base,
      primary,
      primaryLight,
      primaryForeground,
      success,
      info,
      tealMid,
      tealDeep,
      tealAccent,
      tabIconSelected,
    };
  }, [base, shopPrimaryColor]) as typeof Colors;
}

export function useThemePreference() {
  return useContext(ThemeContext);
}
