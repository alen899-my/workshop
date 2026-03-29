import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors } from '../constants/Colors';
import DashboardHeader from '../components/DashboardHeader';

const FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

function PlaceholderScreen({ title }) {
  return (
    <View style={styles.container}>
       <DashboardHeader />
       <View style={styles.content}>
         <Text style={styles.title}>{title}</Text>
         <Text style={styles.subtitle}>Development in progress...</Text>
       </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: '#FFF', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: 2 },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: FONT, marginTop: 10 }
});

export const RepairsScreen = () => <PlaceholderScreen title="Repairs" />;
export const VehiclesScreen = () => <PlaceholderScreen title="Vehicles" />;
export const JobsScreen = () => <PlaceholderScreen title="Job Cards" />;
export const SettingsScreen = () => <PlaceholderScreen title="Settings" />;
