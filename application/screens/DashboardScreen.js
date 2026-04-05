import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { useCurrency } from '../lib/currency';
import DashboardHeader from '../components/DashboardHeader';
import { 
  PlusCircle, 
  Wrench,
  Car,
  Clock,
  ArrowRight,
  DollarSign,
  Zap,
  UserCheck
} from 'lucide-react-native';
import { repairService } from '../services/repair.service';
import { RepairCard } from '../components/RepairCard';

const FONT = Platform.OS === 'ios' ? 'System' : 'sans-serif';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const T = useTheme();
  const { format: formatCurrency } = useCurrency(user);
  
  const [stats, setStats] = useState({
    totalRepairs: 0,
    pendingRepairs: 0,
    totalRevenue: 0,
    avgCompletionHours: "0",
    recentRepairs: [],
    workers: []
  });
  const [loading, setLoading] = useState(true);
  
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    if (hour < 21) return "Good Evening";
    return "Good Night";
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await repairService.getSummaryStats();
    if (res?.success && res?.data) {
      setStats({
        totalRepairs: res.data.totalRepairs || 0,
        pendingRepairs: res.data.pendingRepairs || 0,
        totalRevenue: res.data.totalRevenue || 0,
        avgCompletionHours: res.data.avgCompletionHours || "0",
        recentRepairs: res.data.recentRepairs || [],
        workers: res.data.workers || []
      });
    }
    setLoading(false);
  }, []);

  // Replaced useFocusEffect with standard navigation listener to prevent Context errors 
  // during fast-refreshes or deep mounting cycles.
  useEffect(() => {
    if (!navigation) return;
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    // Load once initially as well
    loadData();
    return unsubscribe;
  }, [navigation, loadData]);



  const dashboardCards = [
    {
      title: "Earnings",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      bg: "#059669",
      desc: "Total revenue"
    },
    {
      title: "In Progress",
      value: stats.pendingRepairs,
      icon: Clock,
      bg: "#f59e0b",
      desc: "Active repairs"
    },
    {
      title: "Avg Time",
      value: `${stats.avgCompletionHours}h`,
      icon: Zap,
      bg: "#4f46e5",
      desc: "Per repair"
    },
    {
      title: "Vehicles",
      value: stats.totalRepairs,
      icon: Car,
      bg: "#334155",
      desc: "Total seen"
    }
  ];

  const quickActions = [
    { label: "New Repair",  screen: "CreateRepair", icon: PlusCircle, primary: true },
    { label: "All Repairs", screen: "Repairs",      icon: Wrench,     primary: false },
    { label: "Vehicles",    screen: "Vehicles",     icon: Car,        primary: false },
    { label: "Invoices",    screen: "Invoices",     icon: DollarSign, primary: false },
  ];

  if (!user) return null;

  return (
    <View className="flex-1" style={{ backgroundColor: T.bg }}>
      <StatusBar barStyle={T.isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      <DashboardHeader />

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerClassName="pt-4 px-5 pb-16"
      >
        {/* Header Strings */}
        <View className="mb-6">
          <Text className="text-3xl font-black tracking-tighter mb-1" style={{ color: T.text, fontFamily: FONT }}>
            {greeting}! 👋
          </Text>
          <Text className="text-sm font-medium" style={{ color: T.textMuted, fontFamily: FONT }}>
            Here's what's happening at <Text style={{ color: T.text, fontWeight: '800' }}>{user?.shopName}</Text> today.
          </Text>
        </View>

        {loading ? (
          <View className="py-10 items-center justify-center">
            <ActivityIndicator color={T.primary} size="large" />
          </View>
        ) : (
          <>
            {/* Stats Grid (2x2) properly styled with NativeWind */}
            <View className="flex-row flex-wrap justify-between mb-8 gap-y-4">
              {dashboardCards.map((card, i) => (
                <View 
                  key={i} 
                  className="w-[48%] rounded-2xl p-4 shadow-sm flex-col justify-between min-h-[130px]"
                  style={{ backgroundColor: card.bg }}
                >
                  <View className="flex-row items-start justify-between">
                    <Text className="text-white text-sm font-bold flex-1 opacity-90">{card.title}</Text>
                    <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
                      {card.icon && <card.icon size={16} color="#ffffff" />}
                    </View>
                  </View>
                  <View className="mt-3">
                    <Text className="text-white text-2xl font-black tracking-tight mb-1">{card.value}</Text>
                    <Text className="text-white text-[10px] font-semibold opacity-75">{card.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Quick Actions properly spaced */}
            <View className="mb-8">
              <Text className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: T.textMuted, fontFamily: FONT }}>
                Quick Actions
              </Text>
              <View className="flex-row flex-wrap justify-between gap-y-3">
                {quickActions.map((action, i) => {
                  const isPrimary = action.primary;
                  return (
                    <TouchableOpacity 
                      key={i}
                      onPress={() => navigation.navigate(action.screen)}
                      activeOpacity={0.8}
                      className="w-[48%] rounded-xl p-4 flex-col items-center justify-center border shadow-sm"
                      style={{ 
                        backgroundColor: isPrimary ? T.primary : T.surface,
                        borderColor: isPrimary ? T.primary : T.border,
                      }}
                    >
                      {action.icon && (
                        <action.icon 
                          size={24} 
                          color={isPrimary ? '#ffffff' : T.primary} 
                          strokeWidth={2} 
                        />
                      )}
                      <Text 
                        className="text-xs font-bold mt-2 text-center" 
                        style={{ color: isPrimary ? '#ffffff' : T.text, fontFamily: FONT }}
                      >
                        {action.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Recent Repairs */}
            <View className="mb-8">
              <View className="flex-row items-center justify-between border-b pb-2 mb-4" style={{ borderColor: T.border }}>
                <View className="flex-row items-center space-x-2">
                  <Wrench size={16} color={T.primary} strokeWidth={2.5} />
                  <Text className="text-sm font-bold ml-2" style={{ color: T.text, fontFamily: FONT }}>Recent Repairs</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Repairs')} className="flex-row items-center">
                  <Text className="text-xs font-bold mr-1" style={{ color: T.primary, fontFamily: FONT }}>See all</Text>
                  <ArrowRight size={14} color={T.primary} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              {(stats.recentRepairs || []).length === 0 ? (
                <View className="py-8 items-center justify-center rounded-xl border border-dashed" style={{ borderColor: T.borderStrong, backgroundColor: T.surfaceAlt }}>
                  <Text className="text-xs font-medium" style={{ color: T.textMuted, fontFamily: FONT }}>No repairs recorded yet.</Text>
                </View>
              ) : (
                <View className="flex-col gap-y-3">
                  {stats.recentRepairs.map((item) => (
                    <RepairCard 
                      key={item.id} 
                      item={item} 
                      onPress={() => navigation.navigate('Repairs')} 
                    />
                  ))}
                </View>
              )}
            </View>

            {/* Staff on Duty */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between border-b pb-2 mb-4" style={{ borderColor: T.border }}>
                <View className="flex-row items-center space-x-2">
                  <UserCheck size={16} color={T.primary} strokeWidth={2.5} />
                  <Text className="text-sm font-bold ml-2" style={{ color: T.text, fontFamily: FONT }}>Staff on Duty</Text>
                </View>
              </View>

              <View className="rounded-2xl overflow-hidden border" style={{ backgroundColor: T.surface, borderColor: T.border }}>
                {(stats.workers || []).length === 0 ? (
                  <View className="p-6 items-center justify-center">
                    <Text className="text-xs font-medium text-center" style={{ color: T.textMuted, fontFamily: FONT }}>
                      No staff assigned to this workshop yet.
                    </Text>
                  </View>
                ) : (
                  stats.workers.map((w, i) => {
                    const isLast = i === stats.workers.length - 1;
                    return (
                      <View 
                        key={w.id} 
                        className={`flex-row items-center justify-between p-4 ${!isLast ? 'border-b' : ''}`}
                        style={{ borderColor: T.border }}
                      >
                        <View className="flex-row items-center">
                          <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: T.primary + '15' }}>
                            <Text className="text-lg font-black" style={{ color: T.primary }}>
                              {(w.name || '?').charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View>
                            <Text className="text-sm font-bold mb-0.5" style={{ color: T.text, fontFamily: FONT }}>
                              {w.name || 'Unknown'}
                            </Text>
                            <Text className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.textMuted, fontFamily: FONT }}>
                              {(w.role || '').replace("_", " ")}
                            </Text>
                          </View>
                        </View>
                        <View className="items-end justify-center">
                          <Text className="text-xs font-bold mb-1" style={{ color: T.primary, fontFamily: FONT }}>
                            {w.active_jobs || 0} active {(w.active_jobs === 1) ? 'job' : 'jobs'}
                          </Text>
                          <View className="flex-row space-x-1">
                            {[0,1,2].map((idx) => (
                              <View 
                                key={idx} 
                                className="w-3 h-1.5 rounded-full ml-1"
                                style={{ backgroundColor: idx < w.active_jobs ? T.primary : T.border }} 
                              />
                            ))}
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}