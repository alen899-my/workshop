import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Dimensions, Linking, Modal, Pressable,
  ScrollView, StyleSheet, View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCurrentUser } from '@/services/auth.service';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import type { Vehicle } from '@/features/vehicles/services/vehicle.service';
import { vehicleService } from '@/features/vehicles/services/vehicle.service';
import RepairCard from '@/features/repairs/components/RepairCard';
import ViewRepairScreen from '@/features/repairs/ViewRepairScreen';
import type { Repair } from '@/features/repairs/services/repair.service';
import { repairService } from '@/features/repairs/services/repair.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const [imagePreview, setImagePreview] = useState(false);
  const [viewRepair, setViewRepair] = useState<Repair | null>(null);

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

  const handleRepairPress = useCallback(async (r: { id: number }) => {
    const res = await repairService.getById(r.id);
    if (res.success && res.data) {
      setViewRepair(res.data);
    }
  }, []);

  const handleViewRepairClose = useCallback(() => {
    setViewRepair(null);
    fetchDetails();
  }, [fetchDetails]);

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable style={styles.headerBack} onPress={onClose}>
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Vehicle Details</ThemedText>
        <Pressable style={styles.headerEdit} onPress={() => onEdit(vehicle)}>
          <Ionicons name="create-outline" size={16} color={theme.primaryForeground} />
        </Pressable>
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
          {/* Vehicle info card */}
          <View style={styles.vehicleCard}>
            <Pressable onPress={() => imageUrl && setImagePreview(true)}>
              <View style={styles.vehicleImageWrap}>
                {imageUrl ? (
                  <Image source={imageUrl} style={styles.vehicleImage} contentFit="cover" />
                ) : (
                  <View style={[styles.vehicleImage, styles.vehicleImagePlaceholder, { backgroundColor: tint + '18' }]}>
                    <Ionicons name={icon} size={32} color={tint} />
                  </View>
                )}
              </View>
            </Pressable>
            <View style={styles.vehicleInfo}>
              <View style={styles.plate}>
                <View style={styles.plateBadge}>
                  <ThemedText style={styles.plateBadgeText}>{getCurrentUser()?.shopCountry || 'IND'}</ThemedText>
                </View>
                <ThemedText style={styles.plateNumber} numberOfLines={1}>{vehicle.vehicle_number}</ThemedText>
              </View>
              {vehicle.status === 'Inactive' && (
                <View style={styles.inactiveBadge}>
                  <ThemedText style={styles.inactiveBadgeText}>Inactive</ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* Vehicle Information */}
          <View style={styles.card}>
            <ThemedText style={styles.cardTitle}>Details</ThemedText>
            <DetailRow styles={styles} label="Model" value={vehicle.model_name || '\u2014'} />
            {vehicle.brand && <DetailRow styles={styles} label="Brand" value={vehicle.brand} />}
            <DetailRow styles={styles} label="Type" value={vehicle.vehicle_type || '\u2014'} />
            <DetailRow styles={styles} label="Status" value={vehicle.status || 'Active'} />
            <DetailRow styles={styles} label="Added" value={formatDate(vehicle.created_at)} />
            <DetailRow styles={styles} label="Total Repairs" value={String(repairs.length)} />
          </View>

          {/* Owner Card */}
          {(vehicle.owner_name || vehicle.owner_phone) && (
            <View style={styles.card}>
              <ThemedText style={styles.cardTitle}>Owner</ThemedText>
              <View style={styles.ownerRow}>
                <View style={styles.ownerLeft}>
                  <Ionicons name="person-outline" size={16} color={theme.textSecondary} />
                  <View>
                    <ThemedText style={styles.ownerName}>{vehicle.owner_name || 'Unknown'}</ThemedText>
                    {vehicle.owner_phone && (
                      <ThemedText style={styles.ownerPhone}>{vehicle.owner_phone}</ThemedText>
                    )}
                  </View>
                </View>
                {vehicle.owner_phone && (
                  <Pressable style={styles.ownerCallBtn} onPress={() => Linking.openURL(`tel:${vehicle.owner_phone!.replace(/\s/g, '')}`)}>
                    <Ionicons name="call" size={16} color={theme.primary} />
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* Past Repairs */}
          {repairs.length > 0 && (
            <View style={styles.repairSection}>
              <ThemedText style={styles.sectionLabel}>Past Repairs ({repairs.length})</ThemedText>
              {repairs.map((r) => {
                const enriched: Repair = {
                  id: r.id,
                  shop_id: vehicle.shop_id,
                  vehicle_number: vehicle.vehicle_number,
                  vehicle_image: vehicle.vehicle_image,
                  vehicle_type: vehicle.vehicle_type,
                  owner_name: vehicle.owner_name,
                  phone_number: vehicle.owner_phone,
                  brand: vehicle.brand,
                  model_name: vehicle.model_name,
                  status: r.status,
                  repair_date: r.repair_date,
                  created_at: r.repair_date || '',
                  service_type: 'Repair',
                  km_reading: '',
                  priority: '',
                  attending_worker_name: '',
                };
                return (
                  <RepairCard
                    key={r.id}
                    repair={enriched}
                    onPress={() => handleRepairPress(r)}
                  />
                );
              })}
            </View>
          )}
          {repairs.length === 0 && (
            <ThemedText style={styles.noRepairsText}>No repair history</ThemedText>
          )}

          {/* Actions */}
          <View style={styles.actionsRow}>
            <Pressable
              style={({ pressed }) => [styles.actionEdit, pressed && { opacity: 0.8 }]}
              onPress={() => onEdit(vehicle)}
            >
              <Ionicons name="create-outline" size={16} color={theme.primaryForeground} />
              <ThemedText style={styles.actionText}>Edit Vehicle</ThemedText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionDelete, pressed && { opacity: 0.8 }]}
              onPress={() => onDelete(vehicle)}
            >
              <Ionicons name="trash-outline" size={16} color={theme.destructive} />
              <ThemedText style={[styles.actionText, { color: theme.destructive }]}>Delete</ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* Image preview lightbox */}
      <Modal visible={imagePreview} transparent animationType="fade" onRequestClose={() => setImagePreview(false)}>
        <Pressable style={styles.lightbox} onPress={() => setImagePreview(false)}>
          {imageUrl && (
            <Image source={imageUrl} style={styles.lightboxImage} contentFit="contain" />
          )}
        </Pressable>
      </Modal>

      {/* View Repair modal */}
      <Modal visible={!!viewRepair} animationType="slide" onRequestClose={handleViewRepairClose}>
        {viewRepair && (
          <ViewRepairScreen
            repair={viewRepair}
            onClose={handleViewRepairClose}
            onEdit={() => {}}
            onUpdateRepair={handleViewRepairClose}
          />
        )}
      </Modal>
    </ThemedView>
  );
}

function DetailRow({ label, value, styles: s }: { label: string; value: string; styles: any }) {
  return (
    <View style={s.detailRow}>
      <ThemedText style={s.detailLabel}>{label}</ThemedText>
      <ThemedText style={s.detailValue}>{value}</ThemedText>
    </View>
  );
}

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.backgroundElement },

    // ── Header ──
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingBottom: 8,
      backgroundColor: theme.background,
      borderBottomWidth: 1, borderBottomColor: theme.border,
    },
    headerBack: {
      width: 36, height: 36, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: theme.backgroundElement,
    },
    headerTitle: { fontSize: 16, fontWeight: '700', color: theme.text },
    headerEdit: {
      width: 36, height: 36, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: theme.primary,
    },

    // ── Loading ──
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    // ── Scroll ──
    scrollContent: { padding: 16, gap: 12, paddingBottom: 40 },

    // ── Vehicle Card ──
    vehicleCard: {
      flexDirection: 'row',
      backgroundColor: theme.card,
      borderRadius: 14,
      padding: 12,
      gap: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    vehicleImageWrap: {
      width: 80, height: 80, borderRadius: 10, overflow: 'hidden',
      backgroundColor: theme.backgroundSelected,
    },
    vehicleImage: { width: '100%', height: '100%' },
    vehicleImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
    vehicleInfo: { flex: 1, justifyContent: 'center', gap: 4 },

    // ── Number Plate ──
    plate: {
      flexDirection: 'row', alignItems: 'stretch',
      borderRadius: 5, overflow: 'hidden',
      backgroundColor: theme.backgroundSelected,
      alignSelf: 'flex-start',
    },
    plateBadge: {
      backgroundColor: theme.text,
      alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: 6,
    },
    plateBadgeText: {
      fontSize: 9, fontWeight: '800',
      color: theme.background, letterSpacing: 0.5,
    },
    plateNumber: {
      fontSize: 17, fontWeight: '900', color: theme.text,
      letterSpacing: 1, paddingHorizontal: 8, paddingVertical: 4,
    },
    inactiveBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
      backgroundColor: theme.destructive + '18',
    },
    inactiveBadgeText: { fontSize: 9, fontWeight: '700', color: theme.destructive },

    // ── Card ──
    card: {
      backgroundColor: theme.card,
      borderRadius: 14,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    cardTitle: {
      fontSize: 11, fontWeight: '700', color: theme.textSecondary,
      textTransform: 'uppercase', letterSpacing: 0.5,
      marginBottom: 12,
    },

    // ── Detail rows ──
    detailRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', paddingVertical: 6,
    },
    detailLabel: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },
    detailValue: { fontSize: 13, fontWeight: '700', color: theme.text },

    // ── Owner ──
    ownerRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    ownerLeft: {
      flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1,
    },
    ownerName: { fontSize: 15, fontWeight: '700', color: theme.text },
    ownerPhone: { fontSize: 12, color: theme.textSecondary, fontWeight: '500', marginTop: 1 },
    ownerCallBtn: {
      width: 34, height: 34, borderRadius: 17,
      backgroundColor: theme.primary + '12',
      alignItems: 'center', justifyContent: 'center',
    },

    // ── Repair list ──
    noRepairsText: { fontSize: 13, color: theme.textSecondary, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 },
    repairSection: {
      marginHorizontal: -16,
    },
    sectionLabel: {
      fontSize: 11, fontWeight: '700', color: theme.textSecondary,
      textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
      paddingHorizontal: 16,
    },

    // ── Actions ──
    actionsRow: {
      flexDirection: 'row', gap: 10, paddingTop: 4,
    },
    actionEdit: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, paddingVertical: 12, borderRadius: 10,
      backgroundColor: theme.primary,
    },
    actionDelete: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, paddingVertical: 12, borderRadius: 10,
      backgroundColor: theme.destructive + '12',
      borderWidth: 1, borderColor: theme.destructive + '30',
    },
    actionText: { fontSize: 13, fontWeight: '700', color: theme.primaryForeground },

    // ── Lightbox ──
    lightbox: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.92)',
      alignItems: 'center', justifyContent: 'center',
    },
    lightboxImage: {
      width: SCREEN_WIDTH,
      height: SCREEN_WIDTH,
    },
  }), [theme]);
  return styles;
};
