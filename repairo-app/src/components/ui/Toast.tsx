import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onHide: () => void;
}

const ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  success: 'check-circle',
  error: 'alert-circle',
  info: 'information',
};

export default function Toast({ visible, message, type = 'success', duration = 2500, onHide }: ToastProps) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const active = useRef(false);

  useEffect(() => {
    if (visible && !active.current) {
      active.current = true;
      translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.back(1)) });
      opacity.value = withTiming(1, { duration: 300 });
      setTimeout(() => {
        translateY.value = withTiming(-100, { duration: 250 });
        opacity.value = withTiming(0, { duration: 250 }, () => {
          runOnJS(onHide)();
          active.current = false;
        });
      }, duration);
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  const bgColor = type === 'success' ? Colors.success : type === 'error' ? Colors.error : Colors.dark;

  return (
    <Animated.View style={[styles.container, animStyle]}>
      <View style={[styles.toast, { backgroundColor: bgColor }]}>
        <MaterialCommunityIcons name={ICONS[type]} size={20} color={Colors.textInverse} />
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  text: {
    color: Colors.textInverse,
    fontSize: 15,
    fontWeight: '600',
  },
});
