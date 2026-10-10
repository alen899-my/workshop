import { UI } from '@/constants/theme';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Dimensions,
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
import { Image } from 'expo-image';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useCurrency } from '@/hooks/use-currency';
import { useRBAC } from '@/hooks/use-rbac';
import { getCurrentUser } from '@/services/auth.service';
import { repairService } from '@/features/repairs/services/repair.service';
import { vehicleService } from '@/features/vehicles/services/vehicle.service';
import { billService, type BillListItem } from '@/features/repairs/services/bill.service';
import { userService } from '@/features/users/services/user.service';
import type { Repair } from '@/features/repairs/services/repair.service';
import CreateRepairScreen from '@/features/repairs/CreateRepairScreen';
import CreateCustomerScreen from '@/features/customers/CreateCustomerScreen';
import CreateVehicleScreen from '@/features/vehicles/CreateVehicleScreen';
import InvoicesListScreen from '@/features/invoices/InvoicesListScreen';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_GAP = 12;
const GRID_PADDING = 16;
const HALF_W = (SCREEN_W - GRID_PADDING * 2 - CARD_GAP) / 2;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}


function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface DashboardStats {
  totalRepairs: number;
  pendingRepairs: number;
  totalRevenue: number;
  recentRepairs: {
    id: number;
    vehicle_number: string;
    owner_name?: string;
    status: string;
    service_type: string;
    created_at: string;
  }[];
  avgCompletionHours: string;
  workers: { id: number; name: string; role: string; active_jobs: string }[];
}

function formatNumber(n: number): string {
  if (n >= 10000000) return (n / 10000000).toFixed(1) + 'Cr';
  if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

// Shared dashboard card.
function DashboardCard({
  tabColor,
  tabIcon,
  compact = false,
  dashed = false,
  style,
  children,
}: {
  tabColor?: string;
  tabIcon?: keyof typeof Ionicons.glyphMap;
  compact?: boolean;
  dashed?: boolean;
  style?: any;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={[plate.outer, { backgroundColor: theme.card, borderColor: theme.border }, dashed && plate.outerDashed, style]}>
      <View style={plate.body}>
        {tabColor && (
          <View style={[plate.tab, compact && plate.tabCompact, { backgroundColor: theme.backgroundElement, borderRightColor: theme.border }]}>
            {tabIcon && <Ionicons name={tabIcon} size={compact ? 16 : 20} color={theme.textSecondary} />}
          </View>
        )}
        <View style={[plate.content, compact && plate.contentCompact]}>{children}</View>
      </View>
    </View>
  );
}

function SectionDivider({ color }: { color: string }) {
  return <View style={{ height: 1, backgroundColor: color, marginTop: 8 }} />;
}

export default function DashboardHome() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const user = useMemo(() => getCurrentUser(), []);
  const { format: formatCurrency } = useCurrency(user);
  const { user: rbacUser } = useRBAC();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [vehicleCount, setVehicleCount] = useState<number | null>(null);
  const [liveRepairs, setLiveRepairs] = useState<Repair[]>([]);
  const [recentBills, setRecentBills] = useState<BillListItem[]>([]);
  const [workerCount, setWorkerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showRepairModal, setShowRepairModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);

  const isWorker = rbacUser?.role && !['super-admin', 'admin', 'shop-owner'].includes(rbacUser.role);

  const loadAll = useCallback(async () => {
    const [sRes, vRes, liveRes, billsRes, usersRes] = await Promise.all([
      repairService.getStats(),
      vehicleService.getAll(),
      repairService.getAll(),
      billService.getAll(),
      userService.getAll('active'),
    ]);
    if (sRes.success && sRes.data) setStats(sRes.data);
    if (vRes.success) setVehicleCount(vRes.data?.length ?? 0);

    if (liveRes.success) {
      const all = (liveRes.data || []).filter((r) => r.status !== 'Completed');
      if (isWorker && rbacUser?.userId) {
        const name = (rbacUser.ownerName || '').toLowerCase();
        setLiveRepairs(all.filter((r) => (r.attending_worker_name || '').toLowerCase() === name));
      } else {
        setLiveRepairs(all);
      }
    }

    if (billsRes.success && billsRes.data) {
      setRecentBills(
        billsRes.data
          .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
          .slice(0, 5),
      );
    }

    if (usersRes.success) {
      const workers = usersRes.data.filter((u) => u.role === 'worker' || u.role === 'mechanic');
      setWorkerCount(workers.length);
    }
  }, [isWorker, rbacUser?.userId, rbacUser?.ownerName]);

  const fetchData = useCallback(() => {
    setLoading(true);
    loadAll().finally(() => setLoading(false));
  }, [loadAll]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const now = new Date();
  const dayName = DAYS[now.getDay()];
  const dateStr = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  const greeting = getGreeting();
  const displayName = user?.ownerName || user?.shopName || 'User';

  const activeWorkers = stats?.workers?.filter((w) => Number(w.active_jobs) > 0).length || 0;
  const availableWorkers = Math.max(0, workerCount - activeWorkers);
  const workerTotal = Math.max(workerCount, 1);
  const gaugePct = Math.min(100, Math.max(0, (activeWorkers / workerTotal) * 100));

  const accent: Record<string, string> = useMemo(() => ({
    header: theme.tealDeep,
    repairs: theme.primary,
    pending: theme.warning,
    revenue: theme.success,
    vehicles: theme.tealMid,
    repair: theme.primary,
    customer: theme.tealMid,
    vehicle: theme.tealMid,
    workers: theme.tealDeep,
  }), [theme]);

  const s = useMemo(() => ({
    headerRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12 },
    headerGreeting: { fontSize: 11, fontWeight: '700' as const, color: theme.textSecondary, letterSpacing: 0 },
    headerName: { fontSize: 21, fontWeight: '600' as const, color: theme.text, letterSpacing: 0 },
    headerDate: { fontSize: 12, fontWeight: '600' as const, color: theme.textSecondary, marginTop: 1 },
    medallion: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: theme.card },
    medallionText: { fontSize: 17, fontWeight: '600' as const },
    statsGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: CARD_GAP },
    statValue: { fontSize: 20, fontWeight: '600' as const, color: theme.text, letterSpacing: 0 },
    statLabel: { fontSize: 11, fontWeight: '700' as const, color: theme.textSecondary, letterSpacing: 0 },
    sectionTitle: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0, paddingLeft: 2 },
    sectionHeader: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, justifyContent: 'space-between' as const, paddingRight: 2 },
    countPlate: { alignSelf: 'flex-start' as const },
    countPlateText: { fontSize: 13, fontWeight: '600' as const, color: theme.text },
    actionLabel: { fontSize: 11, fontWeight: '600' as const, color: theme.text, letterSpacing: 0 },
    repairRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 },
    plateSerial: { fontSize: 15.5, fontWeight: '600' as const, color: theme.text, letterSpacing: 0 },
    repairMeta: { fontSize: 12, fontWeight: '600' as const, color: theme.textSecondary },
    badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1 },
    badgeText: { fontSize: 10.5, fontWeight: '600' as const },
    viewAllBtn: { alignItems: 'center' as const, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
    viewAllText: { fontSize: 13, fontWeight: '600' as const },
    emptyText: { fontSize: 12.5, fontWeight: '600' as const, color: theme.textSecondary },
    workerRow: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingVertical: 4 },
    workerStat: { flex: 1, alignItems: 'center' as const, gap: 4 },
    workerDot: { width: 9, height: 9, borderRadius: 4.5 },
    workerStatValue: { fontSize: 20, fontWeight: '600' as const, color: theme.text },
    workerStatLabel: { fontSize: 10.5, fontWeight: '700' as const, color: theme.textSecondary },
    workerDivider: { width: 1.5, height: 30, backgroundColor: theme.border },
    gaugeOuter: { marginTop: 14, position: 'relative' as const },
    gaugeTrack: { height: 6, borderRadius: 3, backgroundColor: theme.border, overflow: 'hidden' as const },
    gaugeFill: { height: 6, borderRadius: 3, backgroundColor: theme.warning },
    billRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 },
    billAmount: { fontSize: 16, fontWeight: '600' as const, color: theme.primary },
    viewAllLink: { fontSize: 13, fontWeight: '700' as const },
  }), [theme]);

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 16,
          gap: 22,
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Dashboard section */}
        <DashboardCard tabColor={accent.header} tabIcon="car-sport">
          <View style={s.headerRow}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={s.headerGreeting}>{greeting}</Text>
              <Text style={s.headerName} numberOfLines={1}>{displayName}</Text>
              <Text style={s.headerDate}>{dayName}, {dateStr}</Text>
            </View>
            {user?.profile_image ? (
              <Image source={{ uri: user.profile_image }} style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: accent.header, backgroundColor: theme.primary + '18' }} contentFit="cover" />
            ) : (
              <View style={[s.medallion, { borderColor: accent.header }]}>
                <Text style={[s.medallionText, { color: accent.header }]}>{(displayName[0] || 'R').toUpperCase()}</Text>
              </View>
            )}
          </View>
        </DashboardCard>

        {/* Dashboard section */}
        {loading ? (
          <View style={s.statsGrid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <DashboardCard key={i} style={{ width: HALF_W }}>
                <View style={{ paddingVertical: 14, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={theme.text} />
                </View>
              </DashboardCard>
            ))}
          </View>
        ) : (
          <View style={{ gap: CARD_GAP }}>
            <View style={{ flexDirection: 'row', gap: CARD_GAP }}>
              {[
                { label: 'Total Repairs', value: formatNumber(stats?.totalRepairs ?? 0), icon: 'build-outline' as const, key: 'repairs' },
                { label: 'Total Vehicles', value: formatNumber(vehicleCount ?? 0), icon: 'car-outline' as const, key: 'vehicles' },
              ].map((card) => (
                <DashboardCard key={card.label} tabColor={accent[card.key]} tabIcon={card.icon} style={{ flex: 1 }}>
                  <Text style={s.statValue} numberOfLines={1}>{card.value}</Text>
                  <Text style={s.statLabel}>{card.label}</Text>
                </DashboardCard>
              ))}
            </View>
            <DashboardCard tabColor={accent.revenue} tabIcon="cash-outline" style={{ width: '100%' }}>
              <Text style={s.statValue} numberOfLines={1}>{stats ? formatCurrency(stats.totalRevenue) : '\u2014'}</Text>
              <Text style={s.statLabel}>Revenue</Text>
            </DashboardCard>
          </View>
        )}

        {/* Dashboard section */}
        <View style={{ gap: 10 }}>
          <Text style={[s.sectionTitle, { color: theme.textSecondary }]}>QUICK ACTIONS</Text>
          <SectionDivider color={theme.border} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP, marginTop: 4 }}>
            {[
              { icon: 'construct-outline' as const, label: 'New Repair', onPress: () => setShowRepairModal(true), key: 'repair' },

              { icon: 'car-outline' as const, label: 'New Vehicle', onPress: () => setShowVehicleModal(true), key: 'vehicle' },
            ].map((action) => (
              <Pressable
                key={action.label}
                onPress={action.onPress}
                style={({ pressed }) => [{ flexBasis: 0, flexGrow: 1, flexShrink: 1, minWidth: 130 }, pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] }]}
              >
                <DashboardCard tabColor={accent[action.key]} tabIcon={action.icon} compact>
                  <Text style={s.actionLabel} numberOfLines={2}>{action.label}</Text>
                </DashboardCard>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Dashboard section */}
        <View style={{ gap: 10 }}>
          <View style={s.sectionHeader}>
            <View>
              <Text style={[s.sectionTitle, { color: theme.textSecondary }]}>VEHICLES ON REPAIR</Text>
              <SectionDivider color={theme.border} />
            </View>
            {liveRepairs.length > 0 && (
              <DashboardCard compact style={s.countPlate}>
                <Text style={s.countPlateText}>{liveRepairs.length}</Text>
              </DashboardCard>
            )}
          </View>
          {loading ? (
            <DashboardCard dashed>
              <View style={{ paddingVertical: 18, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={theme.text} />
                </View>
              </DashboardCard>
            ) : liveRepairs.length > 0 ? (
            <View style={{ gap: 10 }}>
              {liveRepairs.slice(0, 4).map((repair) => (
                <DashboardCard key={repair.id} tabColor={accent.pending} tabIcon="car-sport-outline">
                  <View style={s.repairRow}>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={s.plateSerial} numberOfLines={1}>{repair.vehicle_number}</Text>
                      <Text style={s.repairMeta} numberOfLines={1}>
                        {repair.model_name || repair.service_type || ''}
                        {repair.attending_worker_name ? ` \u00B7 ${repair.attending_worker_name}` : ''}
                      </Text>
                    </View>
                    <View style={[s.badge, { backgroundColor: theme.warning + '18', borderColor: theme.warning + '55' }]}>
                      <Text style={[s.badgeText, { color: theme.warning }]}>{repair.status}</Text>
                    </View>
                  </View>
                </DashboardCard>
              ))}
              {liveRepairs.length > 4 && (
                <Pressable
                  style={({ pressed }) => [s.viewAllBtn, { borderColor: theme.border }, pressed && { opacity: 0.7 }]}
                  onPress={() => {}}
                >
                  <Text style={[s.viewAllText, { color: theme.primary }]}>View all {liveRepairs.length} repairs</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <DashboardCard dashed>
              <View style={{ paddingVertical: 20, alignItems: 'center', gap: 8 }}>
                <Ionicons name="checkmark-circle-outline" size={28} color={theme.textSecondary} />
                <Text style={s.emptyText}>No vehicles in repair right now</Text>
              </View>
            </DashboardCard>
          )}
        </View>

        {/* Dashboard section */}
        <View style={{ gap: 10 }}>
          <Text style={[s.sectionTitle, { color: theme.textSecondary }]}>WORKERS</Text>
          <SectionDivider color={theme.border} />
          <DashboardCard tabColor={accent.workers} tabIcon="people-outline">
            <View style={s.workerRow}>
              <View style={s.workerStat}>
                <View style={[s.workerDot, { backgroundColor: theme.success }]} />
                <Text style={s.workerStatValue}>{availableWorkers}</Text>
                <Text style={s.workerStatLabel}>Available</Text>
              </View>
              <View style={s.workerDivider} />
              <View style={s.workerStat}>
                <View style={[s.workerDot, { backgroundColor: theme.warning }]} />
                <Text style={s.workerStatValue}>{activeWorkers}</Text>
                <Text style={s.workerStatLabel}>On Job</Text>
              </View>
              <View style={s.workerDivider} />
              <View style={s.workerStat}>
                <View style={[s.workerDot, { backgroundColor: accent.workers }]} />
                <Text style={s.workerStatValue}>{workerCount}</Text>
                <Text style={s.workerStatLabel}>Total</Text>
              </View>
            </View>
            <View style={s.gaugeOuter}>
              <View style={s.gaugeTrack}>
                <View style={[s.gaugeFill, { width: `${gaugePct}%` }]} />
              </View>
            </View>
          </DashboardCard>
        </View>

        {/* Dashboard section */}
        <View style={{ gap: 10 }}>
          <View style={s.sectionHeader}>
            <View>
              <Text style={[s.sectionTitle, { color: theme.textSecondary }]}>RECENT BILLS</Text>
              <SectionDivider color={theme.border} />
            </View>
            <Pressable onPress={() => setShowInvoicesModal(true)} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
              <Text style={[s.viewAllLink, { color: theme.primary }]}>View All</Text>
            </Pressable>
          </View>
          {loading ? (
            <DashboardCard dashed>
              <View style={{ paddingVertical: 18, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={theme.text} />
                </View>
              </DashboardCard>
            ) : recentBills.length > 0 ? (
            <View style={{ gap: 10 }}>
              {recentBills.map((bill) => (
                <DashboardCard key={bill.id} tabColor={accent.revenue} tabIcon="receipt-outline">
                  <View style={s.billRow}>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={s.plateSerial} numberOfLines={1}>{bill.vehicle_number || `#${bill.id}`}</Text>
                      {bill.owner_name && (
                        <Text style={s.repairMeta} numberOfLines={1}>{bill.owner_name}</Text>
                      )}
                    </View>
                    <Text style={s.billAmount}>{formatCurrency(bill.total_amount)}</Text>
                  </View>
                </DashboardCard>
              ))}
            </View>
          ) : (
            <DashboardCard dashed>
              <View style={{ paddingVertical: 20, alignItems: 'center', gap: 8 }}>
                <Ionicons name="receipt-outline" size={28} color={theme.textSecondary} />
                <Text style={s.emptyText}>No bills yet</Text>
              </View>
            </DashboardCard>
          )}
        </View>

        <Text style={{ fontSize: 12, fontWeight: '500', color: theme.textSecondary, textAlign: 'center', opacity: 0.6, paddingTop: 8 }}>
          Repairo v1.0.0
        </Text>
      </ScrollView>

      {/* Modals */}
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
    </ThemedView>
  );
}

// ---- DashboardCard primitive styles (colors overridden inline via theme) ----
const plate = StyleSheet.create({
  outer: {
    borderWidth: 1,
    borderRadius: UI.radius,
    overflow: 'hidden',
  },
  outerDashed: {
    borderStyle: 'solid',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  tab: {
    width: 40,
    margin: 12,
    marginRight: 0,
    borderRadius: UI.radius,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    borderRightWidth: 0,
  },
  tabCompact: {
    width: 38,
  },
  content: {
    flex: 1,
    padding: UI.card.padding,
    gap: 4,
    justifyContent: 'center',
  },
  contentCompact: {
    padding: 10,
  },
});

