import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Appearance, Platform } from 'react-native';

import { Colors, type ThemeColors } from '@/constants/theme';
import { getCurrentUser } from '@/services/auth.service';

type ThemePreference = 'light';
type ResolvedTheme = 'light';

interface ThemeContextType {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  shopPrimaryColor: string | null;
  setShopPrimaryColor: (color: string | null) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  resolvedTheme: 'light',
  isDark: false,
  shopPrimaryColor: null,
  setShopPrimaryColor: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = 'light' as const;
  const resolvedTheme = 'light' as const;
  const [shopPrimaryColor, setShopPrimaryColorState] = useState<string | null>(null);

  // Preserve the workshop color while always using light mode.
  useEffect(() => {
    const user = getCurrentUser();
    if (user?.shopPrimaryColor) {
      setShopPrimaryColorState(user.shopPrimaryColor);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') Appearance.setColorScheme('light');
  }, []);

  // Match browser-native controls and CSS to the app selection, not only the OS.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const palette = Colors;
    const root = document.documentElement;
    root.style.colorScheme = resolvedTheme;
    const css = { background: palette.background, foreground: palette.text, primary: palette.primary, card: palette.card, border: palette.border, muted: palette.textSecondary };
    Object.entries(css).forEach(([key, value]) => root.style.setProperty('--color-' + key, value));
  }, [resolvedTheme]);

  const setShopPrimaryColor = useCallback((color: string | null) => {
    setShopPrimaryColorState(color);
  }, []);

  const contextValue = useMemo(() => ({
    theme,
    resolvedTheme,
    isDark: false,
    shopPrimaryColor,
    setShopPrimaryColor,
  }), [theme, resolvedTheme, shopPrimaryColor, setShopPrimaryColor]);

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

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const linear = (value: number) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function contrast(a: string, b: string) {
  const first = luminance(a), second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

export function getContrastColor(background: string): string {
  return contrast(background, '#181A24') > contrast(background, '#FFFFFF') ? '#181A24' : '#FFFFFF';
}

export function useTheme(): ThemeColors {
  const { shopPrimaryColor } = useContext(ThemeContext);
  const base = Colors;

  return useMemo(() => {
    if (!shopPrimaryColor || !/^#[0-9a-f]{6}$/i.test(shopPrimaryColor)) return base;

    let primary = shopPrimaryColor;
    // The accent also serves as text and icons on surfaces.
    for (let step = 0; step < 20 && Math.min(contrast(primary, base.background), contrast(primary, base.card), contrast(primary, base.backgroundElement)) < 4.5; step++) {
      primary = darken(primary, 0.12);
    }
    const primaryLight = lighten(primary, 0.9);
    const primaryForeground = getContrastColor(primary);
    const tealMid = primary;
    const tealDeep = darken(primary, 0.15);
    const tealAccent = primary;
    const tabIconSelected = primary;

    return {
      ...base,
      primary,
      primaryLight,
      primaryForeground,
      tealAccentForeground: primaryForeground,
      tealMid,
      tealDeep,
      tealAccent,
      tabIconSelected,
    };
  }, [base, shopPrimaryColor]) as ThemeColors;
}

export function useThemePreference() {
  return useContext(ThemeContext);
}
