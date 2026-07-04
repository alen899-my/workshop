import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import type { Repair } from '@/features/repairs/services/repair.service';

const STATUS_COLORS: Record<string, string> = {
  Pending: Colors.warning,
  Started: Colors.info,
  'In Progress': Colors.primary,
  Completed: Colors.success,
};

const VEHICLE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Car: 'car-outline',
  Bike: 'bicycle-outline',
  Scooter: 'bicycle-outline',
  Bicycle: 'bicycle-outline',
  Auto: 'car-sport-outline',
  Truck: 'car-outline',
};

const ICON_TINTS: Record<string, string> = {
  Car: Colors.blue,
  Bike: Colors.success,
  Scooter: Colors.purple,
  Bicycle: Colors.success,
  Auto: Colors.warning,
  Truck: Colors.info,
};

function getVehicleIcon(type?: string): keyof typeof Ionicons.glyphMap {
  return (type && VEHICLE_ICONS[type]) || 'build-outline';
}

function getIconTint(type?: string): string {
  return (type && ICON_TINTS[type]) || Colors.primary;
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

interface RepairCardProps {
  repair: Repair;
  onPress?: (repair: Repair) => void;
}

export default function RepairCard({ repair, onPress }: RepairCardProps) {
  const statusColor = STATUS_COLORS[repair.status] || Colors.textSecondary;
  const icon = getVehicleIcon(repair.vehicle_type);
  const iconTint = getIconTint(repair.vehicle_type);
  const imageUrl = getImageUrl(repair.vehicle_image);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.statusTab, { backgroundColor: statusColor }]}>
        <ThemedText style={styles.statusTabText}>{repair.status}</ThemedText>
      </View>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        onPress={() => onPress?.(repair)}
      >
        <View style={styles.info}>
          <View style={styles.topRow}>
            <ThemedText style={styles.vehicleNumber} numberOfLines={1}>
              {repair.vehicle_number}
            </ThemedText>
          </View>

          <View style={styles.metaRow}>
            {repair.service_type && (
              <View style={[styles.chip, { backgroundColor: statusColor + '22' }]}>
                <ThemedText style={[styles.chipText, { color: statusColor }]}>
                  {repair.service_type}
                </ThemedText>
              </View>
            )}
            {repair.model_name && (
              <View style={[styles.chip, { backgroundColor: Colors.borderDark }]}>
                <ThemedText style={styles.chipText}>{repair.model_name}</ThemedText>
              </View>
            )}
          </View>

          <View style={styles.ownerRow}>
            {repair.owner_name && (
              <ThemedText style={styles.ownerName} numberOfLines={1}>
                {repair.owner_name}
              </ThemedText>
            )}
            {repair.phone_number && (
              <Pressable onPress={() => handleCall(repair.phone_number)} style={styles.callBtn}>
                <Ionicons name="call" size={14} color={Colors.textInverse} />
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.mediaColumn}>
          {imageUrl ? (
            <Image source={imageUrl} style={styles.image} contentFit="cover" />
          ) : (
            <View style={[styles.iconBox, { backgroundColor: iconTint + '22' }]}>
              <Ionicons name={icon} size={36} color={iconTint} />
            </View>
          )}
          <Ionicons name="chevron-forward" size={16} color={Colors.mutedDark} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative', marginHorizontal: Spacing.four, marginBottom: Spacing.two },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.nearBlack, borderRadius: 16,
    padding: Spacing.three, minHeight: 116,
  },
  pressed: { opacity: 0.85 },
  statusTab: {
    position: 'absolute', top: -12, right: 0, zIndex: 10,
    borderTopRightRadius: 12, borderBottomLeftRadius: 12,
    paddingHorizontal: 14, paddingVertical: 5,
    shadowColor: Colors.text, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  statusTabText: { fontSize: 11, fontWeight: '800', color: Colors.textInverse, letterSpacing: 0.5 },
  info: { flex: 1, gap: 3, marginRight: Spacing.three },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  vehicleNumber: { fontSize: 15, fontWeight: '800', color: Colors.textInverse },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  chip: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, backgroundColor: Colors.borderDark },
  chipText: { fontSize: 10, fontWeight: '700', color: Colors.mutedDark },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  ownerName: { fontSize: 13, color: Colors.textInverse, fontWeight: '600' },
  mediaColumn: { alignItems: 'flex-end', justifyContent: 'space-between', alignSelf: 'stretch', marginVertical: Spacing.half },
  image: {
    width: 100, height: 100, borderRadius: 16,
    backgroundColor: Colors.borderDark,
  },
  iconBox: {
    width: 100, height: 100, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  callBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center',
  },
});
