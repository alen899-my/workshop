import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

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
  destructive: { icon: 'trash-outline' as const },
  warning: { icon: 'alert-circle-outline' as const },
  info: { icon: 'information-circle-outline' as const },
  success: { icon: 'checkmark-circle-outline' as const },
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
  const theme = useTheme();
  const styles = useStyles(theme);

  const typeColor = type === 'destructive' ? theme.error : type === 'warning' ? theme.warning : type === 'success' ? theme.success : theme.info;
  const typeBg = typeColor + '15';
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
          <View style={[styles.iconWrap, { backgroundColor: typeBg }]}>
            <Ionicons name={config.icon} size={28} color={typeColor} />
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
                { backgroundColor: typeColor },
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

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  const styles = useMemo(() => StyleSheet.create({
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
      backgroundColor: theme.card,
      borderRadius: 24,
      padding: Spacing.four,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 18,
      elevation: 10,
      borderWidth: 1,
      borderColor: theme.border,
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
      color: theme.text,
      textAlign: 'center',
      marginBottom: Spacing.two,
    },
    message: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.textSecondary,
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
      backgroundColor: theme.backgroundElement,
      borderWidth: 1.5,
      borderColor: theme.border,
    },
    btnPressed: {
      opacity: 0.85,
    },
    btnCancelText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },
    btnConfirmText: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.textInverse,
    },
  }), [theme]);
  return styles;
};
