import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UI } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Repair } from '@/features/repairs/services/repair.service';

export default function WorkshopWorkload({ repairs, loading }: { repairs: Repair[]; loading: boolean }) {
  const theme = useTheme();
  const waiting = repairs.filter((repair) => repair.status === 'Pending').length;
  const started = repairs.filter((repair) => repair.status === 'Started').length;
  const other = Math.max(0, repairs.length - waiting - started);
  const groups = [
    { label: 'Waiting', count: waiting, color: theme.accent },
    { label: 'In service', count: started, color: theme.primary },
    { label: 'Other open', count: other, color: theme.textMuted },
  ];
  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <View style={styles.heading}>
        <Text style={[styles.title, { color: theme.text }]}>Workshop flow</Text>
        <View style={[styles.icon, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name="stats-chart-outline" size={17} color={theme.text} />
        </View>
      </View>
      <View style={styles.summary}>
        <Text style={[styles.value, { color: theme.text }]}>{loading ? '...' : repairs.length}</Text>
        <Text style={[styles.caption, { color: theme.textSecondary }]}>Open jobs{'\n'}in your workshop</Text>
      </View>
      <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}
        accessibilityLabel={loading ? 'Loading workshop jobs' : waiting + ' waiting, ' + started + ' in service, ' + other + ' other open jobs'}>
        {!loading && groups.filter((group) => group.count > 0).map((group) => (
          <View key={group.label} style={{ flex: group.count, backgroundColor: group.color, borderRadius: 8 }} />
        ))}
      </View>
      <View style={styles.legend}>
        {groups.map((group) => (
          <View key={group.label} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: group.color }]} />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>{group.label}</Text>
            <Text style={[styles.legendCount, { color: theme.text }]}>{loading ? '-' : group.count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: UI.card.borderRadius, padding: 20, gap: 18 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 17, fontWeight: '500' },
  icon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  value: { fontSize: 40, fontWeight: '300', letterSpacing: -1.5 },
  caption: { fontSize: 12, lineHeight: 18 },
  track: { height: 28, flexDirection: 'row', gap: 4, borderRadius: 8, overflow: 'hidden' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 11 },
  legendCount: { fontSize: 12, fontWeight: '600' },
});