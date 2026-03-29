import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

/** Status pill — auto-colors based on value */
export function StatusBadge({ label = '' }) {
  const T = useTheme();
  const scheme = getScheme(label, T);
  return (
    <View style={[s.badge, { backgroundColor: scheme.bg, borderColor: scheme.border }]}>
      <Text style={[s.label, { color: scheme.text, fontFamily: T.font }]}>{label}</Text>
    </View>
  );
}

/** A labelled key-value row used inside modals */
export function DetailRow({ label, value, children, last }) {
  const T = useTheme();
  return (
    <View style={[s.detailRow, { borderBottomColor: T.border }, last && { borderBottomWidth: 0 }]}>
      <Text style={[s.detailLabel, { color: T.textMuted, fontFamily: T.font }]}>{label}</Text>
      {children ?? <Text style={[s.detailValue, { color: T.text, fontFamily: T.font }]}>{value ?? '—'}</Text>}
    </View>
  );
}

/** A titled card section used inside modals */
export function InfoCard({ title, children, style }) {
  const T = useTheme();
  return (
    <View style={[s.infoCard, { backgroundColor: T.surfaceAlt, borderColor: T.border }, style]}>
      {title ? <Text style={[s.infoCardTitle, { color: T.textFaint, fontFamily: T.font }]}>{title}</Text> : null}
      {children}
    </View>
  );
}

/** Horizontal filter chip row wrapper */
export function ChipRow({ children }) {
  return <View style={s.chipRow}>{children}</View>;
}

/** Single filter chip / pill */
export function Chip({ label, active, onPress }) {
  const { TouchableOpacity } = require('react-native');
  const T = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        s.chip,
        { backgroundColor: T.surface, borderColor: T.border },
        active && { backgroundColor: T.primary, borderColor: T.primary }
      ]}
    >
      <Text style={[
        s.chipText,
        { color: active ? T.primaryText : T.textMuted, fontFamily: T.font }
      ]}>{label}</Text>
    </TouchableOpacity>
  );
}

function getScheme(label = '', T) {
  const l = label.toLowerCase();
  if (l === 'active')   return { bg: T.successBg,  border: T.successBorder, text: T.success };
  if (l === 'inactive') return { bg: T.dangerBg,   border: T.dangerBorder,  text: T.danger };
  if (l === 'admin')    return { bg: T.dangerBg,   border: T.dangerBorder,  text: T.danger };
  if (l.includes('owner')) return { bg: T.primaryLight, border: T.primaryLight, text: T.primary };
  return { bg: T.surfaceAlt, border: T.border, text: T.textMuted };
}

const s = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    borderWidth: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    gap: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1.5,
    textAlign: 'right',
  },
  infoCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    gap: 0,
  },
  infoCardTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
