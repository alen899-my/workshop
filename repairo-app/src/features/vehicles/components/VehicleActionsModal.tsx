import { useMemo } from 'react';
import { Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Vehicle } from '@/features/vehicles/services/vehicle.service';

interface VehicleActionsModalProps {
  visible: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
  onViewDetails: (vehicle: Vehicle) => void;
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
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          <View style={styles.tealHeaderCard}>
            <ThemedText style={styles.vehicleNo}>{vehicle.vehicle_number}</ThemedText>
            <ThemedText style={styles.ownerInfo}>
              {vehicle.owner_name || 'No owner'} • {vehicle.model_name || vehicle.vehicle_type || 'Vehicle'}
            </ThemedText>
          </View>

          <View style={styles.grid}>
            <Pressable
              style={({ pressed }) => [styles.gridButton, pressed && styles.pressed]}
              onPress={() => onViewDetails(vehicle)}
            >
              <View style={[styles.iconBox, { backgroundColor: theme.primary + '18' }]}>
                <Ionicons name="eye-outline" size={22} color={theme.primary} />
              </View>
              <ThemedText style={styles.gridButtonText}>View Details</ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.gridButton, pressed && styles.pressed]}
              onPress={() => onViewDetails(vehicle)}
            >
              <View style={[styles.iconBox, { backgroundColor: theme.info + '18' }]}>
                <Ionicons name="construct-outline" size={22} color={theme.info} />
              </View>
              <ThemedText style={styles.gridButtonText}>Past Repairs</ThemedText>
            </Pressable>

            {canEdit ? (
              <Pressable
                style={({ pressed }) => [styles.gridButton, pressed && styles.pressed]}
                onPress={() => onEdit(vehicle)}
              >
                <View style={[styles.iconBox, { backgroundColor: theme.primary + '25' }]}>
                  <Ionicons name="create-outline" size={22} color={theme.primary} />
                </View>
                <ThemedText style={styles.gridButtonText}>Edit Vehicle</ThemedText>
              </Pressable>
            ) : (
              <View style={[styles.gridButton, styles.disabledButton]}>
                <View style={[styles.iconBox, { backgroundColor: theme.border }]}>
                  <Ionicons name="lock-closed-outline" size={22} color={theme.textMuted} />
                </View>
                <ThemedText style={[styles.gridButtonText, { color: theme.textMuted }]}>
                  Edit (Locked)
                </ThemedText>
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
              <View style={[styles.iconBox, { backgroundColor: theme.success + '18' }]}>
                <Ionicons name="call-outline" size={22} color={theme.success} />
              </View>
              <ThemedText style={styles.gridButtonText}>Call Owner</ThemedText>
            </Pressable>

            {canDelete ? (
              <Pressable
                style={({ pressed }) => [styles.gridButton, pressed && styles.pressed]}
                onPress={() => onDelete(vehicle)}
              >
                <View style={[styles.iconBox, { backgroundColor: theme.error + '18' }]}>
                  <Ionicons name="trash-outline" size={22} color={theme.error} />
                </View>
                <ThemedText style={[styles.gridButtonText, { color: theme.error }]}>
                  Delete Vehicle
                </ThemedText>
              </Pressable>
            ) : (
              <View style={[styles.gridButton, styles.disabledButton]}>
                <View style={[styles.iconBox, { backgroundColor: theme.border }]}>
                  <Ionicons name="lock-closed-outline" size={22} color={theme.textMuted} />
                </View>
                <ThemedText style={[styles.gridButtonText, { color: theme.textMuted }]}>
                  Delete (Locked)
                </ThemedText>
              </View>
            )}
          </View>

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
    backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15, 15, 15, 0.62)' },
    sheet: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: Spacing.four,
      paddingBottom: 40,
      borderWidth: 1.5,
      borderColor: theme.border,
    },
    handleRow: { alignItems: 'center', paddingTop: 12, paddingBottom: 14 },
    handle: { width: 44, height: 5, borderRadius: 2.5, backgroundColor: theme.border },
    tealHeaderCard: {
      backgroundColor: theme.primary,
      borderRadius: 24,
      paddingVertical: 18,
      paddingHorizontal: 20,
      alignItems: 'center',
      marginBottom: Spacing.four,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 3,
    },
    vehicleNo: { fontSize: 22, fontWeight: '900', color: theme.primaryForeground },
    ownerInfo: { fontSize: 13, fontWeight: '700', color: 'rgba(255, 255, 255, 0.82)', marginTop: 4 },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 12,
      columnGap: 12,
      marginBottom: Spacing.four,
    },
    gridButton: {
      width: '48%',
      aspectRatio: 1.12,
      backgroundColor: theme.muted,
      borderRadius: 20,
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    disabledButton: { opacity: 0.65 },
    iconBox: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
    gridButtonText: { fontSize: 13, fontWeight: '700', color: theme.text, textAlign: 'center' },
    cancelBtn: {
      height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: theme.primary,
      backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center',
    },
    cancelText: { fontSize: 14, fontWeight: '800', color: theme.primary },
    pressed: { opacity: 0.8 },
  }), [theme]);
};
