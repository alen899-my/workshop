import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Vehicle } from '@/features/vehicles/services/vehicle.service';

const VEHICLE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Car: 'car-outline',
  Hatchback: 'car-outline',
  SUV: 'car-outline',
  Pickup: 'car-outline',
  Taxi: 'car-outline',
  Motorbike: 'bicycle-outline',
  Scooter: 'bicycle-outline',
  Moped: 'bicycle-outline',
  Bicycle: 'bicycle-outline',
  EBike: 'bicycle-outline',
  KickScooter: 'bicycle-outline',
  Auto: 'car-sport-outline',
  Van: 'car-outline',
  Bus: 'bus-outline',
  Truck: 'car-outline',
  Ambulance: 'medical-outline',
  FireTruck: 'flame-outline',
  PoliceCar: 'shield-outline',
  Tractor: 'construct-outline',
  Forklift: 'construct-outline',
  Bulldozer: 'construct-outline',
  Other: 'ellipsis-horizontal',
};

const VEHICLE_TINTS: Record<string, string> = {
  Car: '#3182CE',
  Hatchback: '#2B6CB0',
  SUV: '#2C5282',
  Pickup: '#744210',
  Taxi: '#D69E2E',
  Motorbike: '#E53E3E',
  Scooter: '#C53030',
  Moped: '#9B2C2C',
  Bicycle: '#38A169',
  EBike: '#276749',
  KickScooter: '#2F855A',
  Auto: '#F6AD55',
  Van: '#319795',
  Bus: '#285E61',
  Truck: '#805AD5',
  Ambulance: '#E53E3E',
  FireTruck: '#C53030',
  PoliceCar: '#2B6CB0',
  Tractor: '#C05621',
  Forklift: '#D69E2E',
  Bulldozer: '#975A16',
  Other: '#718096',
};

const DEFAULT_ICON: keyof typeof Ionicons.glyphMap = 'car-outline';
let DEFAULT_TINT = '#0D9488';

function getVehicleIcon(type?: string): keyof typeof Ionicons.glyphMap {
  return (type && VEHICLE_ICONS[type]) || DEFAULT_ICON;
}

function getVehicleTint(type?: string): string {
  return (type && VEHICLE_TINTS[type]) || DEFAULT_TINT;
}

function getImageUrl(image?: string): string | null {
  if (!image) return null;
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  return image;
}

function handleCall(phone?: string) {
  if (!phone) return;
  Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress?: (vehicle: Vehicle) => void;
  onDelete?: (vehicle: Vehicle) => void;
}

export default function VehicleCard({ vehicle, onPress, onDelete }: VehicleCardProps) {
  const [showDelete, setShowDelete] = useState(false);
  const theme = useTheme();
  const styles = useStyles(theme);
  const icon = getVehicleIcon(vehicle.vehicle_type);
  const tint = getVehicleTint(vehicle.vehicle_type);
  const imageUrl = getImageUrl(vehicle.vehicle_image);

  const handlePress = () => {
    if (showDelete) {
      setShowDelete(false);
    } else {
      onPress?.(vehicle);
    }
  };

  const handleDeletePress = () => {
    setShowDelete(false);
    onDelete?.(vehicle);
  };

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        onPress={handlePress}
        onLongPress={onDelete ? () => setShowDelete((prev) => !prev) : undefined}
        delayLongPress={400}
      >
        <View style={styles.info}>
          <View style={styles.topRow}>
            <ThemedText style={styles.vehicleNumber} numberOfLines={1}>
              {vehicle.vehicle_number}
            </ThemedText>
            {vehicle.status === 'Inactive' && (
              <View style={styles.inactiveBadge}>
                <ThemedText style={styles.inactiveBadgeText}>Inactive</ThemedText>
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            {vehicle.vehicle_type && (
              <View style={[styles.chip, { backgroundColor: tint + '22' }]}>
                <Ionicons name={getVehicleIcon(vehicle.vehicle_type)} size={12} color={tint} />
                <ThemedText style={[styles.chipText, { color: tint }]}>
                  {vehicle.vehicle_type}
                </ThemedText>
              </View>
            )}
            {vehicle.model_name && (
              <View style={[styles.chip, { backgroundColor: theme.borderDark }]}>
                <ThemedText style={styles.chipText}>{vehicle.model_name}</ThemedText>
              </View>
            )}
            {vehicle.brand && (
              <View style={[styles.chip, { backgroundColor: theme.borderDark }]}>
                <ThemedText style={styles.chipText}>{vehicle.brand}</ThemedText>
              </View>
            )}
          </View>

          <View style={styles.ownerRow}>
            {vehicle.owner_name && (
              <ThemedText style={styles.ownerName} numberOfLines={1}>
                {vehicle.owner_name}
              </ThemedText>
            )}
            {vehicle.owner_phone && (
              <Pressable onPress={() => handleCall(vehicle.owner_phone)} style={styles.callBtn}>
                <Ionicons name="call" size={14} color={theme.textInverse} />
              </Pressable>
            )}
          </View>

          {vehicle.created_at && (
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={11} color={theme.mutedDark} />
              <ThemedText style={styles.dateText}>Added {formatDate(vehicle.created_at)}</ThemedText>
            </View>
          )}
        </View>

        <View style={styles.mediaColumn}>
          {imageUrl ? (
            <Image source={imageUrl} style={styles.image} contentFit="cover" />
          ) : (
            <View style={[styles.iconBox, { backgroundColor: tint + '22' }]}>
              <Ionicons name={icon} size={36} color={tint} />
            </View>
          )}
          {showDelete ? (
            <Pressable onPress={handleDeletePress} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={16} color={theme.textInverse} />
            </Pressable>
          ) : (
            <Ionicons name="chevron-forward" size={16} color={theme.mutedDark} />
          )}
        </View>
      </Pressable>
    </View>
  );
}

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  return useMemo(() => StyleSheet.create({
    wrapper: { position: 'relative', marginHorizontal: Spacing.two, marginBottom: Spacing.two },
    card: {
      flexDirection: 'row',
      backgroundColor: theme.nearBlack, borderRadius: 16,
      padding: Spacing.three, minHeight: 116,
    },
    pressed: { opacity: 0.85 },
    info: { flex: 1, gap: 3, marginRight: Spacing.three },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    vehicleNumber: { fontSize: 15, fontWeight: '800', color: theme.textInverse, flex: 1 },
    inactiveBadge: {
      marginLeft: 8,
      paddingHorizontal: 8, paddingVertical: 3,
      borderRadius: 6, backgroundColor: theme.error + '33',
    },
    inactiveBadgeText: { fontSize: 10, fontWeight: '800', color: theme.error },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
    chip: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
    },
    chipText: { fontSize: 10, fontWeight: '700', color: theme.mutedDark },
    ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    ownerName: { fontSize: 13, color: theme.textInverse, fontWeight: '600' },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    dateText: { fontSize: 11, fontWeight: '600', color: theme.mutedDark },
    mediaColumn: { alignItems: 'flex-end', justifyContent: 'space-between', alignSelf: 'stretch', marginVertical: Spacing.half },
    image: {
      width: 100, height: 100, borderRadius: 16,
      backgroundColor: theme.borderDark,
    },
    iconBox: {
      width: 100, height: 100, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center',
    },
    callBtn: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: theme.success, alignItems: 'center', justifyContent: 'center',
    },
    deleteBtn: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: theme.error, alignItems: 'center', justifyContent: 'center',
    },
  }), [theme]);
};
