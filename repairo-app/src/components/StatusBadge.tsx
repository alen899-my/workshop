import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type BadgeSize = 'sm' | 'md';

interface StatusBadgeProps {
  status: string;
  size?: BadgeSize;
  dot?: boolean;
  colorMap?: Record<string, string>;
}

function getColor(status: string, colorMap?: Record<string, string>): string {
  const map = { ...defaultColorMap, ...colorMap };
  return map[status] || defaultColorMap['No Bill'];
}

let defaultColorMap: Record<string, string> = {
  Pending: '#D97706',
  Started: '#0D9488',
  Completed: '#0D9488',
  Paid: '#0D9488',
  Unpaid: '#D97706',
  'No Bill': '#8A8A80',
};

export default function StatusBadge({ status, size = 'sm', dot, colorMap }: StatusBadgeProps) {
  const theme = useTheme();
  defaultColorMap = {
    Pending: theme.warning,
    Started: theme.primary,
    Completed: theme.success,
    Paid: theme.success,
    Unpaid: theme.warning,
    'No Bill': theme.textSecondary,
  };

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
