import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { T } from '../../constants/Theme';

/** Status pill — auto-colors based on value */
export function StatusBadge({ label = '' }) {
  const scheme = getScheme(label);
  return (
    <View style={[s.badge, { backgroundColor: scheme.bg, borderColor: scheme.border }]}>
      <Text style={[s.label, { color: scheme.text }]}>{label}</Text>
    </View>
  );
}

/** A labelled key-value row used inside modals */
export function DetailRow({ label, value, children, last }) {
  return (
    <View style={[s.detailRow, last && { borderBottomWidth: 0 }]}>
      <Text style={s.detailLabel}>{label}</Text>
      {children ?? <Text style={s.detailValue}>{value ?? '—'}</Text>}
    </View>
  );
}

/** A titled card section used inside modals */
export function InfoCard({ title, children, style }) {
  return (
    <View style={[s.infoCard, style]}>
      {title ? <Text style={s.infoCardTitle}>{title}</Text> : null}
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
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[s.chip, active && s.chipActive]}
    >
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function getScheme(label = '') {
  const l = label.toLowerCase();
  if (l === 'active')   return { bg: T.successBg,  border: T.successBorder, text: T.success };
  if (l === 'inactive') return { bg: T.dangerBg,   border: T.dangerBorder,  text: T.danger };
  if (l === 'admin')    return { bg: T.dangerBg,   border: T.dangerBorder,  text: T.danger };
  if (l.includes('owner')) return { bg: T.primaryLight, border: '#C3D9F0', text: T.primary };
  return { bg: '#F1F5F9', border: '#E2E8F0', text: T.textMuted };
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
    fontFamily: T.font,
    textTransform: 'capitalize',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    gap: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: T.textMuted,
    fontFamily: T.font,
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    color: T.text,
    fontFamily: T.font,
    fontWeight: '600',
    flex: 1.5,
    textAlign: 'right',
  },
  infoCard: {
    backgroundColor: T.surfaceAlt,
    borderRadius: T.radius,
    borderWidth: 1,
    borderColor: T.border,
    padding: 14,
    gap: 0,
  },
  infoCardTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: T.textFaint,
    fontFamily: T.font,
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
    borderColor: T.border,
    backgroundColor: T.surface,
  },
  chipActive: {
    backgroundColor: T.primary,
    borderColor: T.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: T.textMuted,
    fontFamily: T.font,
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: T.primaryText,
  },
});
