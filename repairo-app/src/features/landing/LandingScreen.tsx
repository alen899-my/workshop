import { useCallback } from 'react';
import { AppState, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppButton from '@/components/AppButton';
import { MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function LandingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const player = useVideoPlayer(require('../../../assets/bgvideo.mp4'), (video) => {
    video.loop = true;
    video.muted = true;
  });
  useFocusEffect(useCallback(() => {
    player.play();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') player.play();
      else player.pause();
    });
    return () => { subscription.remove(); player.pause(); };
  }, [player]));

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <Image source={require('../../../assets/images/auth.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" />
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} playsInline pointerEvents="none" />
      <LinearGradient colors={['rgba(23,23,23,0.08)', 'rgba(23,23,23,0.45)']} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 160 }]}>
        <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.border, paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={[styles.handle, { backgroundColor: theme.accent }]} />
          <View style={styles.inner}>
            <Text style={[styles.wordmark, { color: theme.text }]}>REPAIRO</Text>
            <Text style={[styles.tagline, { color: theme.textSecondary }]}>Complete solution for your garage</Text>
            <View style={styles.actions}>
              <AppButton title="Log in" variant="green" fullWidth onPress={() => router.push('/auth/login')} />
              <AppButton title="Create account" variant="black" fullWidth onPress={() => router.push('/auth/signup')} />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'flex-end' },
  card: { borderTopLeftRadius: 36, borderTopRightRadius: 36, borderWidth: 1, paddingTop: 16 },
  handle: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 24 },
  inner: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: 24 },
  wordmark: { fontSize: 40, fontWeight: '800', letterSpacing: 4, textAlign: 'center', marginBottom: 8 },
  tagline: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 28 },
  actions: { gap: 12 },
});
