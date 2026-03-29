import React, { useMemo, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import DashboardHeader from '../components/DashboardHeader';
import { 
  Plus, 
  ArrowRight, 
  Wrench,
} from 'lucide-react-native';
import { repairService } from '../services/repair.service';
import { RepairCard } from '../components/RepairCard';
import { useFocusEffect } from '@react-navigation/native';

const FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const T = useTheme();
  const [recentRepairs, setRecentRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const loadRecent = useCallback(async () => {
    setLoading(true);
    const res = await repairService.getAll();
    if (res.success) {
      setRecentRepairs(res.data?.slice(0, 3) || []);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecent();
    }, [loadRecent])
  );

  if (!user) return null;

  return (
    <View style={[styles.container, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={T.isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      
      <DashboardHeader />

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.topSection}>
          <View>
            <Text style={[styles.greeting, { color: T.textMuted }]}>{greeting},</Text>
            <Text style={[styles.userName, { color: T.text }]}>{user?.ownerName || "Owner"}</Text>
          </View>

          <TouchableOpacity 
            style={styles.newRepairAction} 
            onPress={() => navigation.navigate('CreateRepair')} 
            activeOpacity={0.7}
          >
            <View style={[styles.plusIconWrap, { backgroundColor: T.primary }]}>
              <Plus size={24} color={T.primaryText} strokeWidth={3} />
            </View>
            <Text style={[styles.newRepairText, { color: T.primary }]}>REPAIR</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: T.text }]}>Recent Repairs</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Repairs')} 
            hitSlop={{top:10,bottom:10,left:10,right:10}}
            style={styles.viewAllBtn}
          >
             <Text style={[styles.viewAllText, { color: T.primary }]}>View All</Text>
             <ArrowRight size={14} color={T.primary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator color={T.primary} /></View>
        ) : recentRepairs.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: T.surfaceAlt, borderColor: T.borderStrong }]}>
            <Wrench size={32} color={T.borderStrong} />
            <Text style={[styles.emptyText, { color: T.textFaint }]}>No active jobs recorded.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {recentRepairs.map((item) => (
              <RepairCard 
                 key={item.id} 
                 item={item} 
                 onPress={() => navigation.navigate('Repairs')} 
              />
            ))}
          </View>
        )}

      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: T.primary + (T.isDark ? '30' : '15') }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  scrollContent: {
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 45,
  },
  greeting: {
    fontSize: 12,
    fontFamily: FONT,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '900',
    fontFamily: FONT,
    letterSpacing: -0.5,
  },
  newRepairAction: {
    alignItems: 'center',
    gap: 6,
  },
  plusIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  newRepairText: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: FONT,
    letterSpacing: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: FONT,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: FONT,
    letterSpacing: -0.2,
  },
  list: {
    gap: 16,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  center: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyCard: {
    paddingVertical: 50,
    alignItems: 'center',
    borderRadius: 24,
    borderStyle: 'dashed',
    borderWidth: 1.5,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: FONT,
    marginTop: 12,
    fontWeight: '600',
  },
  bottomBar: {
    height: 4,
    width: '30%',
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: Platform.OS === 'ios' ? 20 : 10,
  }
});
