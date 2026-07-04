import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

type BadgeSize = 'sm' | 'md';

interface StatusBadgeProps {
  status: string;
  size?: BadgeSize;
  dot?: boolean;
  colorMap?: Record<string, string>;
}

const DEFAULT_COLOR_MAP: Record<string, string> = {
  Pending: Colors.warning,
  Started: Colors.info,
  'In Progress': Colors.primary,
  Completed: Colors.success,
  Paid: Colors.success,
  Unpaid: Colors.warning,
  'No Bill': Colors.textSecondary,
};

function getColor(status: string, colorMap?: Record<string, string>): string {
  const map = { ...DEFAULT_COLOR_MAP, ...colorMap };
  return map[status] || Colors.textSecondary;
}

export default function StatusBadge({ status, size = 'sm', dot, colorMap }: StatusBadgeProps) {
  const color = getColor(status, colorMap);
  const isSm = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: color + '1A', borderColor: color + '40' }, isSm ? styles.sm : styles.md]}>
      {dot && <View style={[styles.dot, { backgroundColor: color }]} />}
      <ThemedText style={[styles.text, { color }, isSm ? styles.textSm : styles.textMd]}>
        {status}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    borderRadius: 100, borderWidth: 1,
  },
  sm: { paddingHorizontal: 8, paddingVertical: 2, gap: 4 },
  md: { paddingHorizontal: 12, paddingVertical: 4, gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontWeight: '600' },
  textSm: { fontSize: 11, letterSpacing: 0.2 },
  textMd: { fontSize: 13, letterSpacing: 0.3 },
});
