import { useCallback, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import LandingScreen from '@/features/landing/LandingScreen';
import { Colors } from '@/constants/theme';
import { router, useFocusEffect } from 'expo-router';
import { getStoredToken } from '@/services/api';
import { loadStoredUser } from '@/services/auth.service';

export default function HomeScreen() {
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <LandingScreen />;
}
