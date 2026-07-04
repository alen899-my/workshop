import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Colors } from '@/constants/theme';

interface Props {
  onLogin: () => void;
}

export default function RegistrationSuccess({ onLogin }: Props) {
  const theme = useTheme();
  const rotation = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
      -1,
    );
    const t = setTimeout(() => {
      checkScale.value = withSequence(
        withTiming(1.3, { duration: 300, easing: Easing.out(Easing.back(1)) }),
        withTiming(1, { duration: 200 }),
      );
      checkOpacity.value = withTiming(1, { duration: 400 });
    }, 800);
    return () => clearTimeout(t);
  }, []);

  const gearStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.animationArea}>
        {/* Gear with animated rotation */}
        <Animated.View style={[styles.gearOuter, gearStyle]}>
          <View style={[styles.gearBody, { backgroundColor: theme.primary }]}>
            <View style={[styles.gearCenter, { backgroundColor: theme.background }]} />
            {/* Teeth */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <View
                key={deg}
                style={[
                  styles.gearTooth,
                  { backgroundColor: theme.primary },
                  { transform: [{ rotate: `${deg}deg` }] },
                ]}
              />
            ))}
          </View>
        </Animated.View>

        {/* Small orbiting gear */}
        <Animated.View style={[styles.gearSmallOuter, gearStyle]}>
          <View style={[styles.gearSmallBody, { backgroundColor: theme.border }]}>
            <View style={[styles.gearSmallCenter, { backgroundColor: theme.background }]} />
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <View
                key={deg}
                style={[
                  styles.gearSmallTooth,
                  { backgroundColor: theme.border },
                  { transform: [{ rotate: `${deg}deg` }] },
                ]}
              />
            ))}
          </View>
        </Animated.View>

        {/* Checkmark */}
        <Animated.View style={[styles.checkWrap, checkStyle]}>
          <View style={[styles.checkCircle, { backgroundColor: theme.success }]}>
            <MaterialCommunityIcons name="check" size={36} color={Colors.textInverse} />
          </View>
        </Animated.View>
      </View>

      <Text style={[styles.title, { color: theme.dark }]}>Account Created!</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Your workshop is ready. Log in to get started.
      </Text>

      <Pressable style={[styles.btn, { backgroundColor: theme.primary }]} onPress={onLogin}>
        <MaterialCommunityIcons name="login" size={20} color={Colors.textInverse} />
        <Text style={[styles.btnText, { color: Colors.textInverse }]}>Log In</Text>
      </Pressable>
    </View>
  );
}

const TOOTH_W = 8;
const TOOTH_H = 14;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  animationArea: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.five,
  },
  // Main gear
  gearOuter: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearBody: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gearCenter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    zIndex: 2,
  },
  gearTooth: {
    position: 'absolute',
    width: TOOTH_W,
    height: TOOTH_H,
    borderRadius: 3,
    top: -TOOTH_H / 2 + 36,
    left: (72 - TOOTH_W) / 2,
  },
  // Small gear
  gearSmallOuter: {
    position: 'absolute',
    top: 8,
    right: 4,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearSmallBody: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gearSmallCenter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    zIndex: 2,
  },
  gearSmallTooth: {
    position: 'absolute',
    width: 5,
    height: 9,
    borderRadius: 2,
    top: -4.5 + 19,
    left: (38 - 5) / 2,
  },
  // Checkmark overlay
  checkWrap: {
    position: 'absolute',
    bottom: 4,
    right: 0,
  },
  checkCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: Spacing.five,
    lineHeight: 22,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    gap: 8,
    paddingHorizontal: 40,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
