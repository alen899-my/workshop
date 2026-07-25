import { useMemo } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { Tax } from '@/features/repairs/services/tax.service';

interface TaxCardProps {
  tax: Tax;
  onEdit?: (tax: Tax) => void;
  onToggle?: (tax: Tax) => void;
  onDelete?: (tax: Tax) => void;
}

const APPLIES_TO_LABELS: Record<string, string> = {
  all: 'Everything',
  parts: 'Parts',
  service: 'Labor',
};

export default function TaxCard({ tax, onEdit, onToggle, onDelete }: TaxCardProps) {
  const theme = useTheme();
  const styles = useStyles(theme);
  const isActive = tax.is_active;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => onEdit?.(tax)}
      onLongPress={() => onDelete?.(tax)}
      delayLongPress={400}
    >
      <View style={styles.info}>
        <View style={styles.topRow}>
          <ThemedText style={styles.name} numberOfLines={1}>{tax.name}</ThemedText>
          <ThemedText style={[styles.rateBadge, { color: theme.textSecondary }]}>{tax.rate}%</ThemedText>
          <ThemedText style={[styles.statusLabel, { color: isActive ? theme.success : theme.textSecondary }]}>
            {isActive ? 'Live' : 'Off'}
          </ThemedText>
        </View>

        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: tax.is_inclusive ? theme.info + '18' : theme.warning + '18' }]}>
            <Ionicons
              name={tax.is_inclusive ? 'layers-outline' : 'add-outline'}
              size={11}
              color={tax.is_inclusive ? theme.info : theme.warning}
            />
            <ThemedText style={[styles.badgeText, { color: tax.is_inclusive ? theme.info : theme.warning }]}>
              {tax.is_inclusive ? 'Included' : 'Extra'}
            </ThemedText>
          </View>
          <View style={[styles.badge, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText style={[styles.badgeText, { color: theme.textSecondary }]}>
              {APPLIES_TO_LABELS[tax.applies_to] || tax.applies_to}
            </ThemedText>
          </View>
        </View>

        {tax.description ? (
          <ThemedText style={styles.description} numberOfLines={1}>{tax.description}</ThemedText>
        ) : null}
      </View>

      <Switch
        value={isActive}
        onValueChange={() => onToggle?.(tax)}
        trackColor={{ false: theme.border, true: theme.primary }}
        thumbColor={isActive ? theme.card : '#f4f3f4'}
        ios_backgroundColor={theme.border}
      />
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
      gap: 10,
    },
    pressed: { opacity: 0.85 },
    info: {
      flex: 1,
      gap: 4,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    name: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
      flexShrink: 1,
    },
    rateBadge: {
      fontSize: 13,
      fontWeight: '600',
    },
    statusLabel: {
      fontSize: 11,
      fontWeight: '600',
    },
    badges: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    description: {
      fontSize: 12,
      fontWeight: '400',
      color: theme.textSecondary,
      fontStyle: 'italic',
    },
  }), [theme]);
};
