import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';

interface SuccessModalAction {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void | Promise<void>;
  primary?: boolean;
  loading?: boolean;
}

interface SuccessModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  actionButtons?: SuccessModalAction[];
}

export default function SuccessModal({
  visible,
  onClose,
  title = 'Success!',
  subtitle = 'Job card created successfully',
  actionButtons,
}: SuccessModalProps) {
  const bgOpacity = useSharedValue(0);
  const circleScale = useSharedValue(0);
  const checkScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      bgOpacity.value = withTiming(1, { duration: 250 });
      circleScale.value = withSpring(1, { damping: 10, stiffness: 100 });
      checkScale.value = withDelay(350, withSpring(1, { damping: 8, stiffness: 120 }));
    } else {
      bgOpacity.value = 0;
      circleScale.value = 0;
      checkScale.value = 0;
    }
  }, [visible]);

  const handleDismiss = () => {
    bgOpacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  };

  const rBg = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));
  const rCircle = useAnimatedStyle(() => ({ transform: [{ scale: circleScale.value }] }));
  const rCheck = useAnimatedStyle(() => ({ transform: [{ scale: checkScale.value }] }));

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleDismiss}>
      <View style={styles.fullscreen}>
        <Animated.View style={[styles.backdrop, rBg]}>
          <Pressable style={styles.flex} onPress={handleDismiss} />
        </Animated.View>

        <Animated.View style={[styles.card, rCircle]}>
          <View style={styles.circle}>
            <Animated.View style={rCheck}>
              <Ionicons name="checkmark" size={44} color="#FFFFFF" />
            </Animated.View>
          </View>

          <View style={styles.details}>
            <ThemedText style={styles.title}>{title}</ThemedText>
            <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
          </View>

          <View style={styles.btnContainer}>
            {actionButtons && actionButtons.length > 0 ? (
              <View style={styles.actionButtonsCol}>
                {actionButtons.map((btn, index) => (
                  <Pressable
                    key={index}
                    onPress={btn.onPress}
                    disabled={btn.loading}
                    style={({ pressed }) => [
                      btn.primary !== false ? styles.primaryBtn : styles.secondaryBtn,
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <View style={styles.btnContent}>
                      <Ionicons name={btn.icon} size={18} color={btn.primary !== false ? '#FFFFFF' : '#0D9488'} />
                      <ThemedText style={btn.primary !== false ? styles.primaryText : styles.secondaryText}>
                        {btn.label}
                      </ThemedText>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Pressable onPress={handleDismiss} style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.8 }]}>
                <ThemedText style={styles.doneText}>Done</ThemedText>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 23, 0.65)',
  },
  card: {
    width: '82%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    alignItems: 'center',
    marginTop: 20,
    gap: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8A8A80',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  btnContainer: {
    marginTop: 24,
    width: '100%',
  },
  doneBtn: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionButtonsCol: {
    width: '100%',
    gap: 10,
  },
  primaryBtn: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0D9488',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryText: {
    color: '#0D9488',
    fontSize: 14,
    fontWeight: '700',
  },
});
