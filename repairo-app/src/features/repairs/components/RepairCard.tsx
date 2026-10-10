import { UI } from '@/constants/theme';
import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatUTCToLocal } from '@/utils/date';
import { formatPhoneForDisplay } from '@/utils/phone';
import type { Repair } from '@/features/repairs/services/repair.service';

function getImageUrl(image?: string): string | null {
  if (!image) return null;
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  return image;
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
    Pending: 'Pending',
    Started: 'In progress',
    Completed: 'Completed',
  };

  const [showDelete, setShowDelete] = useState(false);
  const statusColor = STATUS_COLORS[repair.status] || theme.textSecondary;
  const statusLabel = STATUS_LABELS[repair.status] || repair.status;
  const imageUrl = getImageUrl(repair.vehicle_image);
  const regTime = repair.created_at ? formatUTCToLocal(repair.created_at) : '';

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
          {/* Registration */}
          <View style={styles.registration}>
            <ThemedText style={styles.registrationText} numberOfLines={1}>
              {repair.vehicle_number}
            </ThemedText>
          </View>

          {/* Vehicle name */}
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
              <Ionicons name="call" size={11} color={theme.successForeground} />
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

      {/* Reg time + km */}
      <View style={styles.infoRow}>
        {regTime ? (
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={13} color={theme.textSecondary} />
            <ThemedText style={styles.infoText} numberOfLines={1}>{regTime}</ThemedText>
          </View>
        ) : null}

        {repair.km_reading ? (
          <View style={styles.infoItem}>
            <Ionicons name="speedometer-outline" size={13} color={theme.textSecondary} />
            <ThemedText style={styles.infoText}>{formatKm(repair.km_reading)}</ThemedText>
          </View>
        ) : null}
      </View>

      {/* Assigned worker */}
      {repair.attending_worker_name && (
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="person-circle-outline" size={13} color={theme.textSecondary} />
            <ThemedText style={styles.infoText} numberOfLines={1}>Worker: {repair.attending_worker_name}</ThemedText>
          </View>
        </View>
      )}

      {/* Status badges at the bottom */}
      <View style={styles.statusRow}>
        {isHighPriority && (
          <View style={[styles.priorityBadge]}>
            <ThemedText style={styles.priorityText}>
              {repair.priority === 'Urgent' ? 'URGENT' : 'HIGH'}
            </ThemedText>
          </View>
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
      marginHorizontal: Spacing.three,
      marginBottom: 12,
      backgroundColor: theme.card,
      borderRadius: UI.card.borderRadius,
      borderWidth: 1,
      borderColor: theme.card,
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
      width: 64,
      height: 64,
      borderRadius: UI.radius,
    },
    vehicleImagePlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    topRight: {
      flex: 1,
      gap: 4,
    },

    // ── Registration ──
    registration: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },

    registrationText: { fontSize: 19, fontWeight: '500', color: theme.text, flexShrink: 1 },

    // ── Status row ──
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.divider,
    },
    priorityBadge: {
      backgroundColor: theme.error,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    priorityText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.errorForeground,
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
      fontWeight: '600',
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