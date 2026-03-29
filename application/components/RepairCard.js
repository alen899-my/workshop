import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { ChevronRight, Calendar, Clock } from 'lucide-react-native';
import { useTheme } from '../lib/theme';
import { getVehicleColor, VehicleIcon } from '../constants/Vehicles';
import { formatDate } from '../lib/utils';

const FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

/**
 * A standardized card component for repair jobs.
 * Used in Dashboard and Repair Listing screens.
 */
export function RepairCard({ item, onPress }) {
  const T = useTheme();

  // Status Colors
  let statusColor = '#94A3B8';
  if (item.status === 'Completed') statusColor = '#10B981';
  if (item.status === 'Pending') statusColor = '#EF4444';
  if (item.status === 'Started' || item.status === 'In Progress') statusColor = '#3B82F6';

  return (
    <TouchableOpacity 
      style={[
        s.card, 
        { 
          backgroundColor: T.surface, 
          shadowColor: T.isDark ? '#000' : '#000',
          borderColor: T.isDark ? T.borderStrong : 'transparent',
          borderWidth: T.isDark ? 1 : 0
        }
      ]}
      activeOpacity={0.8}
      onPress={onPress} 
    >
      <View style={s.cardMain}>
         <View style={[s.iconCircle, { backgroundColor: getVehicleColor(item.vehicle_type) + (T.isDark ? '30' : '10') }]}>
            <VehicleIcon typeId={item.vehicle_type} size={22} />
         </View>
         
         <View style={s.cardInfo}>
            <View style={s.vehicleRow}>
              <Text style={[s.vehicleNo, { color: T.text }]} numberOfLines={1}>{item.vehicle_number}</Text>
              {item.model_name && <Text style={[s.modelName, { color: T.textFaint }]} numberOfLines={1}>({item.model_name})</Text>}
            </View>
            <Text style={[s.ownerText, { color: T.text }]} numberOfLines={1}>{item.owner_name}</Text>
            {item.phone_number && <Text style={[s.phoneText, { color: T.textMuted }]}>{item.phone_number}</Text>}
            <View style={s.metaRow}>
              <Calendar size={10} color={T.textMuted} />
              <Text style={[s.dateTxt, { color: T.textMuted }]}>{formatDate(item.repair_date)}</Text>
            </View>
         </View>
      </View>

      <View style={s.cardRight}>
        <View style={[s.statusBadge, { backgroundColor: T.surfaceAlt }]}>
          <View style={[s.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[s.statusTxt, { color: statusColor }]}>{item.status}</Text>
        </View>
        <ChevronRight size={14} color={T.borderStrong} />
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    ...Platform.select({
      web: { boxShadow: '0 4px 6px rgba(0,0,0,0.02)' },
      default: {
        elevation: 2,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      }
    }),
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    overflow: 'hidden',
  },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vehicleNo: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: FONT,
    letterSpacing: -0.4,
  },
  modelName: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: FONT,
    flexShrink: 1,
  },
  ownerText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: FONT,
    marginTop: 2,
  },
  phoneText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: FONT,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  dateTxt: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONT,
  },
  workerTxt: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: FONT,
    textTransform: 'uppercase',
  },
  sep: {
    fontSize: 10,
    marginHorizontal: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 6,
    marginLeft: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusTxt: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: FONT,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
