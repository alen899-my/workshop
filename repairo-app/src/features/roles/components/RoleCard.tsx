import { useState, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { Role } from '@/features/roles/services/role.service';

interface RoleCardProps {
  role: Role;
  onPress?: (role: Role) => void;
  onDelete?: (role: Role) => void;
}

export default function RoleCard({ role, onPress, onDelete }: RoleCardProps) {
  const theme = useTheme();
  const styles = useStyles(theme);
  const [showDelete, setShowDelete] = useState(false);
  const isActive = role.status === 'active';
  const permCount = role.permission_count ?? role.permissions?.length ?? 0;

  const handlePress = () => {
    if (showDelete) {
      setShowDelete(false);
    } else {
      onPress?.(role);
    }
  };

  const handleDeletePress = () => {
    setShowDelete(false);
    onDelete?.(role);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={handlePress}
      onLongPress={onDelete ? () => setShowDelete((prev) => !prev) : undefined}
      delayLongPress={400}
    >
      <View style={[styles.iconWrap, { backgroundColor: theme.primary + '15' }]}>
        <Ionicons name="shield-half-outline" size={22} color={theme.primary} />
      </View>

      <View style={styles.info}>
        <View style={styles.topRow}>
          <ThemedText style={styles.name} numberOfLines={1}>
            {role.name}
          </ThemedText>
          <View style={[styles.statusDot, { backgroundColor: isActive ? theme.success : theme.textSecondary }]} />
        </View>
        <View style={styles.metaRow}>
          <ThemedText style={styles.slug} numberOfLines={1}>
            {role.slug}
          </ThemedText>
          <View style={[styles.permBadge, { backgroundColor: theme.info + '18' }]}>
            <Ionicons name="shield-checkmark-outline" size={11} color={theme.info} />
            <ThemedText style={[styles.permText, { color: theme.info }]}>
              {permCount} perm{permCount !== 1 ? 's' : ''}
            </ThemedText>
          </View>
        </View>
        {role.description ? (
          <ThemedText style={styles.description} numberOfLines={1}>
            {role.description}
          </ThemedText>
        ) : null}
      </View>

      {showDelete ? (
        <Pressable onPress={handleDeletePress} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={15} color={theme.textInverse} />
        </Pressable>
      ) : (
        <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
      )}
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
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    slug: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.textSecondary,
    },
    permBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
    },
    permText: {
      fontSize: 11,
      fontWeight: '700',
    },
    description: {
      fontSize: 12,
      fontWeight: '400',
      color: theme.textSecondary,
    },
    deleteBtn: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: theme.error || theme.destructive,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }), [theme]);
};
