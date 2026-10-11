import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useCurrency } from '@/hooks/use-currency';
import { useRBAC } from '@/hooks/use-rbac';
import { getCurrentUser } from '@/services/auth.service';
import { repairService, type Repair } from '@/features/repairs/services/repair.service';
import { vehicleService } from '@/features/vehicles/services/vehicle.service';
import { billService, type BillListItem } from '@/features/repairs/services/bill.service';
import CreateRepairScreen from '@/features/repairs/CreateRepairScreen';
import CreateCustomerScreen from '@/features/customers/CreateCustomerScreen';
import CreateVehicleScreen from '@/features/vehicles/CreateVehicleScreen';
import InvoicesListScreen from '@/features/invoices/InvoicesListScreen';
import ViewRepairScreen from '@/features/repairs/ViewRepairScreen';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { UI } from '@/constants/theme';
import {
  AppScreen,
  AttentionList,
  DashboardHeader,
  ErrorState,
  LoadingState,
  MetricsRow,
  PrimaryButton,
  ProgressDistributionBar,
  ScheduleRow,
  SectionHeader,
  VehicleImage,
  WeeklyActivityCard,
  useWideLayout,
  type AttentionItem,
} from '@/components/design-system';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatNumber(n: number): string {
  if (n >= 10000000) return (n / 10000000).toFixed(1) + 'Cr';
  if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function toTime(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function isToday(value?: string | null): boolean {
  if (!value) return false;
  const d = new Date(value);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export default function DashboardHome() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const wide = useWideLayout();
  const user = useMemo(() => getCurrentUser(), []);
  const { format: formatCurrency } = useCurrency(user);
  const { user: rbacUser } = useRBAC();

  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [completedAll, setCompletedAll] = useState<Repair[]>([]);
  const [vehicleCount, setVehicleCount] = useState<number | null>(null);
  const [billsError, setBillsError] = useState(false);
  const [recentBills, setRecentBills] = useState<BillListItem[]>([]);
  const [totalRepairs, setTotalRepairs] = useState<number | null>(null);
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showRepairModal, setShowRepairModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);

  const isWorker = rbacUser?.role && !['super-admin', 'admin', 'shop-owner'].includes(rbacUser.role);

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const [sRes, vRes, liveRes, billsRes] = await Promise.all([
        repairService.getStats(), vehicleService.getAll(), repairService.getAll(), billService.getAll(),
      ]);
      setTotalRepairs(sRes.success ? sRes.data?.totalRepairs ?? null : null);
      setTotalRevenue(sRes.success ? sRes.data?.totalRevenue ?? null : null);
      setVehicleCount(vRes.success && vRes.data ? vRes.data.length : null);
      if (!liveRes.success || !liveRes.data) {
        setError(liveRes.error || 'Could not load repairs');
      } else {
        const name = (rbacUser?.ownerName || '').trim().toLowerCase();
        const all = liveRes.data.filter((r) => !isWorker || (
          r.attending_worker_id != null
            ? String(r.attending_worker_id) === String(rbacUser?.userId)
            : !!name && (r.attending_worker_name || '').trim().toLowerCase() === name
        ));
        setRepairs(all.filter((r) => r.status !== 'Completed'));
        setCompletedAll(all.filter((r) => r.status === 'Completed'));
      }
      setBillsError(!billsRes.success || !billsRes.data);
      setRecentBills(billsRes.success && billsRes.data
        ? [...billsRes.data].sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()).slice(0, 5)
        : []);
    } catch {
      setError('Could not load workshop data. Please try again.');
    }
  }, [isWorker, rbacUser?.userId, rbacUser?.ownerName]);

  const fetchData = useCallback(() => {
    setLoading(true);
    loadAll().finally(() => setLoading(false));
  }, [loadAll]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const now = new Date();
  const greeting = getGreeting();
  const dateStr = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  const displayName = user?.ownerName || user?.shopName || 'User';

  const active = repairs.filter((r) => r.status === 'Started');
  const completed = completedAll;
  const waiting = repairs.filter((r) => r.status === 'Pending');

  const activeRepair: Repair | null =
    [...active].sort(
      (a, b) => new Date(b.repair_date || b.created_at).getTime() - new Date(a.repair_date || a.created_at).getTime(),
    )[0] ??
    [...waiting].sort(
      (a, b) => new Date(b.repair_date || b.created_at).getTime() - new Date(a.repair_date || a.created_at).getTime(),
    )[0] ??
    null;

  const weekly = useMemo(() => {
    const days: { label: string; value: number; key: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({ label: 'SMTWTFS'[d.getDay()], value: 0, key: d.toDateString() });
    }
    const byDay = new Map(days.map((d) => [d.key, d]));
    [...repairs, ...completedAll].forEach((r) => {
      const d = new Date(r.created_at);
      if (isNaN(d.getTime())) return;
      const slot = byDay.get(d.toDateString());
      if (slot) slot.value += 1;
    });
    return days;
  }, [repairs, completedAll]);
  const weeklyTotal = weekly.reduce((a, d) => a + d.value, 0);

  const attention: AttentionItem[] = useMemo(() => {
    const list: AttentionItem[] = [];
    if (waiting.length > 0) {
      list.push({ key: 'pending', icon: 'time-outline', title: 'Pending repairs',
        subtitle: 'Jobs with pending status', count: waiting.length });
    }
    const urgent = repairs.filter((r) => r.priority === 'High' || r.priority === 'Urgent');
    if (urgent.length > 0) {
      list.push({ key: 'priority', icon: 'construct-outline', title: 'Priority repairs',
        subtitle: 'Open jobs marked high or urgent', count: urgent.length });
    }
    return list;
  }, [repairs, waiting]);

  const openAttention = useCallback(
    (key: string) => {
      const pick = key === 'priority'
        ? repairs.find((r) => r.priority === 'High' || r.priority === 'Urgent')
        : waiting[0];
      if (pick) setSelectedRepair(pick);
      else router.push('/(tabs)/repairs');
    },
    [repairs, waiting, router],
  );

  const schedule = useMemo(
    () =>
      [...repairs]
        .filter((r) => isToday(r.expected_completion))
        .sort(
          (a, b) =>
            new Date(a.expected_completion || '').getTime() -
            new Date(b.expected_completion || '').getTime(),
        ),
    [repairs],
  );

  const handleRepairUpdate = useCallback(
    (updated: Repair) => {
      setRepairs((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setSelectedRepair(updated);
      loadAll();
    },
    [loadAll],
  );

  const branchName = user?.shopName || 'My Workshop';
  const avatarLabel = ((displayName[0] || 'R') + '').toUpperCase();

  return (
    <ThemedView style={{ flex: 1 }}>
      <AppScreen>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 110,
            paddingHorizontal: 20,
            gap: 20,
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        >
          <DashboardHeader
            branch={branchName}
            greeting={`${greeting}, ${displayName}`}
            date={dateStr}
            pendingCount={loading || error ? 0 : waiting.length}
            avatarLabel={avatarLabel}
            avatarUri={user?.profile_image}
            onBranchPress={() => router.push('/(tabs)/settings')}
            onRepairsPress={() => router.push('/(tabs)/repairs')}
            onProfilePress={() => router.push('/(tabs)/settings')}
          />

          {loading ? (
            <LoadingState message="Loading workshop…" />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchData} />
          ) : (
            <>
              <MetricsRow
                metrics={[
                  { key: 'active', value: String(active.length), label: 'Active jobs', icon: 'construct-outline' },
                  { key: 'completed', value: String(completed.length), label: 'Completed', icon: 'checkmark-circle-outline' },
                  { key: 'waiting', value: String(waiting.length), label: 'Pending', icon: 'time-outline' },
                ]}
              />

              <View style={{ gap: 10 }}>
                <Text style={[ds.sectionTitle, { color: theme.textSecondary }]}>Repair status</Text>
                <ProgressDistributionBar
                  segments={[
                    { key: 'progress', label: 'In progress', value: active.length, color: theme.dark },
                    { key: 'completed', label: 'Completed', value: completed.length, color: theme.accent },
                    { key: 'waiting', label: 'Pending', value: waiting.length, color: theme.textSecondary },
                  ]}
                />
              </View>

              <View style={{ gap: 10 }}>
                <Text style={[ds.sectionTitle, { color: theme.textSecondary }]}>Current job</Text>
                {activeRepair ? (
                  <View style={{ flexDirection: 'column', gap: 12 }}>
                    <View style={[ds.activeCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <Pressable onPress={() => setSelectedRepair(activeRepair)} accessibilityLabel="Open active repair"><VehicleImage uri={activeRepair.vehicle_image || activeRepair.images?.[0]} aspect={UI.heroAspect} /></Pressable>
                      <View style={ds.activeBody}>
                        <Text style={[ds.activeModel, { color: theme.text }]} numberOfLines={1}>
                          {activeRepair.brand || activeRepair.model_name
                            ? `${activeRepair.brand || ''} ${activeRepair.model_name || ''}`.trim()
                            : 'Unspecified model'}
                        </Text>
                        <Text style={[ds.activePlate, { color: theme.textSecondary }]} numberOfLines={1}>
                          {activeRepair.vehicle_number}
                          {activeRepair.service_type ? ` · ${activeRepair.service_type}` : ''}
                        </Text>
                        <View style={ds.activeBadgeRow}>
                          <StatusBadge status={activeRepair.status} size="sm" dot />
                        </View>
                      </View>
                    </View>
                  </View>
                ) : (
                  <EmptyState
                    icon="construct-outline"
                    title="No active repairs"
                    subtitle="Your pending and in-progress jobs will appear here."
                    action={<PrimaryButton title="New repair" onPress={() => setShowRepairModal(true)} />}
                  />
                )}
              </View>

              <View style={{ flexDirection: wide ? 'row' : 'column', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ gap: 10 }}>
                    <Text style={[ds.sectionTitle, { color: theme.textSecondary }]}>Jobs added this week</Text>
                    <WeeklyActivityCard total={String(weeklyTotal)} days={weekly} highlightIndex={6} subtitle="Jobs created" />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ gap: 10 }}>
                    <Text style={[ds.sectionTitle, { color: theme.textSecondary }]}>Workshop figures</Text>
                    <View style={[ds.figuresCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <View style={ds.figureRow}>
                        <Text style={[ds.figureLabel, { color: theme.textSecondary }]}>Total repairs</Text>
                        <Text style={[ds.figureValue, { color: theme.text }]}>{totalRepairs === null ? 'Unavailable' : formatNumber(totalRepairs)}</Text>
                      </View>
                      <View style={[ds.figureRow, ds.figureDivided, { borderTopColor: theme.divider }]}>
                        <Text style={[ds.figureLabel, { color: theme.textSecondary }]}>Vehicles</Text>
                        <Text style={[ds.figureValue, { color: theme.text }]}>{vehicleCount ?? '—'}</Text>
                      </View>
                      <View style={[ds.figureRow, ds.figureDivided, { borderTopColor: theme.divider }]}>
                        <Text style={[ds.figureLabel, { color: theme.textSecondary }]}>Revenue</Text>
                        <Text style={[ds.figureValue, { color: theme.text }]}>{totalRevenue === null ? 'Unavailable' : formatCurrency(totalRevenue)}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              <View style={{ gap: 10 }}>
                <Text style={[ds.sectionTitle, { color: theme.textSecondary }]}>Needs attention</Text>
                <AttentionList items={attention} onPress={openAttention} />
              </View>

              <View style={{ gap: 10 }}>
                <SectionHeader title="Quick actions" />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {(
                    [
                      { icon: 'add-circle-outline' as const, label: 'New repair', onPress: () => setShowRepairModal(true) },
                      { icon: 'car-outline' as const, label: 'New vehicle', onPress: () => setShowVehicleModal(true) },
                      { icon: 'person-add-outline' as const, label: 'New customer', onPress: () => setShowCustomerModal(true) },
                    ]
                  ).map((a) => (
                    <Pressable
                      key={a.label}
                      onPress={a.onPress}
                      style={({ pressed }) => [
                        ds.quickCard,
                        { backgroundColor: theme.card, borderColor: theme.border },
                        pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] },
                      ]}
                    >
                      <View style={[ds.quickIcon, { backgroundColor: theme.backgroundElement }]}>
                        <Ionicons name={a.icon} size={20} color={theme.text} />
                      </View>
                      <Text style={[ds.quickLabel, { color: theme.text }]} numberOfLines={2}>
                        {a.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={{ gap: 4 }}>
                <SectionHeader title="Due today" actionLabel={schedule.length > 0 ? `${schedule.length} today` : undefined} />
                <View style={[ds.scheduleCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  {schedule.length === 0 ? (
                    <Text style={[ds.scheduleEmpty, { color: theme.textSecondary }]}>No open repairs due today</Text>
                  ) : (
                    schedule.map((r, i) => (
                      <ScheduleRow
                        key={r.id}
                        time={toTime(r.expected_completion)}
                        imageUri={r.vehicle_image || r.images?.[0]}
                        title={r.vehicle_number}
                        subtitle={`${r.model_name || r.vehicle_type || 'Vehicle'} · ${r.service_type || 'Service'}`}
                        last={i === schedule.length - 1}
                        onPress={() => setSelectedRepair(r)}
                      />
                    ))
                  )}
                </View>
              </View>

              <View style={{ gap: 4 }}>
                <SectionHeader title="Recent invoices" actionLabel="View all" onAction={() => setShowInvoicesModal(true)} />
                <View style={[ds.scheduleCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  {billsError ? (
                    <Text style={[ds.scheduleEmpty, { color: theme.textSecondary }]}>Could not load invoices. Pull down to retry.</Text>
                  ) : recentBills.length === 0 ? (
                    <Text style={[ds.scheduleEmpty, { color: theme.textSecondary }]}>No invoices yet</Text>
                  ) : (
                    recentBills.map((bill, i) => (
                      <ScheduleRow
                        key={bill.id}
                        time={toTime(bill.created_at)}
                        imageUri={bill.vehicle_image}
                        title={bill.vehicle_number || `#${bill.id}`}
                        subtitle={`${bill.owner_name || 'Customer'} · ${formatCurrency(bill.total_amount)}`}
                        last={i === recentBills.length - 1}
                        onPress={() => setShowInvoicesModal(true)}
                      />
                    ))
                  )}
                </View>
              </View>
            </>
          )}

        </ScrollView>

        <Modal visible={showRepairModal} animationType="slide" onRequestClose={() => setShowRepairModal(false)}>
          <CreateRepairScreen mode="create" onClose={() => setShowRepairModal(false)} onSuccess={() => { setShowRepairModal(false); loadAll(); }} />
        </Modal>
        <Modal visible={showCustomerModal} animationType="slide" onRequestClose={() => setShowCustomerModal(false)}>
          <CreateCustomerScreen onClose={() => setShowCustomerModal(false)} onSuccess={() => { setShowCustomerModal(false); loadAll(); }} />
        </Modal>
        <Modal visible={showVehicleModal} animationType="slide" onRequestClose={() => setShowVehicleModal(false)}>
          <CreateVehicleScreen onClose={() => setShowVehicleModal(false)} onSuccess={() => { setShowVehicleModal(false); loadAll(); }} />
        </Modal>
        <Modal visible={showInvoicesModal} animationType="slide" onRequestClose={() => setShowInvoicesModal(false)}>
          <InvoicesListScreen />
        </Modal>
        <Modal visible={!!selectedRepair} animationType="slide" onRequestClose={() => setSelectedRepair(null)}>
          {selectedRepair && (
            <ViewRepairScreen
              repair={selectedRepair}
              onClose={() => setSelectedRepair(null)}
              onEdit={() => setSelectedRepair(null)}
              onUpdateRepair={handleRepairUpdate}
            />
          )}
        </Modal>
      </AppScreen>
    </ThemedView>
  );
}

const ds = StyleSheet.create({
  sectionTitle: { fontSize: 13, fontWeight: '600', paddingLeft: 2 },
  activeCard: {
    flex: 1.2,
    borderWidth: 1,
    borderRadius: UI.card.borderRadius,
    overflow: 'hidden',
  },
  activeBody: { padding: 14, gap: 2 },
  activeModel: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2 },
  activePlate: { fontSize: 13, fontWeight: '500' },
  activeBadgeRow: { flexDirection: 'row', marginTop: 8 },
  figuresCard: { borderWidth: 1, borderRadius: UI.card.borderRadius, paddingHorizontal: 16, paddingVertical: 6 },
  figureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  figureDivided: { borderTopWidth: 1 },
  figureLabel: { fontSize: 13, fontWeight: '500' },
  figureValue: { fontSize: 17, fontWeight: '600', fontVariant: ['tabular-nums'] },
  quickCard: { flex: 1, borderWidth: 1, borderRadius: UI.cardSmallRadius, padding: 14, gap: 10 },
  quickIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 13, fontWeight: '600' },
  scheduleCard: { borderWidth: 1, borderRadius: UI.card.borderRadius, paddingHorizontal: 14, paddingVertical: 4 },
  scheduleEmpty: { fontSize: 13, fontWeight: '500', textAlign: 'center', paddingVertical: 18 },
});
