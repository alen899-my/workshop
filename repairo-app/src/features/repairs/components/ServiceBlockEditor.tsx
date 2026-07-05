import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, TextInput, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ServiceBlock {
  type: string;
  tasks: { text: string; fixed: boolean }[];
}

interface ServiceBlockEditorProps {
  blocks: ServiceBlock[];
  onChange: (blocks: ServiceBlock[]) => void;
}

// ─── Category config ─────────────────────────────────────────────────────────

const CATEGORIES: {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  placeholder: string;
}[] = [
  {
    id: 'Repair',
    label: 'Repair',
    icon: 'build-outline',
    color: '#E05A5A',
    bg: '#FFF0F0',
    placeholder: 'e.g. Engine noise, brake squeak…',
  },
  {
    id: 'Servicing',
    label: 'Servicing',
    icon: 'sync-outline',
    color: '#3D7A78',
    bg: '#EEF6F5',
    placeholder: 'e.g. Oil change, air filter…',
  },
  {
    id: 'Inspection',
    label: 'Inspection',
    icon: 'search-outline',
    color: '#5FA8D3',
    bg: '#EDF6FB',
    placeholder: 'e.g. Brake pad wear, tyre depth…',
  },
  {
    id: 'Modification',
    label: 'Modification',
    icon: 'color-wand-outline',
    color: '#B399D4',
    bg: '#F4F0FA',
    placeholder: 'e.g. Paint wrap, custom exhaust…',
  },
  {
    id: 'Other',
    label: 'Other',
    icon: 'ellipsis-horizontal-circle-outline',
    color: '#8A8A80',
    bg: '#F3F3F0',
    placeholder: 'Describe other work needed…',
  },
];

// ─── Single block ─────────────────────────────────────────────────────────────

interface BlockProps {
  block: ServiceBlock;
  index: number;
  total: number;
  onTypeChange: (type: string) => void;
  onAddTask: () => void;
  onUpdateTaskText: (ti: number, text: string) => void;
  onToggleTask: (ti: number) => void;
  onRemoveTask: (ti: number) => void;
  onRemoveBlock: () => void;
}

function ServiceBlockCard({
  block, index, total,
  onTypeChange, onAddTask, onUpdateTaskText, onToggleTask, onRemoveTask, onRemoveBlock,
}: BlockProps) {
  const cfg = CATEGORIES.find((c) => c.id === block.type) || CATEGORIES[0];

  return (
    <View style={[styles.block, { borderColor: cfg.color + '28' }]}>
      {/* Header */}
      <View style={styles.blockHeader}>
        <View style={[styles.blockIconWrap, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={18} color={cfg.color} />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText style={[styles.blockCategoryLabel, { color: cfg.color }]}>
            {cfg.label}
          </ThemedText>
          <ThemedText style={styles.blockSubLabel}>
            {block.tasks.length} {block.tasks.length === 1 ? 'item' : 'items'}
          </ThemedText>
        </View>
        {total > 1 && (
          <Pressable onPress={onRemoveBlock} hitSlop={10} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={15} color={Colors.error} />
          </Pressable>
        )}
      </View>

      {/* Category picker pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {CATEGORIES.map((cat) => {
          const active = block.type === cat.id;
          return (
            <Pressable
              key={cat.id}
              style={[
                styles.categoryChip,
                active && { backgroundColor: cat.color, borderColor: cat.color },
              ]}
              onPress={() => onTypeChange(cat.id)}
            >
              <Ionicons
                name={cat.icon}
                size={13}
                color={active ? '#FFFFFF' : Colors.textSecondary}
              />
              <ThemedText style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                {cat.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Inputs List */}
      <View style={styles.issueList}>
        {block.tasks.map((task, ti) => (
          <View key={ti} style={styles.issueRow}>
            <TextInput
              style={styles.issueInput}
              value={task.text}
              onChangeText={(t) => onUpdateTaskText(ti, t)}
              placeholder={cfg.placeholder}
              placeholderTextColor={Colors.tabIconDefault}
              multiline={false}
            />
            <Pressable
              onPress={() => onRemoveTask(ti)}
              hitSlop={8}
              style={styles.issueRemove}
            >
              <Ionicons name="trash-outline" size={16} color={Colors.error} />
            </Pressable>
          </View>
        ))}
      </View>

      {/* Add Task Button inside card */}
      <Pressable style={[styles.addTaskCardBtn, { backgroundColor: cfg.bg }]} onPress={onAddTask}>
        <Ionicons name="add-circle-outline" size={16} color={cfg.color} />
        <ThemedText style={[styles.addTaskCardText, { color: cfg.color }]}>
          Add Item
        </ThemedText>
      </Pressable>
    </View>
  );
}

// ─── Main editor ─────────────────────────────────────────────────────────────

export default function ServiceBlockEditor({ blocks, onChange }: ServiceBlockEditorProps) {
  // Ensure every category block always has at least one task input row
  useEffect(() => {
    let changed = false;
    const updated = blocks.map((b) => {
      if (b.tasks.length === 0) {
        changed = true;
        return { ...b, tasks: [{ text: '', fixed: false }] };
      }
      return b;
    });
    if (changed) {
      onChange(updated);
    }
  }, [blocks, onChange]);

  const addBlock = useCallback(() => {
    onChange([...blocks, { type: 'Repair', tasks: [{ text: '', fixed: false }] }]);
  }, [blocks, onChange]);

  const removeBlock = useCallback((i: number) => {
    if (blocks.length <= 1) return;
    onChange(blocks.filter((_, idx) => idx !== i));
  }, [blocks, onChange]);

  const updateBlockType = useCallback((i: number, type: string) => {
    const u = [...blocks];
    u[i] = { ...u[i], type };
    onChange(u);
  }, [blocks, onChange]);

  const addTask = useCallback((bi: number) => {
    const u = [...blocks];
    u[bi] = { ...u[bi], tasks: [...u[bi].tasks, { text: '', fixed: false }] };
    onChange(u);
  }, [blocks, onChange]);

  const updateTaskText = useCallback((bi: number, ti: number, text: string) => {
    const u = [...blocks];
    u[bi].tasks[ti] = { ...u[bi].tasks[ti], text };
    onChange(u);
  }, [blocks, onChange]);

  const toggleTask = useCallback((bi: number, ti: number) => {
    const u = [...blocks];
    u[bi].tasks[ti] = { ...u[bi].tasks[ti], fixed: !u[bi].tasks[ti].fixed };
    onChange(u);
  }, [blocks, onChange]);

  const removeTask = useCallback((bi: number, ti: number) => {
    const u = [...blocks];
    if (u[bi].tasks.length <= 1) {
      // If only one remains, clear the text instead of deleting the input row
      u[bi].tasks[0] = { text: '', fixed: false };
    } else {
      u[bi].tasks = u[bi].tasks.filter((_, idx) => idx !== ti);
    }
    onChange(u);
  }, [blocks, onChange]);

  return (
    <View style={styles.root}>
      {blocks.map((block, bi) => (
        <ServiceBlockCard
          key={bi}
          block={block}
          index={bi}
          total={blocks.length}
          onTypeChange={(t) => updateBlockType(bi, t)}
          onAddTask={() => addTask(bi)}
          onUpdateTaskText={(ti, t) => updateTaskText(bi, ti, t)}
          onToggleTask={(ti) => toggleTask(bi, ti)}
          onRemoveTask={(ti) => removeTask(bi, ti)}
          onRemoveBlock={() => removeBlock(bi)}
        />
      ))}

      <Pressable style={styles.addBlockBtn} onPress={addBlock}>
        <View style={styles.addBlockIcon}>
          <Ionicons name="add" size={16} color={Colors.primary} />
        </View>
        <ThemedText style={styles.addBlockText}>Add Service Category</ThemedText>
      </Pressable>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { gap: 14 },

  // Block Card Container
  block: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  blockIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  blockCategoryLabel: { fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },
  blockSubLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500', marginTop: 1 },
  deleteBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: '#FFF0F0',
    alignItems: 'center', justifyContent: 'center',
  },

  // Category Selector row
  categoryScroll: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 6,
    flexDirection: 'row',
  },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  categoryChipText: {
    fontSize: 12, fontWeight: '700', color: Colors.textSecondary,
  },
  categoryChipTextActive: { color: '#FFFFFF' },

  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 0 },

  // Inputs list inside card
  issueList: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 6,
    gap: 8,
  },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  issueInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
    paddingVertical: 0,
    height: '100%',
  },
  issueRemove: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // Inside-card add item button
  addTaskCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
    marginHorizontal: 14,
    marginBottom: 14,
    marginTop: 6,
  },
  addTaskCardText: {
    fontSize: 13,
    fontWeight: '800',
  },

  // Bottom Add Category Button
  addBlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.primary + '60',
    backgroundColor: Colors.primary + '05',
  },
  addBlockIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBlockText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
});
