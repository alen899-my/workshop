import { useEffect, useRef, useState } from 'react';
import { Animated, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import type { Repair } from '@/features/repairs/services/repair.service';

const STATUS_COLORS: Record<string, string> = {
  Pending: Colors.warning,
  Started: Colors.info,
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
  Car: Colors.info,
  Bike: Colors.success,
  Scooter: Colors.primary,
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

function formatRepairDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const pad = (num: number) => String(num).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());

  let hours = d.getHours();
  const minutes = pad(d.getMinutes());
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hh = pad(hours);

  return `${dd}-${mm}-${yyyy} ${hh}:${minutes} ${ampm}`;
}

function handleCall(phone?: string) {
  if (!phone) return;
  Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
}

interface RepairCardProps {
  repair: Repair;
  onPress?: (repair: Repair) => void;
  onDelete?: (repair: Repair) => void;
}

export default function RepairCard({ repair, onPress, onDelete }: RepairCardProps) {
  const [showDelete, setShowDelete] = useState(false);
  const statusColor = STATUS_COLORS[repair.status] || Colors.textSecondary;
  const icon = getVehicleIcon(repair.vehicle_type);
  const iconTint = getIconTint(repair.vehicle_type);
  const imageUrl = getImageUrl(repair.vehicle_image);

  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const isPriorityUrgentOrHigh = repair.priority === 'High' || repair.priority === 'Urgent';
    if (isPriorityUrgentOrHigh) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0.3,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      blinkAnim.setValue(1);
    }
  }, [repair.priority]);

  const handlePress = () => {
    if (showDelete) {
      setShowDelete(false);
    } else {
      onPress?.(repair);
    }
  };

  const handleDeletePress = () => {
    setShowDelete(false);
    onDelete?.(repair);
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.statusTab, { backgroundColor: statusColor }]}>
        <ThemedText style={styles.statusTabText}>{repair.status}</ThemedText>
      </View>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        onPress={handlePress}
        onLongPress={onDelete ? () => setShowDelete((prev) => !prev) : undefined}
        delayLongPress={400}
      >
        <View style={styles.info}>
          <View style={styles.topRow}>
            <ThemedText style={styles.vehicleNumber} numberOfLines={1}>
              {repair.vehicle_number}
            </ThemedText>
            {(repair.status !== 'Completed' && (repair.priority === 'High' || repair.priority === 'Urgent')) && (
              <Animated.View style={[
                styles.priorityBadge,
                {
                  opacity: blinkAnim,
                  backgroundColor: repair.priority === 'Urgent' ? '#E53E3E' : '#DD6B20'
                }
              ]}>
                <ThemedText style={styles.priorityText}>
                  {repair.priority.toUpperCase()}
                </ThemedText>
              </Animated.View>
            )}
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

          {repair.repair_date && (
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={11} color={Colors.mutedDark} />
              <ThemedText style={styles.dateText}>{formatRepairDate(repair.repair_date)}</ThemedText>
            </View>
          )}
        </View>

        <View style={styles.mediaColumn}>
          {imageUrl ? (
            <Image source={imageUrl} style={styles.image} contentFit="cover" />
          ) : (
            <View style={[styles.iconBox, { backgroundColor: iconTint + '22' }]}>
              <Ionicons name={icon} size={36} color={iconTint} />
            </View>
          )}
          {showDelete ? (
            <Pressable onPress={handleDeletePress} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={16} color={Colors.textInverse} />
            </Pressable>
          ) : (
            <Ionicons name="chevron-forward" size={16} color={Colors.mutedDark} />
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative', marginHorizontal: Spacing.two, marginBottom: Spacing.two },
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
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  dateText: { fontSize: 11, fontWeight: '600', color: Colors.mutedDark },
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
  deleteBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
    alignSelf: 'center',
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
