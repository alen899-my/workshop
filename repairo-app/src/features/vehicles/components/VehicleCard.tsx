import { UI } from '@/constants/theme';
import { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { formatPhoneForDisplay, toTelUri } from '@/utils/phone';
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

const DEFAULT_ICON: keyof typeof Ionicons.glyphMap = 'car-outline';

function getVehicleIcon(type?: string): keyof typeof Ionicons.glyphMap {
  return (type && VEHICLE_ICONS[type]) || DEFAULT_ICON;
}

function getImageUrl(image?: string): string | null {
  if (!image) return null;
  return image;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress?: (vehicle: Vehicle) => void;
  onDelete?: (vehicle: Vehicle) => void;
}

export default function VehicleCard({ vehicle, onPress }: VehicleCardProps) {
  const theme = useTheme();
  const styles = useStyles(theme);
  const icon = getVehicleIcon(vehicle.vehicle_type);
  const imageUrl = getImageUrl(vehicle.vehicle_image);
  const ownerPhone = vehicle.owner_phone;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => onPress?.(vehicle)}
    >

      {/* Vehicle type and thumbnail */}
      <View style={styles.topStrip}>
        <ThemedText style={styles.typeLabel} numberOfLines={1}>
          {vehicle.vehicle_type ?? 'Vehicle'}
        </ThemedText>
        <View style={styles.avatarWrap}>
          {imageUrl ? (
            <Image source={imageUrl} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <Ionicons name={icon} size={16} color={styles.avatarIconColor.color} />
          )}
        </View>
      </View>

      {/* Registration */}
      <View style={styles.registration}>
        <ThemedText style={styles.registrationText} numberOfLines={1} adjustsFontSizeToFit>
          {vehicle.vehicle_number}
        </ThemedText>
      </View>

      {/* footer: owner name + owner phone 2-col */}
      {Boolean(vehicle.owner_name?.trim() || vehicle.owner_phone?.trim()) && (
        <View style={styles.footer}>
          <View style={styles.footerCol}>
            <ThemedText style={styles.footerLabel}>Owner</ThemedText>
            <ThemedText style={styles.footerValue} numberOfLines={1}>
              {vehicle.owner_name || '—'}
            </ThemedText>
          </View>
          <View style={styles.footerDivider} />
          <View style={styles.footerCol}>
            <ThemedText style={styles.footerLabel}>Phone</ThemedText>
            <View style={styles.footerPhoneRow}>
              <ThemedText style={styles.footerValue} numberOfLines={1}>
                {formatPhoneForDisplay(vehicle.owner_phone || '') || '—'}
              </ThemedText>
              {Boolean(ownerPhone?.trim()) && (
                <Pressable
                  onPress={() => { const uri = toTelUri(ownerPhone || ''); if (uri) Linking.openURL(uri); }}
                  hitSlop={8}
                >
                  <Ionicons name="call" size={14} color={theme.primary} />
                </Pressable>
              )}
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  return useMemo(() => StyleSheet.create({
    card: { ...UI.card, backgroundColor: theme.card, borderColor: theme.card, marginBottom: 12 },
    pressed: { opacity: 0.8 },
    topStrip: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
    typeLabel: { flex: 1, fontSize: 13, fontWeight: '400', color: theme.textSecondary },
    avatarWrap: { width: 32, height: 32, borderRadius: UI.radius, overflow: 'hidden', backgroundColor: theme.backgroundElement, alignItems: 'center', justifyContent: 'center' },
    avatarImage: { width: '100%', height: '100%' },
    avatarIconColor: { color: theme.textSecondary },
    registration: { alignItems: 'flex-start', paddingBottom: 12 },
    registrationText: { fontSize: 18, fontWeight: '600', color: theme.text },
    footer: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border },
    footerCol: { flex: 1, alignItems: 'flex-start', gap: 2 },
    footerDivider: { width: 1, height: 28, backgroundColor: theme.border },
    footerLabel: { fontSize: 12, color: theme.textSecondary },
    footerValue: { fontSize: 13, fontWeight: '500', color: theme.text, flexShrink: 1 },
    footerPhoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  }), [theme]);
};