import { useCallback, useMemo, useState } from 'react';
import {
  Alert, Modal, Pressable, ScrollView, StyleSheet, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useRBAC } from '@/hooks/use-rbac';
import { getCurrentUser } from '@/services/auth.service';
import { authService } from '@/services/auth.service';
import SettingsScreen from '@/features/settings/SettingsScreen';
import PermissionsScreen from '@/features/permissions/PermissionsScreen';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  permission?: string;
  action: 'modal' | 'screen' | 'coming-soon';
  screen?: string;
}

export default function ProfileScreen() {
  const { can, user } = useRBAC();
  const theme = useTheme();
  const styles = useStyles(theme);
  const insets = useSafeAreaInsets();
  const currentUser = getCurrentUser();
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [permissionsModalVisible, setPermissionsModalVisible] = useState(false);

  const menuItems: MenuItem[] = useMemo(() => [
    {
      icon: 'settings-outline',
      label: 'Settings',
      description: 'Theme, appearance & app preferences',
      permission: 'manage:settings',
      action: 'modal',
    },
    {
      icon: 'people-outline',
      label: 'Users',
      description: 'Manage workshop users and staff',
      permission: 'view:users',
      action: 'coming-soon',
    },
    {
      icon: 'shield-half-outline',
      label: 'Roles',
      description: 'Define access roles',
      permission: 'view:role',
      action: 'coming-soon',
    },
    {
      icon: 'shield-checkmark-outline',
      label: 'Permissions',
      description: 'Manage system permissions',
      permission: 'view:permission',
      action: 'modal',
    },
    {
      icon: 'business-outline',
      label: 'Shops',
      description: 'Manage workshop locations',
      permission: 'view:shops',
      action: 'coming-soon',
    },
    {
      icon: 'receipt-outline',
      label: 'Invoices',
      description: 'View all invoices & billing',
      permission: 'view:invoices',
      action: 'coming-soon',
    },
    {
      icon: 'construct-outline',
      label: 'Workers',
      description: 'Manage attending workers',
      permission: 'view:workers',
      action: 'coming-soon',
    },
  ], []);

  const handleMenuPress = useCallback((item: MenuItem) => {
    if (item.action === 'modal') {
      if (item.label === 'Settings') setSettingsModalVisible(true);
      else if (item.label === 'Permissions') setPermissionsModalVisible(true);
    } else if (item.action === 'coming-soon') {
      Alert.alert('Coming Soon', `${item.label} management will be available in an upcoming update.`);
    }
  }, []);

  const roleBadgeColor = currentUser?.role === 'super-admin' ? '#F59E0B' : '#3B82F6';

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View style={[styles.userCard, { backgroundColor: theme.card }]}>
          <View style={styles.avatarWrap}>
            <View style={[styles.avatar, { backgroundColor: theme.primary + '18' }]}>
              <Ionicons name="person" size={36} color={theme.primary} />
            </View>
            <View style={[styles.roleBadge, { backgroundColor: roleBadgeColor }]}>
              <ThemedText style={styles.roleBadgeText}>
                {currentUser?.role === 'super-admin' ? 'SA' : 'USR'}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={styles.userName}>{currentUser?.ownerName || 'User'}</ThemedText>
          <View style={[styles.roleChip, { backgroundColor: theme.primary + '12' }]}>
            <ThemedText style={[styles.roleText, { color: theme.primary }]}>
              {currentUser?.role || 'N/A'}
            </ThemedText>
          </View>
          <View style={styles.userMeta}>
            {currentUser?.shopName && (
              <View style={styles.metaRow}>
                <Ionicons name="business-outline" size={14} color={theme.textSecondary} />
                <ThemedText style={styles.metaText}>{currentUser.shopName}</ThemedText>
              </View>
            )}
            {currentUser?.phone && (
              <View style={styles.metaRow}>
                <Ionicons name="call-outline" size={14} color={theme.textSecondary} />
                <ThemedText style={styles.metaText}>{currentUser.phone}</ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Management Menu */}
        <View style={styles.menuSection}>
          <ThemedText style={styles.sectionTitle}>MANAGEMENT</ThemedText>
          <View style={[styles.menuCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {menuItems.map((item, index) => {
              const hasPermission = !item.permission || can(item.permission);
              if (!hasPermission) return null;
              const isLast = index === menuItems.length - 1 || menuItems.slice(index + 1).every((m) => m.permission && !can(m.permission));
              return (
                <Pressable
                  key={item.label}
                  style={({ pressed }) => [
                    styles.menuRow,
                    index === 0 && styles.menuRowFirst,
                    isLast && styles.menuRowLast,
                    { borderColor: theme.border },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => handleMenuPress(item)}
                >
                  <View style={[styles.menuIcon, { backgroundColor: theme.primary + '12' }]}>
                    <Ionicons name={item.icon} size={20} color={theme.primary} />
                  </View>
                  <View style={styles.menuContent}>
                    <ThemedText style={styles.menuLabel}>{item.label}</ThemedText>
                    {item.description && (
                      <ThemedText style={styles.menuDescription} numberOfLines={1}>{item.description}</ThemedText>
                    )}
                  </View>
                  <Ionicons
                    name={item.action === 'coming-soon' ? 'time-outline' : 'chevron-forward'}
                    size={18}
                    color={theme.textSecondary}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Logout */}
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.8 }]}
          onPress={() => {
            Alert.alert('Logout', 'Are you sure you want to logout?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', style: 'destructive', onPress: () => authService.logout() },
            ]);
          }}
        >
          <Ionicons name="log-out-outline" size={18} color={theme.destructive} />
          <ThemedText style={styles.logoutText}>Logout</ThemedText>
        </Pressable>

        {/* Version */}
        <ThemedText style={styles.version}>Repairo v1.0.0</ThemedText>
      </ScrollView>

      {/* Settings Modal */}
      <Modal visible={settingsModalVisible} animationType="slide" onRequestClose={() => setSettingsModalVisible(false)}>
        <SettingsScreen onClose={() => setSettingsModalVisible(false)} />
      </Modal>

      {/* Permissions Modal */}
      <Modal visible={permissionsModalVisible} animationType="slide" onRequestClose={() => setPermissionsModalVisible(false)}>
        <PermissionsScreen onClose={() => setPermissionsModalVisible(false)} />
      </Modal>
    </ThemedView>
  );
}

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.backgroundElement },

    scrollContent: { paddingHorizontal: 16, paddingTop: 48, paddingBottom: 16, gap: 20 },

    // ── User Card ──
    userCard: {
      alignItems: 'center',
      padding: 24,
      borderRadius: 20,
      gap: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    avatarWrap: { position: 'relative' },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    roleBadge: {
      position: 'absolute',
      bottom: -2,
      right: -4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    roleBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
    userName: { fontSize: 20, fontWeight: '800', color: theme.text, marginTop: 4 },
    roleChip: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
    },
    roleText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
    userMeta: { gap: 4, marginTop: 4, alignItems: 'center' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },

    // ── Menu ──
    menuSection: { gap: 8 },
    sectionTitle: {
      fontSize: 11, fontWeight: '700', color: theme.textSecondary,
      letterSpacing: 1, paddingLeft: 4,
    },
    menuCard: {
      borderRadius: 16,
      borderWidth: 1,
      overflow: 'hidden',
    },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
    },
    menuRowFirst: {},
    menuRowLast: { borderBottomWidth: 0 },
    menuIcon: {
      width: 38, height: 38, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
      marginRight: 12,
    },
    menuContent: { flex: 1, gap: 1 },
    menuLabel: { fontSize: 15, fontWeight: '600', color: theme.text },
    menuDescription: { fontSize: 12, fontWeight: '500', color: theme.textSecondary },

    // ── Logout ──
    logoutBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, paddingVertical: 14, borderRadius: 14,
      borderWidth: 1, borderColor: theme.destructive + '30',
      backgroundColor: theme.destructive + '08',
    },
    logoutText: { fontSize: 15, fontWeight: '700', color: theme.destructive },

    // ── Version ──
    version: {
      fontSize: 12, fontWeight: '500', color: theme.textSecondary,
      textAlign: 'center', opacity: 0.6,
    },
  }), [theme]);
  return styles;
};
