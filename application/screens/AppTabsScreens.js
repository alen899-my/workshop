import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../lib/theme';
import DashboardHeader from '../components/DashboardHeader';

const FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

function PlaceholderScreen({ title }) {
  const T = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: T.bg }]}>
       <DashboardHeader />
       <View style={styles.content}>
         <Text style={[styles.title, { color: T.text }]}>{title}</Text>
         <Text style={[styles.subtitle, { color: T.textMuted }]}>Our team is working on the {title.toLowerCase()} module...</Text>
       </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  title: { fontSize: 24, fontWeight: '900', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center' },
  subtitle: { fontSize: 13, fontFamily: FONT, marginTop: 12, textAlign: 'center', lineHeight: 20 }
});

export const RepairsScreen = () => <PlaceholderScreen title="Repairs" />;
export const VehiclesScreen = () => <PlaceholderScreen title="Vehicles" />;
export const JobsScreen = () => <PlaceholderScreen title="Job Cards" />;
export const SettingsScreen = () => <PlaceholderScreen title="Settings" />;
