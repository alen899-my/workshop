/**
 * DateStrip — reusable date picker component.
 *
 * Shows:
 *  - A horizontal strip of the last 7 days as square pills
 *  - A calendar icon button that opens a full-month calendar modal
 *
 * Props:
 *  - selectedDate: ISO date string "YYYY-MM-DD" or null (no filter)
 *  - onChange: (date: string | null) => void
 */

import { useCallback, useMemo, useState } from 'react';
import {
  Modal, Pressable, ScrollView, StyleSheet, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayISO(): string {
  return toISO(new Date());
}

function sameDate(a: string, b: string) { return a === b; }

// ─── Types ────────────────────────────────────────────────────────────────────

interface DateStripProps {
  selectedDate: string | null;
  onChange: (date: string | null) => void;
}

// ─── Full-month calendar modal ────────────────────────────────────────────────

interface CalendarModalProps {
  visible: boolean;
  selectedDate: string | null;
  onSelect: (date: string) => void;
  onClear: () => void;
  onClose: () => void;
}

function CalendarModal({ visible, selectedDate, onSelect, onClear, onClose }: CalendarModalProps) {
  const theme = useTheme();
  const styles = useStyles(theme);
  const today = todayISO();

  const [cursor, setCursor] = useState<{ year: number; month: number }>(() => {
    const base = selectedDate ? new Date(selectedDate) : new Date();
    return { year: base.getFullYear(), month: base.getMonth() };
  });

  const prevMonth = useCallback(() => {
    setCursor((c) => {
      if (c.month === 0) return { year: c.year - 1, month: 11 };
      return { year: c.year, month: c.month - 1 };
    });
  }, []);

  const nextMonth = useCallback(() => {
    setCursor((c) => {
      if (c.month === 11) return { year: c.year + 1, month: 0 };
      return { year: c.year, month: c.month + 1 };
    });
  }, []);

  // Build grid: blank slots + day numbers
  const grid = useMemo(() => {
    const firstDay = new Date(cursor.year, cursor.month, 1).getDay();
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const cells: (number | null)[] = [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    // Pad to full weeks
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  // Group into explicit 7-column rows to prevent clipping/wrapping issues
  const rows = useMemo(() => {
    const result: (number | null)[][] = [];
    for (let i = 0; i < grid.length; i += 7) {
      result.push(grid.slice(i, i + 7));
    }
    return result;
  }, [grid]);

  const handleDay = useCallback((day: number) => {
    const iso = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onSelect(iso);
  }, [cursor, onSelect]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.cal.overlay}>
        <Pressable style={styles.cal.backdrop} onPress={onClose} />
        <View style={styles.cal.sheet}>
          {/* Header */}
          <View style={styles.cal.navRow}>
            <Pressable onPress={prevMonth} style={styles.cal.navBtn}>
              <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
            </Pressable>
            <ThemedText style={styles.cal.monthLabel}>
              {MONTH_NAMES[cursor.month]} {cursor.year}
            </ThemedText>
            <Pressable onPress={nextMonth} style={styles.cal.navBtn}>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Day-of-week headers */}
          <View style={styles.cal.weekRow}>
            {DAY_LABELS.map((d, i) => (
              <ThemedText key={i} style={styles.cal.weekLabel}>{d}</ThemedText>
            ))}
          </View>

          {/* Day grid */}
          <View style={styles.cal.grid}>
            {rows.map((row, ri) => (
              <View key={ri} style={styles.cal.row}>
                {row.map((day, ci) => {
                  if (!day) return <View key={ci} style={styles.cal.cell} />;
                  const iso = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isSelected = selectedDate === iso;
                  const isToday = today === iso;
                  return (
                    <Pressable
                      key={ci}
                      style={[
                        styles.cal.cell,
                        isSelected && styles.cal.cellSelected,
                        !isSelected && isToday && styles.cal.cellToday,
                      ]}
                      onPress={() => handleDay(day)}
                    >
                      <ThemedText style={[
                        styles.cal.cellText,
                        isSelected && styles.cal.cellTextSelected,
                        !isSelected && isToday && styles.cal.cellTextToday,
                      ]}>
                        {day}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.cal.actions}>
            <Pressable style={styles.cal.clearBtn} onPress={() => { onClear(); onClose(); }}>
              <ThemedText style={styles.cal.clearText}>Clear</ThemedText>
            </Pressable>
            <Pressable style={styles.cal.doneBtn} onPress={onClose}>
              <ThemedText style={styles.cal.doneText}>Close</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── DateStrip ────────────────────────────────────────────────────────────────

export default function DateStrip({ selectedDate, onChange }: DateStripProps) {
  const theme = useTheme();
  const styles = useStyles(theme);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Last 7 days (oldest to newest, left to right, ending with Today)
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        iso: toISO(d),
        day: d.getDate(),
        weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
        isToday: (6 - i) === 0,
      };
    });
  }, []);

  const handlePill = useCallback((iso: string) => {
    onChange(selectedDate === iso ? null : iso);
  }, [selectedDate, onChange]);

  const todayLabel = selectedDate
    ? (() => {
        const d = new Date(selectedDate);
        return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
      })()
    : null;

  return (
    <View style={styles.strip.root}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip.scroll}
      >
        {/* Calendar open button */}
        <Pressable
          style={[
            styles.strip.calBtn,
            (calendarOpen || selectedDate !== null) && styles.strip.calBtnActive
          ]}
          onPress={() => setCalendarOpen(true)}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={(calendarOpen || selectedDate !== null) ? '#FFF' : theme.primary}
          />
          {todayLabel && !days.some((d) => d.iso === selectedDate) && (
            <ThemedText style={[
              styles.strip.calBtnLabel,
              (calendarOpen || selectedDate !== null) && { color: '#FFF' }
            ]}>{todayLabel}</ThemedText>
          )}
        </Pressable>

        {/* "All" reset pill — always visible, clears date filter */}
        <Pressable
          style={[
            styles.strip.pill,
            selectedDate === null && styles.strip.pillActive,
          ]}
          onPress={() => onChange(null)}
        >
          <ThemedText style={[
            styles.strip.pillWeekday,
            selectedDate === null && styles.strip.pillTextActive,
          ]}>All</ThemedText>
          <ThemedText style={[
            styles.strip.pillDay,
            selectedDate === null && styles.strip.pillTextActive,
          ]}>✓</ThemedText>
        </Pressable>

        {/* 7-day pills */}
        {days.map((d) => {
          const active = selectedDate === d.iso;
          return (
            <Pressable
              key={d.iso}
              style={[
                styles.strip.pill,
                d.isToday && styles.strip.pillToday,
                active && styles.strip.pillActive,
              ]}
              onPress={() => handlePill(d.iso)}
            >
              <ThemedText style={[
                styles.strip.pillWeekday,
                d.isToday && styles.strip.pillWeekdayToday,
                active && styles.strip.pillTextActive,
              ]}>
                {d.isToday ? 'Today' : d.weekday}
              </ThemedText>
              <ThemedText style={[
                styles.strip.pillDay,
                d.isToday && styles.strip.pillDayToday,
                active && styles.strip.pillTextActive,
              ]}>
                {d.day}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      <CalendarModal
        visible={calendarOpen}
        selectedDate={selectedDate}
        onSelect={(iso) => { onChange(iso); }}
        onClear={() => onChange(null)}
        onClose={() => setCalendarOpen(false)}
      />
    </View>
  );
}

// ─── Styles hook ──────────────────────────────────────────────────────────────

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  return useMemo(() => {
    const strip = StyleSheet.create({
      root: {
        paddingVertical: 12,
      },
      scroll: {
        paddingHorizontal: 8,
        gap: 8,
        flexDirection: 'row',
        alignItems: 'stretch',
      },

      // Calendar icon button
      calBtn: {
        width: 44,
        height: 60,
        borderRadius: 12,
        backgroundColor: theme.card,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        paddingHorizontal: 6,
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
      },
      calBtnActive: {
        backgroundColor: theme.primary,
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
      },
      calBtnLabel: {
        fontSize: 8,
        fontWeight: '700',
        color: theme.primary,
        textAlign: 'center',
      },

      // Day pills - flat design, no borders on inactive
      pill: {
        width: 52,
        height: 60,
        borderRadius: 12,
        backgroundColor: theme.backgroundElement,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      },
      pillToday: {
        backgroundColor: '#000000',
      },
      pillActive: {
        backgroundColor: theme.primary,
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
      },
      pillWeekday: {
        fontSize: 10,
        fontWeight: '600',
        color: theme.textSecondary,
        textAlign: 'center',
      },
      pillWeekdayToday: {
        color: '#FFFFFF',
        fontWeight: '700',
      },
      pillDay: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
        lineHeight: 20,
        textAlign: 'center',
        includeFontPadding: false,
      },
      pillDayToday: {
        color: '#FFFFFF',
      },
      pillTextActive: {
        color: '#FFFFFF',
      },
    });

    // ─── Calendar modal styles ────────────────────────────────────────────────

    const cal = StyleSheet.create({
      overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
      },
      backdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0,0,0,0.52)',
      },
      sheet: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: theme.primary,
        borderRadius: 24,
        padding: 16,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
      },

      // Month nav
      navRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 4,
      },
      navBtn: {
        width: 32, height: 32, borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center', justifyContent: 'center',
      },
      monthLabel: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
      },

      // Day-of-week headers
      weekRow: {
        flexDirection: 'row',
      },
      weekLabel: {
        flex: 1,
        textAlign: 'center',
        fontSize: 11,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.72)',
      },

      // Grid
      grid: {
        gap: 2,
      },
      row: {
        flexDirection: 'row',
        width: '100%',
        gap: 2,
      },
      cell: {
        flex: 1,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
      },
      cellSelected: {
        backgroundColor: theme.primary,
        borderRadius: 8,
      },
      cellToday: {
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
        borderRadius: 8,
      },
      cellText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 13,
        includeFontPadding: false,
      },
      cellTextSelected: {
        color: '#FFFFFF',
        fontWeight: '800',
      },
      cellTextToday: {
        color: '#FFFFFF',
        fontWeight: '800',
      },

      // Actions
      actions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
      },
      clearBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
      },
      clearText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
      },
      doneBtn: {
        flex: 2,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
      },
      doneText: {
        fontSize: 14,
        fontWeight: '800',
        color: theme.primary,
      },
    });

    return { strip, cal };
  }, [theme]);
};
