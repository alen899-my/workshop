import { useCallback, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import AppButton from '@/components/AppButton';

import LandingScreen from '@/features/landing/LandingScreen';
import { useTheme } from '@/hooks/use-theme';
import { router, useFocusEffect } from 'expo-router';
import { authService } from '@/services/auth.service';

export default function HomeScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const checkSession = async () => {
        setLoading(true);
        setError('');
        try {
          const authenticated = await authService.restoreSession();
          if (cancelled) return;
          if (authenticated) {
            router.replace('/(tabs)');
            return;
          }
        } catch (err) {
          if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to verify your session');
        }
        if (!cancelled) setLoading(false);
      };
      void checkSession();
      return () => { cancelled = true; };
      // Changing attempt deliberately reruns the focus check after a network error.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attempt]),
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error) return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 16, backgroundColor: theme.background }}>
      <Text style={{ color: theme.text }}>{error}</Text>
      <AppButton title="Try again" variant="green" onPress={() => setAttempt((value) => value + 1)} />
    </View>
  );
  return <LandingScreen />;
}
