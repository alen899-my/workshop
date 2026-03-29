import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

// Simple no-animation skeleton block — fast, clean, industry standard
export function Skeleton({ width, height, borderRadius = 8, style }) {
  const T = useTheme();
  return (
    <View style={[{ width, height, borderRadius, backgroundColor: T.borderStrong }, style]} />
  );
}

export function SkeletonCard({ style }) {
  const T = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: T.surface, borderColor: T.border }, style]}>
      <View style={styles.cardRow}>
        <Skeleton width={44} height={44} borderRadius={12} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton width="70%" height={14} borderRadius={6} />
          <Skeleton width="45%" height={11} borderRadius={6} />
        </View>
        <Skeleton width={60} height={24} borderRadius={99} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 4 }) {
  return (
    <View style={{ gap: 12, paddingHorizontal: 16, paddingTop: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
