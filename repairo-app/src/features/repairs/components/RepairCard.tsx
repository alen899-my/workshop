import { useEffect, useMemo, useRef, useState } from 'react';
import { getCurrentUser } from '@/services/auth.service';
import { Animated, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Repair } from '@/features/repairs/services/repair.service';

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

// Splits the combined "dd-mm-yyyy hh:mm AM" string into separate date / time
// parts so they can be shown on their own rows, like the reference design.
function splitRepairDate(dateStr?: string): { date: string; time: string } {
  const combined = formatRepairDate(dateStr);
  if (!combined) return { date: '', time: '' };
  const [datePart, ...rest] = combined.split(' ');
  return { date: datePart, time: rest.join(' ') };
}

function handleCall(phone?: string) {
  if (!phone) return;
  Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
}

function formatKm(km?: string): string {
  if (!km) return '';
  const num = parseInt(km.replace(/\D/g, ''), 10);
  if (isNaN(num)) return km;
  return `${num.toLocaleString()} km`;
}

interface RepairCardProps {
  repair: Repair;
  onPress?: (repair: Repair) => void;
  onDelete?: (repair: Repair) => void;
}

export default function RepairCard({ repair, onPress, onDelete }: RepairCardProps) {
  const theme = useTheme();
  const styles = useStyles(theme);

  const STATUS_COLORS: Record<string, string> = {
    Pending: theme.warning,
    Started: theme.info,
    Completed: theme.success,
  };

  const STATUS_LABELS: Record<string, string> = {
    Pending: 'PENDING',
    Started: 'IN PROGRESS',
    Completed: 'COMPLETED',
  };

  const [showDelete, setShowDelete] = useState(false);
  const statusColor = STATUS_COLORS[repair.status] || theme.textSecondary;
  const statusLabel = STATUS_LABELS[repair.status] || repair.status;
  const imageUrl = getImageUrl(repair.vehicle_image);
  const { date: repairDate, time: repairTime } = splitRepairDate(repair.repair_date);

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

  const shopCountry = useMemo(() => getCurrentUser()?.shopCountry, []);
  const countryCode = shopCountry || 'IND';
  const isHighPriority = repair.status !== 'Completed' && (repair.priority === 'High' || repair.priority === 'Urgent');
  const vehicleTitle = [repair.brand, repair.model_name].filter(Boolean).join(' ') || repair.vehicle_type || 'Vehicle';

  return (
    <Pressable
      style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}
      onPress={handlePress}
      onLongPress={onDelete ? () => setShowDelete((prev) => !prev) : undefined}
      delayLongPress={400}
    >
      {/* Top row: vehicle image + license plate + status */}
      <View style={styles.topRow}>
        {imageUrl ? (
          <Image source={imageUrl} style={styles.vehicleImage} contentFit="cover" />
        ) : (
          <View style={[styles.vehicleImage, styles.vehicleImagePlaceholder, { backgroundColor: theme.primary + '15' }]}>
            <Ionicons name="car-outline" size={32} color={theme.primary} />
          </View>
        )}

        <View style={styles.topRight}>
          {/* Number plate */}
          <View style={styles.plate}>
            <View style={styles.plateBadge}>
              <ThemedText style={styles.plateBadgeText}>{countryCode}</ThemedText>
            </View>
            <ThemedText style={styles.plateNumber} numberOfLines={1}>
              {repair.vehicle_number}
            </ThemedText>
          </View>

          {/* Vehicle name under plate */}
          <ThemedText style={styles.vehicleTitle} numberOfLines={1}>
            {vehicleTitle}
          </ThemedText>
        </View>
      </View>

      {/* Owner + service type */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="person-outline" size={13} color={theme.textSecondary} />
          <ThemedText style={styles.infoText} numberOfLines={1}>
            {repair.owner_name || '-'}
          </ThemedText>
          {repair.phone_number && (
            <Pressable onPress={() => handleCall(repair.phone_number)} style={styles.callBtn}>
              <Ionicons name="call" size={11} color={theme.textInverse} />
            </Pressable>
          )}
        </View>

        {repair.service_type && (
          <View style={styles.infoItem}>
            <Ionicons name="build-outline" size={13} color={theme.textSecondary} />
            <ThemedText style={styles.infoText} numberOfLines={1}>
              {repair.service_type}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Date + time (and km, if present) */}
      <View style={styles.infoRow}>
        {repairDate ? (
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={13} color={theme.textSecondary} />
            <ThemedText style={styles.infoText}>{repairDate}</ThemedText>
          </View>
        ) : null}

        {repairTime ? (
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={13} color={theme.textSecondary} />
            <ThemedText style={styles.infoText}>{repairTime}</ThemedText>
          </View>
        ) : null}

        {repair.km_reading ? (
          <View style={styles.infoItem}>
            <Ionicons name="speedometer-outline" size={13} color={theme.textSecondary} />
            <ThemedText style={styles.infoText}>{formatKm(repair.km_reading)}</ThemedText>
          </View>
        ) : null}
      </View>

      {/* Status badges at the bottom */}
      <View style={styles.statusRow}>
        {isHighPriority && (
          <Animated.View style={[styles.priorityBadge, { opacity: blinkAnim }]}>
            <ThemedText style={styles.priorityText}>
              {repair.priority === 'Urgent' ? 'URGENT' : 'HIGH'}
            </ThemedText>
          </Animated.View>
        )}

        <View style={[styles.statusBadge, { backgroundColor: statusColor + '25' }]}>
          <ThemedText style={[styles.statusText, { color: statusColor }]}>{statusLabel}</ThemedText>
        </View>

        {showDelete ? (
          <Pressable onPress={handleDeletePress} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={15} color={theme.textInverse} />
          </Pressable>
        ) : (
          <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
        )}
      </View>
    </Pressable>
  );
}

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  return useMemo(() => StyleSheet.create({
    wrapper: {
      marginHorizontal: Spacing.two,
      marginBottom: Spacing.two,
      backgroundColor: theme.backgroundElement,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.three,
    },
    pressed: { opacity: 0.92 },

    // ── Top row: image + plate + status ──
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.three,
    },
    vehicleImage: {
      width: 92,
      height: 92,
      borderRadius: 14,
    },
    vehicleImagePlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    topRight: {
      flex: 1,
      gap: 4,
    },

    // ── License plate ──
    plate: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'stretch',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 6,
      overflow: 'hidden',
      backgroundColor: theme.backgroundSelected,
      marginBottom: 2,
    },
    plateBadge: {
      backgroundColor: theme.text,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    plateBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      color: theme.background,
      letterSpacing: 0.5,
    },
    plateNumber: {
      fontSize: 18,
      fontWeight: '900',
      color: theme.text,
      letterSpacing: 1,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },

    // ── Status row ──
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 6,
    },
    priorityBadge: {
      backgroundColor: theme.error,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    priorityText: {
      fontSize: 9,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    deleteBtn: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: theme.error,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // ── Vehicle title ──
    vehicleTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.text,
    },

    // ── Info rows ──
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 16,
      marginTop: 6,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    infoText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    callBtn: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme.success,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 2,
    },
  }), [theme]);
};