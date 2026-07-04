import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ModalSheet from '@/components/ui/ModalSheet';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
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

  const selectedWorker = workers.find((w) => w.id.toString() === value);

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>Attending Worker</ThemedText>
      <Pressable style={styles.trigger} onPress={() => setModalVisible(true)}>
        <Ionicons name="person-outline" size={18} color={Colors.textSecondary} />
        <ThemedText style={[styles.triggerText, !selectedWorker && styles.placeholder]}>
          {selectedWorker?.name || 'Select worker...'}
        </ThemedText>
        <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
      </Pressable>

      <ModalSheet visible={modalVisible} title="Select Worker" onClose={() => setModalVisible(false)}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search workers..."
          placeholderTextColor={Colors.textSecondary}
        />
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const active = item.id.toString() === value;
            return (
              <Pressable
                style={[styles.workerItem, active && { backgroundColor: Colors.primary + '12' }]}
                onPress={() => { onChange(String(item.id)); setModalVisible(false); setSearch(''); }}
              >
                <View style={[styles.workerIcon, active && { backgroundColor: Colors.primary + '20' }]}>
                  <Ionicons name="person" size={18} color={active ? Colors.primary : Colors.textSecondary} />
                </View>
                <View style={styles.workerInfo}>
                  <ThemedText style={styles.workerName}>{item.name}</ThemedText>
                  <ThemedText style={styles.workerRole}>{item.role.replace('_', ' ')}</ThemedText>
                </View>
                {active && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
              </Pressable>
            );
          }}
        />
      </ModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6, marginBottom: Spacing.four },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: Colors.textSecondary },
  trigger: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 12, backgroundColor: Colors.card,
  },
  triggerText: { flex: 1, fontSize: 15, color: Colors.text },
  placeholder: { color: Colors.textSecondary },
  searchInput: {
    margin: Spacing.four, borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
    backgroundColor: Colors.card, color: Colors.text,
  },
  list: { paddingBottom: Spacing.four },
  workerItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: Spacing.four, paddingVertical: 10,
  },
  workerIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.backgroundElement, alignItems: 'center', justifyContent: 'center',
  },
  workerInfo: { flex: 1 },
  workerName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  workerRole: { fontSize: 12, color: Colors.textSecondary, textTransform: 'capitalize' },
});
