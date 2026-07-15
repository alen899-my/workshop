import { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { Customer } from '@/features/customers/services/customer.service';

interface CustomerCardProps {
  customer: Customer;
  onPress?: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
}

export default function CustomerCard({ customer, onPress }: CustomerCardProps) {
  const theme = useTheme();
  const styles = useStyles(theme);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => onPress?.(customer)}
    >
      <View style={styles.avatarWrap}>
        <Ionicons name="person-outline" size={22} color={theme.primary} />
      </View>

      <View style={styles.info}>
        <ThemedText style={styles.name} numberOfLines={1}>
          {customer.name || 'Unknown'}
        </ThemedText>
        <View style={styles.phoneRow}>
          {customer.phone && (
            <Pressable
              onPress={() => Linking.openURL(`tel:${customer.phone!.replace(/\s/g, '')}`)}
              hitSlop={8}
            >
              <Ionicons name="call" size={14} color={theme.primary} />
            </Pressable>
          )}
          <ThemedText style={styles.phone} numberOfLines={1}>
            {customer.phone || '—'}
          </ThemedText>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
    </Pressable>
  );
}

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  return useMemo(() => StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundElement,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      marginBottom: 10,
      gap: 12,
    },
    pressed: { opacity: 0.85 },
    avatarWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: {
      flex: 1,
      gap: 3,
    },
    name: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
    },
    phoneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    phone: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.textSecondary,
      flex: 1,
    },
    vehicleCount: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: theme.primary + '10',
    },
    vehicleCountText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.primary,
    },
  }), [theme]);
};
