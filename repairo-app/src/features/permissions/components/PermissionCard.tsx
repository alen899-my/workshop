import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { Permission } from '@/features/permissions/services/permission.service';

interface PermissionCardProps {
  permission: Permission;
  onPress?: (permission: Permission) => void;
}

export default function PermissionCard({ permission, onPress }: PermissionCardProps) {
  const theme = useTheme();
  const styles = useStyles(theme);
  const isActive = permission.status === 'active';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => onPress?.(permission)}
    >
      <View style={[styles.iconWrap, { backgroundColor: theme.primary + '15' }]}>
        <Ionicons name="shield-checkmark-outline" size={22} color={theme.primary} />
      </View>

      <View style={styles.info}>
        <View style={styles.topRow}>
          <ThemedText style={styles.name} numberOfLines={1}>
            {permission.permission_name}
          </ThemedText>
          <View style={[styles.statusDot, { backgroundColor: isActive ? theme.success : theme.textSecondary }]} />
        </View>
        <View style={styles.moduleRow}>
          <View style={[styles.moduleBadge, { backgroundColor: theme.info + '18' }]}>
            <ThemedText style={[styles.moduleText, { color: theme.info }]}>
              {permission.module_name}
            </ThemedText>
          </View>
          <ThemedText style={styles.slug} numberOfLines={1}>
            {permission.slug}
          </ThemedText>
        </View>
        {permission.description ? (
          <ThemedText style={styles.description} numberOfLines={1}>
            {permission.description}
          </ThemedText>
        ) : null}
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
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: {
      flex: 1,
      gap: 4,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    name: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
      flex: 1,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    moduleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    moduleBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    moduleText: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    slug: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.textSecondary,
      flex: 1,
    },
    description: {
      fontSize: 12,
      fontWeight: '400',
      color: theme.textSecondary,
      fontStyle: 'italic',
    },
  }), [theme]);
};
