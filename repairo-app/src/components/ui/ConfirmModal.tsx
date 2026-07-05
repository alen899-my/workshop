import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'destructive' | 'warning' | 'info' | 'success';
}

const TYPE_CONFIG = {
  destructive: {
    icon: 'trash-outline' as const,
    color: Colors.error,
    bg: Colors.error + '15',
  },
  warning: {
    icon: 'alert-circle-outline' as const,
    color: Colors.warning,
    bg: Colors.warning + '15',
  },
  info: {
    icon: 'information-circle-outline' as const,
    color: Colors.info,
    bg: Colors.info + '15',
  },
  success: {
    icon: 'checkmark-circle-outline' as const,
    color: Colors.success,
    bg: Colors.success + '15',
  },
};

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  type = 'info',
}: ConfirmModalProps) {
  const config = TYPE_CONFIG[type];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onCancel} />
        <View style={styles.alertBox}>
          {/* Icon Wrap */}
          <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
            <Ionicons name={config.icon} size={28} color={config.color} />
          </View>

          {/* Text Content */}
          <ThemedText style={styles.title}>{title}</ThemedText>
          <ThemedText style={styles.message}>{message}</ThemedText>

          {/* Button Row */}
          <View style={styles.btnRow}>
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                styles.btnCancel,
                pressed && styles.btnPressed,
              ]}
              onPress={onCancel}
            >
              <ThemedText style={styles.btnCancelText}>{cancelLabel}</ThemedText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: config.color },
                pressed && styles.btnPressed,
              ]}
              onPress={onConfirm}
            >
              <ThemedText style={styles.btnConfirmText}>{confirmLabel}</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 15, 15, 0.65)',
  },
  alertBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: Spacing.four,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.four,
    paddingHorizontal: Spacing.one,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: {
    backgroundColor: Colors.backgroundElement,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  btnConfirmText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textInverse,
  },
});
