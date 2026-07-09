import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Linking, Pressable, ScrollView,
  StyleSheet, View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import type { Vehicle } from '@/features/vehicles/services/vehicle.service';
import { vehicleService } from '@/features/vehicles/services/vehicle.service';

const VEHICLE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Car: 'car-outline', Hatchback: 'car-outline', SUV: 'car-outline',
  Pickup: 'car-outline', Taxi: 'car-outline', Motorbike: 'bicycle-outline',
  Scooter: 'bicycle-outline', Van: 'car-outline', Bus: 'bus-outline',
  Truck: 'car-outline', Ambulance: 'medical-outline', FireTruck: 'flame-outline',
  PoliceCar: 'shield-outline', Other: 'ellipsis-horizontal',
};

const VEHICLE_TINTS: Record<string, string> = {
  Car: '#3182CE', Motorbike: '#E53E3E', Scooter: '#C53030',
  Van: '#319795', Truck: '#805AD5', Bus: '#285E61',
  Ambulance: '#E53E3E', FireTruck: '#C53030', PoliceCar: '#2B6CB0',
};

const DEFAULT_ICON: keyof typeof Ionicons.glyphMap = 'car-outline';

function getVehicleIcon(type?: string) { return (type && VEHICLE_ICONS[type]) || DEFAULT_ICON; }
function getVehicleTint(type?: string, defaultTint?: string) { return (type && VEHICLE_TINTS[type]) || defaultTint || ''; }

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}



interface VehicleDetailScreenProps {
  vehicle: Vehicle;
  onClose: () => void;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
}

export default function VehicleDetailScreen({
  vehicle: initialVehicle,
  onClose,
  onEdit,
  onDelete,
}: VehicleDetailScreenProps) {
  const theme = useTheme();
  const styles = useStyles(theme);
  const insets = useSafeAreaInsets();
  const [vehicle, setVehicle] = useState<Vehicle>(initialVehicle);
  const [loading, setLoading] = useState(true);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    const res = await vehicleService.getById(initialVehicle.id);
    if (res.success && res.data) {
      setVehicle(res.data);
    }
    setLoading(false);
  }, [initialVehicle.id]);

  useEffect(() => { fetchDetails(); }, [fetchDetails]);

  const icon = getVehicleIcon(vehicle.vehicle_type);
  const tint = getVehicleTint(vehicle.vehicle_type, theme.primary);
  const imageUrl = vehicle.vehicle_image?.startsWith('http') ? vehicle.vehicle_image : null;
  const repairs = vehicle.repairs || [];
  const STATUS_COLORS = useMemo(() => ({
    Pending: theme.warning, Started: theme.info, Completed: theme.success,
  }), [theme]);

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable style={styles.backBtn} onPress={onClose}>
          <Ionicons name="close" size={24} color="#1A1A1A" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Vehicle Details</ThemedText>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={styles.heroCard}>
            {imageUrl ? (
              <Image source={imageUrl} style={styles.heroImage} contentFit="cover" />
            ) : (
              <View style={[styles.heroIconWrap, { backgroundColor: tint + '22' }]}>
                <Ionicons name={icon} size={56} color={tint} />
              </View>
            )}
            <ThemedText style={styles.heroVehicleNo}>{vehicle.vehicle_number}</ThemedText>
            {vehicle.vehicle_type && (
              <View style={[styles.typeBadge, { backgroundColor: tint + '22' }]}>
                <Ionicons name={icon} size={14} color={tint} />
                <ThemedText style={[styles.typeBadgeText, { color: tint }]}>
                  {vehicle.vehicle_type}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Vehicle Specs */}
          <View style={styles.card}>
            <ThemedText style={styles.cardTitle}>Vehicle Information</ThemedText>
            <View style={styles.specRow}>
              <ThemedText style={styles.specLabel}>Model</ThemedText>
              <ThemedText style={styles.specValue}>{vehicle.model_name || '—'}</ThemedText>
            </View>
            {vehicle.brand && (
              <View style={styles.specRow}>
                <ThemedText style={styles.specLabel}>Brand / Make</ThemedText>
                <ThemedText style={styles.specValue}>{vehicle.brand}</ThemedText>
              </View>
            )}
            <View style={styles.specRow}>
              <ThemedText style={styles.specLabel}>Status</ThemedText>
              <View style={[styles.statusBadge, { backgroundColor: vehicle.status === 'Active' ? theme.success + '22' : theme.error + '22' }]}>
                <ThemedText style={[styles.statusBadgeText, { color: vehicle.status === 'Active' ? theme.success : theme.error }]}>
                  {vehicle.status || 'Active'}
                </ThemedText>
              </View>
            </View>
            <View style={styles.specRow}>
              <ThemedText style={styles.specLabel}>Added</ThemedText>
              <ThemedText style={styles.specValue}>{formatDate(vehicle.created_at)}</ThemedText>
            </View>
            <View style={styles.specRow}>
              <ThemedText style={styles.specLabel}>Total Repairs</ThemedText>
              <ThemedText style={styles.specValue}>{repairs.length}</ThemedText>
            </View>
          </View>

          {/* Owner Card */}
          {(vehicle.owner_name || vehicle.owner_phone) && (
            <View style={styles.ownerCard}>
              <View style={styles.ownerHeader}>
                <View style={styles.ownerAvatar}>
                  <Ionicons name="person-outline" size={22} color={theme.primary} />
                </View>
                <View style={styles.ownerInfo}>
                  <ThemedText style={styles.ownerName}>{vehicle.owner_name || 'Unknown'}</ThemedText>
                  {vehicle.owner_phone && (
                    <ThemedText style={styles.ownerPhone}>{vehicle.owner_phone}</ThemedText>
                  )}
                </View>
                {vehicle.owner_phone && (
                  <Pressable style={styles.ownerCallBtn} onPress={() => Linking.openURL(`tel:${vehicle.owner_phone!.replace(/\s/g, '')}`)}>
                    <Ionicons name="call" size={20} color="#FFFFFF" />
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* Past Repairs */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="construct-outline" size={18} color={theme.primary} />
              <ThemedText style={styles.cardTitle}>Past Repairs</ThemedText>
              <ThemedText style={styles.cardCount}>({repairs.length})</ThemedText>
            </View>

            {repairs.length === 0 ? (
              <ThemedText style={styles.noRepairsText}>No repair history for this vehicle</ThemedText>
            ) : (
              <View style={styles.repairList}>
                {repairs.map((r, i) => {
                  const statusColor = STATUS_COLORS[r.status] || theme.textSecondary;
                  let complaintPreview = '';
                  if (r.complaints) {
                    try {
                      const parsed = typeof r.complaints === 'string' ? JSON.parse(r.complaints) : r.complaints;
                      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].tasks) {
                        complaintPreview = parsed[0].tasks
                          .filter((t: any) => t.text?.trim())
                          .slice(0, 2)
                          .map((t: any) => t.text)
                          .join(', ');
                      }
                    } catch {}
                  }
                  return (
                    <View key={r.id} style={[styles.repairCard, i < repairs.length - 1 && styles.repairCardBorder]}>
                      <View style={styles.repairLeft}>
                        <ThemedText style={styles.repairDate}>{formatDate(r.repair_date)}</ThemedText>
                        {complaintPreview ? (
                          <ThemedText style={styles.repairComplaint} numberOfLines={1}>
                            {complaintPreview}
                          </ThemedText>
                        ) : null}
                      </View>
                      <View style={[styles.repairStatusBadge, { backgroundColor: statusColor + '22' }]}>
                        <ThemedText style={[styles.repairStatusText, { color: statusColor }]}>
                          {r.status}
                        </ThemedText>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, styles.editBtn, pressed && styles.pressed]}
              onPress={() => onEdit(vehicle)}
            >
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />
              <ThemedText style={styles.actionBtnText}>Edit Vehicle</ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.actionBtn, styles.deleteActionBtn, pressed && styles.pressed]}
              onPress={() => onDelete(vehicle)}
            >
              <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
              <ThemedText style={styles.actionBtnText}>Delete</ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </ThemedView>
  );
}

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F7F4' },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingBottom: 14,
      borderBottomWidth: 1.5, borderBottomColor: '#E8E0CC',
      backgroundColor: '#FFFFFF',
    },
    backBtn: {
      width: 38, height: 38, borderRadius: 19,
      alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F7F4',
    },
    headerTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scrollContent: { padding: 16, gap: 14, paddingBottom: 40 },

    heroCard: {
      backgroundColor: theme.nearBlack, borderRadius: 24, padding: 24,
      alignItems: 'center', gap: 10,
    },
    heroImage: { width: 120, height: 120, borderRadius: 60, backgroundColor: theme.borderDark },
    heroIconWrap: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
    heroVehicleNo: { fontSize: 22, fontWeight: '900', color: theme.textInverse, marginTop: 4 },
    typeBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    },
    typeBadgeText: { fontSize: 13, fontWeight: '700' },

    card: {
      backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, gap: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
    cardCount: { fontSize: 13, fontWeight: '500', color: '#8A8A80' },
    specRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingVertical: 4,
    },
    specLabel: { fontSize: 14, color: '#8A8A80', fontWeight: '500' },
    specValue: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusBadgeText: { fontSize: 12, fontWeight: '700' },

    ownerCard: {
      backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    ownerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    ownerAvatar: {
      width: 48, height: 48, borderRadius: 24,
      backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center',
    },
    ownerInfo: { flex: 1 },
    ownerName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
    ownerPhone: { fontSize: 14, fontWeight: '500', color: '#8A8A80', marginTop: 2 },
    ownerCallBtn: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: theme.success, alignItems: 'center', justifyContent: 'center',
    },

    noRepairsText: { fontSize: 13, color: '#8A8A80', fontStyle: 'italic', textAlign: 'center', paddingVertical: 16 },
    repairList: {},
    repairCard: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: 12, gap: 12,
    },
    repairCardBorder: { borderBottomWidth: 1, borderBottomColor: '#F0ECE3' },
    repairLeft: { flex: 1, gap: 2 },
    repairDate: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
    repairComplaint: { fontSize: 12, color: '#8A8A80', fontWeight: '500' },
    repairStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    repairStatusText: { fontSize: 11, fontWeight: '800' },

    actionsRow: {
      flexDirection: 'row', gap: 12, paddingTop: 4,
    },
    actionBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, paddingVertical: 14, borderRadius: 14,
    },
    editBtn: { backgroundColor: theme.primary },
    deleteActionBtn: { backgroundColor: theme.error },
    actionBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
    pressed: { opacity: 0.82 },
  }), [theme]);
  return styles;
};
