import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

const SERVICE_TYPES = ['Repair', 'Servicing', 'Inspection', 'Modification', 'Other'];

export interface ServiceBlock {
  type: string;
  tasks: { text: string; fixed: boolean }[];
}

interface ServiceBlockEditorProps {
  blocks: ServiceBlock[];
  onChange: (blocks: ServiceBlock[]) => void;
}

export default function ServiceBlockEditor({ blocks, onChange }: ServiceBlockEditorProps) {
  const addBlock = useCallback(() => {
    onChange([...blocks, { type: 'Repair', tasks: [] }]);
  }, [blocks, onChange]);

  const removeBlock = useCallback((i: number) => {
    if (blocks.length <= 1) return;
    onChange(blocks.filter((_, idx) => idx !== i));
  }, [blocks, onChange]);

  const updateBlockType = useCallback((i: number, type: string) => {
    const updated = [...blocks];
    updated[i] = { ...updated[i], type };
    onChange(updated);
  }, [blocks, onChange]);

  const addTask = useCallback((bi: number) => {
    const updated = [...blocks];
    updated[bi] = { ...updated[bi], tasks: [...updated[bi].tasks, { text: '', fixed: false }] };
    onChange(updated);
  }, [blocks, onChange]);

  const updateTaskText = useCallback((bi: number, ti: number, text: string) => {
    const updated = [...blocks];
    updated[bi].tasks[ti] = { ...updated[bi].tasks[ti], text };
    onChange(updated);
  }, [blocks, onChange]);

  const toggleTask = useCallback((bi: number, ti: number) => {
    const updated = [...blocks];
    updated[bi].tasks[ti] = { ...updated[bi].tasks[ti], fixed: !updated[bi].tasks[ti].fixed };
    onChange(updated);
  }, [blocks, onChange]);

  const removeTask = useCallback((bi: number, ti: number) => {
    const updated = [...blocks];
    updated[bi] = { ...updated[bi], tasks: updated[bi].tasks.filter((_, idx) => idx !== ti) };
    onChange(updated);
  }, [blocks, onChange]);

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>Service Details</ThemedText>

      {blocks.map((block, bi) => (
        <View key={bi} style={styles.block}>
          <View style={styles.blockHeader}>
            <View style={styles.blockBadge}>
              <ThemedText style={styles.blockBadgeText}>{bi + 1}</ThemedText>
            </View>
            <ThemedText style={styles.blockTitle}>Service Category</ThemedText>
            {blocks.length > 1 && (
              <Pressable onPress={() => removeBlock(bi)} hitSlop={8}>
                <Ionicons name="trash-outline" size={16} color={Colors.error} />
              </Pressable>
            )}
          </View>

          <View style={styles.typeRow}>
            {SERVICE_TYPES.map((type) => {
              const active = block.type === type;
              return (
                <Pressable
                  key={type}
                  style={[styles.typeChip, active && { backgroundColor: Colors.primary + '18', borderColor: Colors.primary }]}
                  onPress={() => updateBlockType(bi, type)}
                >
                  <ThemedText style={[styles.typeChipText, active && { color: Colors.primary, fontWeight: '700' }]}>
                    {type}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <ThemedText style={styles.taskLabel}>
            {block.type === 'Repair' ? 'Reported Problems' :
             block.type === 'Servicing' ? 'Service Items' :
             block.type === 'Inspection' ? 'Inspection Checklist' :
             block.type === 'Modification' ? 'Customization Plan' : 'Work Details'}
          </ThemedText>

          {block.tasks.map((task, ti) => (
            <View key={ti} style={styles.taskRow}>
              <Pressable onPress={() => toggleTask(bi, ti)} style={[styles.checkbox, task.fixed && styles.checkboxActive]}>
                {task.fixed && <Ionicons name="checkmark" size={12} color={Colors.primaryForeground} />}
              </Pressable>
              <TextInput
                style={[styles.taskInput, task.fixed && styles.taskDone]}
                value={task.text}
                onChangeText={(t) => updateTaskText(bi, ti, t)}
                placeholder="Enter task..."
                placeholderTextColor={Colors.textSecondary}
              />
              <Pressable onPress={() => removeTask(bi, ti)} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
              </Pressable>
            </View>
          ))}

          <Pressable style={styles.addTaskBtn} onPress={() => addTask(bi)}>
            <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
            <ThemedText style={styles.addTaskText}>Add Task</ThemedText>
          </Pressable>
        </View>
      ))}

      <Pressable style={styles.addBlockBtn} onPress={addBlock}>
        <Ionicons name="add" size={20} color={Colors.primary} />
        <ThemedText style={styles.addBlockText}>Add Another Service Category</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10, marginBottom: Spacing.four },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: Colors.textSecondary },
  block: {
    backgroundColor: Colors.card, borderRadius: 14, padding: Spacing.three,
    gap: 8, borderWidth: 1, borderColor: Colors.border,
  },
  blockHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  blockBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  blockBadgeText: { color: Colors.primaryForeground, fontSize: 12, fontWeight: '800' },
  blockTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.text },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  typeChip: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  typeChipText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  taskLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, marginTop: 2 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: Colors.success, borderColor: Colors.success },
  taskInput: { flex: 1, fontSize: 14, color: Colors.text, paddingVertical: 6 },
  taskDone: { textDecorationLine: 'line-through', color: Colors.textSecondary },
  addTaskBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  addTaskText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  addBlockBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.primary,
  },
  addBlockText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
});
