import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { toBlocks, toJobList } from '../utils/jobs';

// ─── Types ───────────────────────────────────────────────────────────────────
// Storage shape is unchanged (single block); old multi-block repairs are
// flattened into one Jobs-to-do list everywhere.

export interface ServiceBlock {
  type: string;
  tasks: { text: string; fixed: boolean }[];
}

interface ServiceBlockEditorProps {
  blocks: ServiceBlock[];
  onChange: (blocks: ServiceBlock[]) => void;
}

// ─── Job-level category config (one picker per job, rendered by the parent) ─

export const JOB_CATEGORIES: {
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
    color: '#0D9488',
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

export function jobCategoryConfig(type?: string) {
  return JOB_CATEGORIES.find((c) => c.id === type) || JOB_CATEGORIES[0];
}

// ─── Single Jobs-to-do editor ────────────────────────────────────────────────

export default function ServiceBlockEditor({ blocks, onChange }: ServiceBlockEditorProps) {
  const job = useMemo(() => toJobList(blocks), [blocks]);
  const cfg = jobCategoryConfig(job.type);

  // Normalize legacy multi-block data to one list, and always keep one empty row.
  useEffect(() => {
    const flat = toJobList(blocks);
    if (blocks.length !== 1) {
      onChange(toBlocks(flat.type, flat.tasks.length ? flat.tasks : [{ text: '', fixed: false }]));
      return;
    }
    const onlyRow = blocks[0]?.tasks?.length === 1 ? blocks[0].tasks[0] : null;
    if (flat.tasks.length === 0 && !(onlyRow && !String(onlyRow.text || '').trim())) {
      onChange(toBlocks(flat.type, [{ text: '', fixed: false }]));
    }
  }, [blocks, onChange]);

  const setTasks = (tasks: { text: string; fixed: boolean }[]) => {
    onChange(toBlocks(job.type, tasks));
  };

  const addTask = () => {
    setTasks([...job.tasks, { text: '', fixed: false }]);
  };

  const updateTaskText = (ti: number, text: string) => {
    setTasks(job.tasks.map((t, i) => (i === ti ? { ...t, text } : t)));
  };

  const removeTask = (ti: number) => {
    if (job.tasks.length <= 1) {
      // If only one remains, clear the text instead of deleting the input row
      setTasks([{ text: '', fixed: false }]);
    } else {
      setTasks(job.tasks.filter((_, i) => i !== ti));
    }
  };

  const theme = useTheme();
  const styles = useStyles(theme);
  const filled = job.tasks.filter((t) => t.text.trim()).length;

  return (
    <View style={styles.root}>
      <View style={styles.block}>
        {/* Header */}
        <View style={styles.blockHeader}>
          <View style={[styles.blockIconWrap, { backgroundColor: cfg.bg }]}>
            <Ionicons name="clipboard-outline" size={18} color={cfg.color} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={[styles.blockCategoryLabel, { color: cfg.color }]}>
              Jobs to do
            </ThemedText>
            <ThemedText style={styles.blockSubLabel}>
              {filled} {filled === 1 ? 'item' : 'items'}
            </ThemedText>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Inputs List */}
        <View style={styles.issueList}>
          {job.tasks.map((task, ti) => (
            <View key={ti} style={styles.issueRow}>
              <TextInput
                style={styles.issueInput}
                value={task.text}
                onChangeText={(t) => updateTaskText(ti, t)}
                placeholder={cfg.placeholder}
                placeholderTextColor={theme.tabIconDefault}
                multiline={false}
              />
              <Pressable
                onPress={() => removeTask(ti)}
                hitSlop={8}
                style={styles.issueRemove}
              >
                <Ionicons name="trash-outline" size={16} color={theme.error} />
              </Pressable>
            </View>
          ))}
        </View>

        {/* Add Item Button */}
        <Pressable style={[styles.addTaskCardBtn, { backgroundColor: cfg.bg }]} onPress={addTask}>
          <Ionicons name="add-circle-outline" size={16} color={cfg.color} />
          <ThemedText style={[styles.addTaskCardText, { color: cfg.color }]}>
            Add Item
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  const styles = useMemo(() => StyleSheet.create({
    root: { gap: 14 },

    // Block Card Container
    block: {
      backgroundColor: theme.card,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.border,
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
    blockSubLabel: { fontSize: 11, color: theme.textSecondary, fontWeight: '500', marginTop: 1 },

    divider: { height: 1, backgroundColor: theme.border, marginHorizontal: 0 },

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
      backgroundColor: theme.card,
      borderRadius: 14,
      paddingHorizontal: 14,
      height: 52,
      borderWidth: 1.5,
      borderColor: theme.border,
    },
    issueInput: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
      color: theme.text,
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
  }), [theme]);
  return styles;
};
