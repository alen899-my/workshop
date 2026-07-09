import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ModalSheet from '@/components/ui/ModalSheet';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Worker } from '@/features/repairs/services/worker.service';
import { workerService } from '@/features/repairs/services/worker.service';
import { getCurrentUser } from '@/services/auth.service';

interface WorkerSelectProps {
  value: string;
  onChange: (id: string) => void;
}

export default function WorkerSelect({ value, onChange }: WorkerSelectProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    workerService.getWorkers().then((res) => {
      if (res.success && res.data) {
        const user = getCurrentUser();
        const isAdmin = user?.role === 'shop_owner' || user?.role === 'admin' || user?.role === 'super-admin';
        setWorkers(isAdmin ? res.data.filter((w) => w.role !== 'customer') : res.data.filter((w) => w.role === 'worker'));
      }
    });
  }, []);

  const filtered = useMemo(
    () => workers.filter((w) => w.name.toLowerCase().includes(search.toLowerCase())),
    [workers, search],
  );

  const theme = useTheme();
  const styles = useStyles(theme);
  const selectedWorker = workers.find((w) => w.id.toString() === value);

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>Attending Worker</ThemedText>
      <Pressable style={styles.trigger} onPress={() => setModalVisible(true)}>
        <Ionicons name="person-outline" size={18} color={theme.textSecondary} />
        <ThemedText style={[styles.triggerText, !selectedWorker && styles.placeholder]}>
          {selectedWorker?.name || 'Select worker...'}
        </ThemedText>
        <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
      </Pressable>

      <ModalSheet visible={modalVisible} title="Select Worker" onClose={() => setModalVisible(false)}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search workers..."
          placeholderTextColor={theme.textSecondary}
        />
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const active = item.id.toString() === value;
            return (
              <Pressable
                style={[styles.workerItem, active && { backgroundColor: theme.primary + '12' }]}
                onPress={() => { onChange(String(item.id)); setModalVisible(false); setSearch(''); }}
              >
                <View style={[styles.workerIcon, active && { backgroundColor: theme.primary + '20' }]}>
                  <Ionicons name="person" size={18} color={active ? theme.primary : theme.textSecondary} />
                </View>
                <View style={styles.workerInfo}>
                  <ThemedText style={styles.workerName}>{item.name}</ThemedText>
                  <ThemedText style={styles.workerRole}>{item.role.replace('_', ' ')}</ThemedText>
                </View>
                {active && <Ionicons name="checkmark-circle" size={20} color={theme.primary} />}
              </Pressable>
            );
          }}
        />
      </ModalSheet>
    </View>
  );
}

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  const styles = useMemo(() => StyleSheet.create({
    container: { gap: 6, marginBottom: Spacing.four },
    label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: theme.textSecondary },
    trigger: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      borderWidth: 1, borderColor: theme.border, borderRadius: 12,
      paddingHorizontal: 12, paddingVertical: 12, backgroundColor: theme.card,
    },
    triggerText: { flex: 1, fontSize: 15, color: theme.text },
    placeholder: { color: theme.textSecondary },
    searchInput: {
      margin: Spacing.four, borderRadius: 10, borderWidth: 1, borderColor: theme.border,
      paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
      backgroundColor: theme.card, color: theme.text,
    },
    list: { paddingBottom: Spacing.four },
    workerItem: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: Spacing.four, paddingVertical: 10,
    },
    workerIcon: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: theme.backgroundElement, alignItems: 'center', justifyContent: 'center',
    },
    workerInfo: { flex: 1 },
    workerName: { fontSize: 15, fontWeight: '600', color: theme.text },
    workerRole: { fontSize: 12, color: theme.textSecondary, textTransform: 'capitalize' },
  }), [theme]);
  return styles;
};
