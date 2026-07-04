import { Dimensions, StyleSheet, Text, View, Platform } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';

import AppButton from '@/components/AppButton';
import { Colors } from '@/constants/theme';

export default function LandingScreen() {
  const player = useVideoPlayer(require('@/assets/bgvideo.mp4'), (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <View style={styles.container}>
      {/* Layer 1: Video */}
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Layer 2: Glassmorphism overlay (full screen) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'rgba(0,0,0,0.35)']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Layer 3: Bottom card — full width, flush to bottom */}
      <View style={styles.bottomCard}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 80 : 99}
          tint="light"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.glassTint} pointerEvents="none" />
        <LinearGradient
          colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.02)']}
          style={styles.glassSheen}
          pointerEvents="none"
        />

        <View style={styles.inner}>
          <Text style={styles.wordmark}>REPAIRO</Text>
          <Text style={styles.tagline}>Complete solution for your garage</Text>

          <View style={styles.ctaSection}>
            <AppButton
              title="LOG IN"
              variant="green"
              fullWidth
              onPress={() => router.push('/auth/login' as any)}
            />
            <AppButton
              title="CREATE ACCOUNT"
              variant="black"
              fullWidth
              onPress={() => router.push('/auth/signup' as any)}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  video: {
    width,
    height,
  },

  bottomCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    overflow: 'hidden',
    backgroundColor: Platform.select({
      android: 'rgba(255,255,255,0.92)',
      default: 'transparent',
    }),
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  glassTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
  },
  glassSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
  },

  inner: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
  },
  wordmark: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 6,
    color: Colors.dark,
    textAlign: 'center',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 36,
    letterSpacing: 1.2,
  },
  ctaSection: {
    gap: 14,
  },
});
