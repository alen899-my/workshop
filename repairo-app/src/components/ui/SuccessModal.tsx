import React, { useEffect } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
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
  // Animation values
  const bgOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0);
  const circleScale = useSharedValue(0);
  const checkmarkScale = useSharedValue(0);
  const rippleScale = useSharedValue(0.5);
  const rippleOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(15);

  useEffect(() => {
    if (visible) {
      // 1. Fade in backdrop
      bgOpacity.value = withTiming(1, { duration: 300 });

      // 2. Spring up card container
      cardScale.value = withSpring(1, { damping: 15, stiffness: 100 });

      // 3. Scale up primary circle
      circleScale.value = withDelay(
        200,
        withSpring(1, { damping: 12, stiffness: 120 })
      );

      // 4. Start Google Pay ring ripple effect
      rippleOpacity.value = withDelay(400, withTiming(0.6, { duration: 100 }));
      rippleScale.value = withDelay(
        400,
        withTiming(1.6, { duration: 600 }, (finished) => {
          if (finished) {
            rippleOpacity.value = withTiming(0, { duration: 200 });
          }
        })
      );

      // 5. Pop the checkmark icon
      checkmarkScale.value = withDelay(
        500,
        withSequence(
          withSpring(1.2, { damping: 10, stiffness: 150 }),
          withSpring(1.0, { damping: 8, stiffness: 120 })
        )
      );

      // 6. Fade and slide in text info
      textOpacity.value = withDelay(700, withTiming(1, { duration: 450 }));
      textTranslateY.value = withDelay(700, withSpring(0, { damping: 12 }));

      // 7. Auto close after 3 seconds ONLY if no action buttons are present
      if (!actionButtons || actionButtons.length === 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, 3000);
        return () => clearTimeout(timer);
      }
    } else {
      // Reset values
      bgOpacity.value = 0;
      cardScale.value = 0;
      circleScale.value = 0;
      checkmarkScale.value = 0;
      rippleScale.value = 0.5;
      rippleOpacity.value = 0;
      textOpacity.value = 0;
      textTranslateY.value = 15;
    }
  }, [visible]);

  const handleDismiss = () => {
    // Fade out elements before closing
    bgOpacity.value = withTiming(0, { duration: 250 });
    cardScale.value = withTiming(0, { duration: 250 }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  };

  // Animated styles
  const rBgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  const rCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const rCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));

  const rCheckmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
  }));

  const rRippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  const rTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <View style={styles.fullscreen}>
        {/* Backdrop overlay */}
        <Animated.View style={[styles.backdrop, rBgStyle]}>
          <Pressable style={styles.flex} onPress={handleDismiss} />
        </Animated.View>

        {/* Success Card */}
        <Animated.View style={[styles.card, rCardStyle]}>
          {/* Animated Ripples */}
          <Animated.View style={[styles.ripple, rRippleStyle]} />

          {/* Icon Circle */}
          <Animated.View style={[styles.circle, rCircleStyle]}>
            <Animated.View style={rCheckmarkStyle}>
              <Ionicons name="checkmark" size={48} color="#FFFFFF" />
            </Animated.View>
          </Animated.View>

          {/* Details */}
          <Animated.View style={[styles.details, rTextStyle]}>
            <ThemedText style={styles.title}>{title}</ThemedText>
            <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
          </Animated.View>

          {/* Dynamic Action Buttons or Done Button */}
          <Animated.View style={[styles.btnContainer, rTextStyle]}>
            {actionButtons && actionButtons.length > 0 ? (
              <View style={styles.actionButtonsCol}>
                {actionButtons.map((btn, index) => {
                  const isPrimary = btn.primary !== false;
                  return (
                    <Pressable
                      key={index}
                      onPress={btn.onPress}
                      disabled={btn.loading}
                      style={({ pressed }) => [
                        isPrimary ? styles.primaryBtn : styles.secondaryBtn,
                        pressed && (isPrimary ? styles.primaryBtnPressed : styles.secondaryBtnPressed),
                        btn.loading && styles.btnDisabled,
                      ]}
                    >
                      {btn.loading ? (
                        <ActivityIndicator color={isPrimary ? '#FFFFFF' : '#3D7A78'} size="small" />
                      ) : (
                        <View style={styles.btnContent}>
                          <Ionicons name={btn.icon} size={18} color={isPrimary ? '#FFFFFF' : '#3D7A78'} />
                          <ThemedText style={isPrimary ? styles.primaryText : styles.secondaryText}>
                            {btn.label}
                          </ThemedText>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Pressable
                onPress={handleDismiss}
                style={({ pressed }) => [
                  styles.doneBtn,
                  pressed && styles.doneBtnPressed,
                ]}
              >
                <ThemedText style={styles.doneText}>Done</ThemedText>
              </Pressable>
            )}
          </Animated.View>
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
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
    overflow: 'visible',
    position: 'relative',
  },
  circle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#3D7A78', // Matching app theme green
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  ripple: {
    position: 'absolute',
    top: 36, // Centered behind the circle
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#3D7A78',
    backgroundColor: '#3D7A78' + '15',
    zIndex: 1,
  },
  details: {
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8A8A80',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  btnContainer: {
    marginTop: 28,
    width: '100%',
  },
  doneBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#3D7A78' + '10', // Light green bg for secondary feel
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#3D7A78' + '30',
  },
  doneBtnPressed: {
    backgroundColor: '#3D7A78' + '20',
  },
  doneText: {
    color: '#3D7A78',
    fontSize: 15,
    fontWeight: '700',
  },
  actionButtonsCol: {
    width: '100%',
    gap: 10,
  },
  primaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#3D7A78',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3D7A78',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  primaryBtnPressed: {
    opacity: 0.85,
  },
  secondaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#3D7A78',
  },
  secondaryBtnPressed: {
    backgroundColor: '#3D7A78' + '10',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryText: {
    color: '#3D7A78',
    fontSize: 15,
    fontWeight: '700',
  },
});
