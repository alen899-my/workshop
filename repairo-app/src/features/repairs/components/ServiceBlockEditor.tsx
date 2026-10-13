import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { toJobList } from '../utils/jobs';

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

// ─── Single Jobs-to-do editor ────────────────────────────────────────────────

export default function ServiceBlockEditor({ blocks, onChange }: ServiceBlockEditorProps) {
  const job = useMemo(() => {
    const normalized = toJobList(blocks);
    // The display helper removes blank tasks and trims text. Draft inputs must
    // retain both, otherwise Add Item vanishes and spaces disappear while typing.
    const tasks = blocks.flatMap(block => block.tasks || []);
    return { type: normalized.type, tasks: tasks.length ? tasks : [{ text: '', fixed: false }] };
  }, [blocks]);

  useEffect(() => {
    if (blocks.length !== 1 || !blocks[0]?.tasks?.length) {
      onChange([{ type: job.type, tasks: job.tasks }]);
    }
  }, [blocks, job, onChange]);

  const setTasks = (tasks: ServiceBlock['tasks']) => {
    onChange([{ type: job.type, tasks }]);
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
          <View style={[styles.blockIconWrap, { backgroundColor: theme.primary + '12' }]}>
            <Ionicons name="clipboard-outline" size={18} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.blockCategoryLabel}>
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
                placeholder="e.g. Oil change, brake noise…"
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
        <Pressable style={[styles.addTaskCardBtn, { backgroundColor: theme.primary + '12' }]} hitSlop={8} onPress={addTask}>
          <Ionicons name="add-circle-outline" size={16} color={theme.primary} />
          <ThemedText style={[styles.addTaskCardText, { color: theme.primary }]}>
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
      minHeight: 48,
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
