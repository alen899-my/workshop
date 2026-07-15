import { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
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

// Commercial-use categories get the yellow-plate treatment (HSRP commercial convention),
// everything else gets the standard white/silver private plate.
const COMMERCIAL_TYPES = new Set([
  'Taxi', 'Auto', 'Van', 'Bus', 'Truck', 'Pickup', 'Tractor', 'Forklift', 'Bulldozer',
]);

const DEFAULT_ICON: keyof typeof Ionicons.glyphMap = 'car-outline';

function getVehicleIcon(type?: string): keyof typeof Ionicons.glyphMap {
  return (type && VEHICLE_ICONS[type]) || DEFAULT_ICON;
}

function isCommercial(type?: string): boolean {
  return !!type && COMMERCIAL_TYPES.has(type);
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
  const commercial = isCommercial(vehicle.vehicle_type);
  const styles = useStyles(theme, commercial);
  const icon = getVehicleIcon(vehicle.vehicle_type);
  const imageUrl = getImageUrl(vehicle.vehicle_image);
  const ownerPhone = vehicle.owner_phone;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => onPress?.(vehicle)}
    >
      {/* corner rivets */}
      <View style={[styles.rivet, styles.rivetTL]} />
      <View style={[styles.rivet, styles.rivetTR]} />
      <View style={[styles.rivet, styles.rivetBL]} />
      <View style={[styles.rivet, styles.rivetBR]} />

      {/* top strip: IND chip + vehicle type */}
      <View style={styles.topStrip}>
        <View style={styles.indChip}>
          <ThemedText style={styles.indChipFlag}>🇮🇳</ThemedText>
          <ThemedText style={styles.indChipText}>IND</ThemedText>
        </View>
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

      {/* divider bolt line, mimics the plate's screw strip */}
      <View style={styles.boltLine}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={styles.bolt} />
        ))}
      </View>

      {/* main plate number */}
      <View style={styles.plateBody}>
        <ThemedText style={styles.plateNumber} numberOfLines={1} adjustsFontSizeToFit>
          {vehicle.vehicle_number}
        </ThemedText>
      </View>

      {/* footer: owner name + owner phone 2-col */}
      {(vehicle.owner_name || vehicle.owner_phone) && (
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
                {vehicle.owner_phone || '—'}
              </ThemedText>
              {ownerPhone && (
                <Pressable
                  onPress={() => Linking.openURL(`tel:${ownerPhone.replace(/\s/g, '')}`)}
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

const useStyles = (theme: ReturnType<typeof useTheme>, commercial: boolean) => {
  return useMemo(() => {
    const isDark = theme.text === '#FAFAFA';

    const plateBg = commercial
      ? (isDark ? '#3A2A00' : '#F7C948')
      : theme.backgroundElement;
    const plateBorder = commercial
      ? (isDark ? '#B8860B' : '#B8860B')
      : theme.border;
    const plateTextColor = commercial
      ? (isDark ? '#FFD966' : '#111111')
      : theme.text;
    const boltColor = commercial
      ? (isDark ? '#B8860B' : '#9C7A17')
      : (isDark ? '#52525B' : '#3A3A3A');
    const textLight = isDark ? '#A1A1AA' : '#00000090';
    const textLighter = isDark ? '#71717A' : '#00000050';
    const textMuted = isDark ? '#A1A1AA' : '#00000080';
    const dividerColor = isDark ? '#27272A' : '#00000018';
    const rivetColor = isDark ? '#00000060' : '#00000030';
    const rivetBorder = isDark ? '#00000075' : '#00000045';

    return StyleSheet.create({
      card: {
        backgroundColor: plateBg,
        borderRadius: 10,
        borderWidth: 2.5,
        borderColor: plateBorder,
        paddingTop: 8,
        paddingBottom: 10,
        paddingHorizontal: 10,
        marginBottom: 10,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.12,
        shadowRadius: 5,
        elevation: 2,
      },
      pressed: { opacity: 0.88, transform: [{ scale: 0.995 }] },

      rivet: {
        position: 'absolute',
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: rivetColor,
        borderWidth: 1,
        borderColor: rivetBorder,
      },
      rivetTL: { top: 5, left: 5 },
      rivetTR: { top: 5, right: 5 },
      rivetBL: { bottom: 5, left: 5 },
      rivetBR: { bottom: 5, right: 5 },

      topStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
        paddingHorizontal: 4,
      },
      indChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: isDark ? '#1A3C8C' : '#1A3C8C',
        borderRadius: 4,
        paddingHorizontal: 5,
        paddingVertical: 2,
      },
      indChipFlag: { fontSize: 9, lineHeight: 11 },
      indChipText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
      },
      typeLabel: {
        flex: 1,
        fontSize: 10,
        fontWeight: '700',
        color: textLight,
        textTransform: 'uppercase',
        letterSpacing: 1,
      },
      avatarWrap: {
        width: 24,
        height: 24,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: isDark ? '#FFFFFF12' : '#00000012',
        alignItems: 'center',
        justifyContent: 'center',
      },
      avatarImage: { width: '100%', height: '100%' },
      avatarIconColor: { color: isDark ? '#FFFFFF70' : '#00000070' },

      boltLine: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        marginBottom: 2,
      },
      bolt: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: boltColor,
        opacity: 0.55,
      },

      plateBody: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
      },
      plateNumber: {
        fontSize: 26,
        fontWeight: '900',
        color: plateTextColor,
        letterSpacing: 3,
        fontFamily: 'monospace',
      },

      footer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: dividerColor,
      },
      footerCol: {
        flex: 1,
        alignItems: 'center',
      },
      footerDivider: {
        width: 1,
        height: 24,
        backgroundColor: dividerColor,
      },
      footerLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: textLighter,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 1,
      },
      footerValue: {
        fontSize: 12,
        fontWeight: '700',
        color: textMuted,
      },
      footerPhoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      },
    });
  }, [theme, commercial]);
};