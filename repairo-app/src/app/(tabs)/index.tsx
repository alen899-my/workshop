import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing, Colors } from '@/constants/theme';
import { authService, getCurrentUser } from '@/services/auth.service';

export default function DashboardHome() {
  const { bottom } = useSafeAreaInsets();
  const user = useMemo(() => getCurrentUser(), []);
  const displayName = user?.shopName || user?.ownerName || 'User';

  const handleLogout = async () => {
    await authService.logout();
    router.replace('/auth/login');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, { paddingBottom: Math.max(bottom, 16) + 80 }]}>
        <View style={styles.header}>
          <View>
            <ThemedText type="title">Repairo</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.greeting}>
              Welcome, {displayName}
            </ThemedText>
          </View>
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color={Colors.textInverse} />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.two,
  },
  greeting: { fontSize: 13, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.dark,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  logoutText: {
    color: Colors.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
});
