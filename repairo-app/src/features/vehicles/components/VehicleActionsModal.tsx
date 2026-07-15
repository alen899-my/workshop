import { useMemo } from 'react';
import { Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { Vehicle } from '@/features/vehicles/services/vehicle.service';
import { getCurrentUser } from '@/services/auth.service';

interface VehicleActionsModalProps {
  visible: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
  onViewDetails: (vehicle: Vehicle) => void;
  onPastRepairs: (vehicle: Vehicle) => void;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
  canEdit: boolean;
  canDelete: boolean;
}

function handleCall(phone?: string) {
  if (!phone) return;
  Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
}

export default function VehicleActionsModal({
  visible,
  vehicle,
  onClose,
  onViewDetails,
  onPastRepairs,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: VehicleActionsModalProps) {
  const theme = useTheme();
  const styles = useStyles(theme);

  if (!vehicle) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          {/* Number Plate Header */}
          <View style={styles.plateCard}>
            <View style={styles.plateBadge}>
              <ThemedText style={styles.plateBadgeText}>{getCurrentUser()?.shopCountry || 'IND'}</ThemedText>
            </View>
            <ThemedText style={styles.plateNumber}>{vehicle.vehicle_number}</ThemedText>
          </View>
          <ThemedText style={styles.plateSubtitle}>
            {vehicle.owner_name || 'No owner'} • {vehicle.model_name || vehicle.vehicle_type || 'Vehicle'}
          </ThemedText>

          {/* Action Grid */}
          <View style={styles.grid}>
            <Pressable
              style={({ pressed }) => [styles.gridButton, pressed && styles.pressed]}
              onPress={() => onViewDetails(vehicle)}
            >
              <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="eye-outline" size={22} color={theme.primary} />
              </View>
              <ThemedText style={styles.gridButtonText}>View Details</ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.gridButton, pressed && styles.pressed]}
              onPress={() => onPastRepairs(vehicle)}
            >
              <View style={[styles.iconBox, { backgroundColor: theme.info + '15' }]}>
                <Ionicons name="construct-outline" size={22} color={theme.info} />
              </View>
              <ThemedText style={styles.gridButtonText}>Past Repairs</ThemedText>
            </Pressable>

            {canEdit ? (
              <Pressable
                style={({ pressed }) => [styles.gridButton, pressed && styles.pressed]}
                onPress={() => onEdit(vehicle)}
              >
                <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
                  <Ionicons name="create-outline" size={22} color={theme.primary} />
                </View>
                <ThemedText style={styles.gridButtonText}>Edit Vehicle</ThemedText>
              </Pressable>
            ) : (
              <View style={[styles.gridButton, styles.disabledButton]}>
                <View style={[styles.iconBox, { backgroundColor: theme.divider }]}>
                  <Ionicons name="lock-closed-outline" size={22} color={theme.textSecondary} />
                </View>
                <ThemedText style={[styles.gridButtonText, { color: theme.textSecondary }]}>Edit (Locked)</ThemedText>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.gridButton,
                pressed && styles.pressed,
                !vehicle.owner_phone && styles.disabledButton,
              ]}
              onPress={() => handleCall(vehicle.owner_phone)}
              disabled={!vehicle.owner_phone}
            >
              <View style={[styles.iconBox, { backgroundColor: theme.success + '15' }]}>
                <Ionicons name="call-outline" size={22} color={theme.success} />
              </View>
              <ThemedText style={styles.gridButtonText}>Call Owner</ThemedText>
            </Pressable>

            {canDelete ? (
              <Pressable
                style={({ pressed }) => [styles.gridButton, pressed && styles.pressed]}
                onPress={() => onDelete(vehicle)}
              >
                <View style={[styles.iconBox, { backgroundColor: theme.destructive + '15' }]}>
                  <Ionicons name="trash-outline" size={22} color={theme.destructive} />
                </View>
                <ThemedText style={[styles.gridButtonText, { color: theme.destructive }]}>Delete Vehicle</ThemedText>
              </Pressable>
            ) : (
              <View style={[styles.gridButton, styles.disabledButton]}>
                <View style={[styles.iconBox, { backgroundColor: theme.divider }]}>
                  <Ionicons name="lock-closed-outline" size={22} color={theme.textSecondary} />
                </View>
                <ThemedText style={[styles.gridButtonText, { color: theme.textSecondary }]}>Delete (Locked)</ThemedText>
              </View>
            )}
          </View>

          {/* Close */}
          <Pressable
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
            onPress={onClose}
          >
            <ThemedText style={styles.cancelText}>Close</ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  return useMemo(() => StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15, 23, 23, 0.55)' },
    sheet: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingBottom: 36,
    },
    handleRow: { alignItems: 'center', paddingTop: 10, paddingBottom: 14 },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border },

    // Number plate header
    plateCard: {
      flexDirection: 'row',
      alignItems: 'stretch',
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: theme.backgroundSelected,
      marginBottom: 6,
    },
    plateBadge: {
      backgroundColor: theme.text,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 10,
    },
    plateBadgeText: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.background,
      letterSpacing: 0.5,
    },
    plateNumber: {
      flex: 1,
      fontSize: 20,
      fontWeight: '900',
      color: theme.text,
      letterSpacing: 1,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    plateSubtitle: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 20,
      textAlign: 'center',
    },

    // Grid
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 10,
      columnGap: 10,
      marginBottom: 20,
    },
    gridButton: {
      width: '48%',
      aspectRatio: 1.12,
      backgroundColor: theme.backgroundElement,
      borderRadius: 16,
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    disabledButton: { opacity: 0.55 },
    iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    gridButtonText: { fontSize: 12, fontWeight: '700', color: theme.text, textAlign: 'center' },

    // Close
    cancelBtn: {
      height: 48,
      borderRadius: 12,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelText: { fontSize: 14, fontWeight: '700', color: theme.primaryForeground },
    pressed: { opacity: 0.8 },
  }), [theme]);
};
