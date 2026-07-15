import { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationBar } from 'expo-navigation-bar';

import { ThemeProvider, useThemePreference } from '@/hooks/use-theme';
import { RBACProvider } from '@/hooks/use-rbac';
import { Colors, DarkColors } from '@/constants/theme';
import '@/utils/preload-countries';

SplashScreen.preventAutoHideAsync();

function RootLayoutInner() {
  const { isDark } = useThemePreference();
  const bg = isDark ? DarkColors.background : Colors.background;

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setStyle(isDark ? 'light' : 'dark');
    }
  }, [isDark]);

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={bg}
        translucent={Platform.OS === 'android'}
      />
      <Stack screenOptions={{
        headerShown: false,
        animation: 'none',
        contentStyle: { backgroundColor: bg },
      }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/signup" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <RBACProvider>
      <ThemeProvider>
        <RootLayoutInner />
      </ThemeProvider>
    </RBACProvider>
  );
}
