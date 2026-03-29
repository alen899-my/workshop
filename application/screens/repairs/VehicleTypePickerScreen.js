import React from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, ChevronRight } from 'lucide-react-native';
import { VEHICLE_CATEGORIES, VEHICLE_CONFIG, VehicleIcon } from '../../constants/Vehicles';
import { Colors } from '../../constants/Colors';

const FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';
const theme = Colors.light;

export default function VehicleTypePickerScreen({ navigation, route }) {
  const { onSelect, selectedId } = route.params;

  const handleSelect = (id) => {
    onSelect(id);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Vehicle Types</Text>
          <Text style={s.subtitle}>Select the specific vehicle for this repair.</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.closeBtn}>
          <X size={20} color={theme.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {Object.entries(VEHICLE_CATEGORIES).map(([key, category]) => {
          const vehicles = VEHICLE_CONFIG.filter(v => v.category === category);
          if (vehicles.length === 0) return null;

          return (
            <View key={key} style={s.section}>
              <Text style={s.sectionTitle}>{category.toUpperCase()}</Text>
              <View style={s.grid}>
                {vehicles.map(item => {
                  const isSelected = selectedId === item.id;
                  return (
                    <TouchableOpacity 
                      key={item.id} 
                      style={[s.card, isSelected && { borderColor: item.color, backgroundColor: item.color + '05' }]}
                      onPress={() => handleSelect(item.id)}
                    >
                      <View style={[s.iconBox, isSelected && { backgroundColor: item.color }]}>
                        <VehicleIcon typeId={item.id} size={24} color={isSelected ? '#FFFFFF' : item.color} />
                      </View>
                      <Text style={[s.label, isSelected && { color: item.color }]} numberOfLines={1}>{item.label}</Text>
                      {isSelected && <View style={[s.selectedDot, { backgroundColor: item.color }]} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 20, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' 
  },
  title: { fontSize: 24, fontWeight: '900', color: theme.foreground, fontFamily: FONT, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: theme.mutedForeground, marginTop: 2 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20, paddingBottom: 60 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: theme.mutedForeground, fontFamily: FONT, letterSpacing: 1.5, marginBottom: 16, paddingLeft: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { 
    width: '30.5%', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#EDF2F7', 
    padding: 12, 
    alignItems: 'center', 
    gap: 8,
    position: 'relative'
  },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 9, fontWeight: '800', color: theme.mutedForeground, fontFamily: FONT, textAlign: 'center' },
  selectedDot: { position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: 3 }
});
