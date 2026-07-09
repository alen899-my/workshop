import { useCallback, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import LandingScreen from '@/features/landing/LandingScreen';
import { useTheme } from '@/hooks/use-theme';
import { router, useFocusEffect } from 'expo-router';
import { getStoredToken } from '@/services/api';
import { loadStoredUser } from '@/services/auth.service';

export default function HomeScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        try {
          // Load persisted user data first
          await loadStoredUser();
          const token = await getStoredToken();
          if (cancelled) return;
          if (token) {
            router.replace('/(tabs)');
            return;
          }
        } catch {}
        if (!cancelled) setLoading(false);
      })();
      return () => { cancelled = true; };
    }, []),
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return <LandingScreen />;
}
