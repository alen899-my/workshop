import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Platform,
  StatusBar
} from 'react-native';
import { useAuth } from '../lib/auth';
import { Colors } from '../constants/Colors';
import DashboardHeader from '../components/DashboardHeader';
import { 
  PlusCircle, 
  Wrench, 
  Car, 
  ClipboardList, 
  Users, 
  Receipt,
  BarChart2
} from 'lucide-react-native';

const FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

const QUICK_ACTIONS = [
  { id: 1, title: 'New Repair', icon: PlusCircle, color: '#63B3ED' },
  { id: 2, title: 'Repairs',    icon: Wrench,     color: '#FC8181' },
  { id: 3, title: 'Vehicles',   icon: Car,        color: '#68D391' },
  { id: 4, title: 'Job Cards',  icon: ClipboardList, color: '#F6AD55' },
  { id: 5, title: 'Customers',  icon: Users,      color: '#B794F4' },
  { id: 6, title: 'Invoices',   icon: Receipt,    color: '#4FD1C5' },
];

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <DashboardHeader />

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* Horizontal Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.quickActionsContainer}
        >
          {QUICK_ACTIONS.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.actionCard}
              activeOpacity={0.7}
              onPress={() => {
                if (item.title === 'New Repair') navigation.navigate('CreateRepair');
                else if (item.title === 'Repairs') navigation.navigate('Repairs');
              }}
            >
              <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
                <item.icon size={22} color={item.color} />
              </View>
              <Text style={styles.actionLabel}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Overview Stats */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Overview</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconHeader}>
               <BarChart2 size={16} color="rgba(255,255,255,0.4)" />
               <Text style={styles.cardLabel}>ACTIVE JOBS</Text>
            </View>
            <Text style={styles.cardValue}>12</Text>
            <View style={styles.progressLine} />
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconHeader}>
               <Receipt size={16} color="rgba(255,255,255,0.4)" />
               <Text style={styles.cardLabel}>PENDING</Text>
            </View>
            <Text style={styles.cardValue}>05</Text>
            <View style={[styles.progressLine, { backgroundColor: '#FC8181' }]} />
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.dark.background 
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 16,
  },
  sectionTitle: { 
    color: '#FFF', 
    fontSize: 14, 
    fontWeight: '900', 
    fontFamily: FONT, 
    textTransform: 'uppercase', 
    letterSpacing: 3,
    opacity: 0.8,
  },
  quickActionsContainer: {
    paddingHorizontal: 15,
    gap: 12,
  },
  actionCard: {
    width: 90,
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: FONT,
    fontWeight: '700',
    textAlign: 'center',
  },
  statsGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 12,
  },
  statCard: { 
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)', 
    padding: 20, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.06)',
    position: 'relative',
    overflow: 'hidden'
  },
  statIconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  cardLabel: { 
    fontSize: 10, 
    fontWeight: '900', 
    color: 'rgba(255,255,255,0.3)', 
    textTransform: 'uppercase', 
    letterSpacing: 1.5,
    fontFamily: FONT 
  },
  cardValue: { 
    fontSize: 32, 
    fontWeight: '900', 
    color: '#FFF', 
    fontFamily: FONT 
  },
  progressLine: {
    height: 3,
    width: '60%',
    backgroundColor: Colors.dark.primary,
    marginTop: 8,
    borderRadius: 2,
    opacity: 0.8,
  }
});
