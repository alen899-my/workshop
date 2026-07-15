import { useState, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { User } from '@/features/users/services/user.service';

interface UserCardProps {
  user: User;
  onPress?: (user: User) => void;
  onDelete?: (user: User) => void;
}

function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const ROLE_COLORS: Record<string, string> = {
  'super-admin': '#F59E0B',
  'shop_owner': '#3B82F6',
  'admin': '#8B5CF6',
  'worker': '#10B981',
};

export default function UserCard({ user, onPress, onDelete }: UserCardProps) {
  const theme = useTheme();
  const styles = useStyles(theme);
  const [showDelete, setShowDelete] = useState(false);
  const isActive = user.status === 'active';
  const roleColor = ROLE_COLORS[user.role] || theme.primary;

  const handlePress = () => {
    if (showDelete) {
      setShowDelete(false);
    } else {
      onPress?.(user);
    }
  };

  const handleDeletePress = () => {
    setShowDelete(false);
    onDelete?.(user);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={handlePress}
      onLongPress={onDelete ? () => setShowDelete((prev) => !prev) : undefined}
      delayLongPress={400}
    >
      <View style={[styles.avatarWrap, { backgroundColor: roleColor + '18' }]}>
        <ThemedText style={[styles.initials, { color: roleColor }]}>
          {getInitials(user.name)}
        </ThemedText>
      </View>

      <View style={styles.info}>
        <View style={styles.topRow}>
          <ThemedText style={styles.name} numberOfLines={1}>
            {user.name || 'Unknown'}
          </ThemedText>
          <View style={[styles.statusDot, { backgroundColor: isActive ? theme.success : theme.textSecondary }]} />
        </View>
        <View style={styles.metaRow}>
          <View style={[styles.roleBadge, { backgroundColor: roleColor + '18' }]}>
            <ThemedText style={[styles.roleText, { color: roleColor }]}>
              {user.role_name || user.role}
            </ThemedText>
          </View>
          <Ionicons name="call-outline" size={11} color={theme.textSecondary} />
          <ThemedText style={styles.phone} numberOfLines={1}>
            {user.phone || '—'}
          </ThemedText>
        </View>
        {user.shop_name ? (
          <View style={styles.shopRow}>
            <Ionicons name="business-outline" size={11} color={theme.textSecondary} />
            <ThemedText style={styles.shopName} numberOfLines={1}>
              {user.shop_name}
            </ThemedText>
          </View>
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
    avatarWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initials: {
      fontSize: 15,
      fontWeight: '800',
    },
    info: {
      flex: 1,
      gap: 3,
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
      gap: 5,
    },
    roleBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    roleText: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    phone: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.textSecondary,
      flex: 1,
    },
    shopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    shopName: {
      fontSize: 11,
      fontWeight: '500',
      color: theme.textSecondary,
    },
    deleteBtn: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: theme.destructive,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }), [theme]);
};
