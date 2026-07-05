import React from 'react';
import { Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import type { Repair } from '@/features/repairs/services/repair.service';

interface RepairActionsModalProps {
  visible: boolean;
  repair: Repair | null;
  onClose: () => void;
  onViewDetails: (repair: Repair) => void;
  onEditDetails: (repair: Repair) => void;
  onStatusTransition: (repair: Repair, nextStatus: string) => void;
  onDelete: (repair: Repair) => void;
  canDelete: boolean;
  canEdit: boolean;
  onGenerateBill: (repair: Repair) => void;
}

function getTransitionInfo(status?: string) {
  if (!status) return null;
  if (status === 'Pending') {
    return {
      nextStatus: 'Started',
      label: 'Mark as Started',
      icon: 'play-outline' as const,
      color: Colors.info,
    };
  }
  if (status === 'Started') {
    return {
      nextStatus: 'Completed',
      label: 'Mark as Completed',
      icon: 'checkmark-circle-outline' as const,
      color: Colors.success,
    };
  }
  if (status === 'Completed') {
    return {
      nextStatus: 'Pending',
      label: 'Reopen Job',
      icon: 'refresh-outline' as const,
      color: Colors.warning,
    };
  }
  return null;
}

function handleCall(phone?: string) {
  if (!phone) return;
  Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
}

export default function RepairActionsModal({
  visible,
  repair,
  onClose,
  onViewDetails,
  onEditDetails,
  onStatusTransition,
  onDelete,
  canDelete,
  canEdit,
  onGenerateBill,
}: RepairActionsModalProps) {
  if (!repair) return null;

  const transition = getTransitionInfo(repair.status);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Grab Bar Indicator */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          {/* Teal Header Card */}
          <View style={styles.tealHeaderCard}>
            <ThemedText style={styles.vehicleNo}>{repair.vehicle_number}</ThemedText>
            <ThemedText style={styles.ownerInfo}>
              {repair.owner_name} • {repair.model_name || 'Generic'}
            </ThemedText>
          </View>

          {/* Action Button Grid */}
          <View style={styles.grid}>
            {/* Grid Item 1: Status Action */}
            {transition ? (
              <Pressable
                style={({ pressed }) => [
                  styles.gridButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => onStatusTransition(repair, transition.nextStatus)}
              >
                <View style={[styles.iconBox, { backgroundColor: transition.color + '18' }]}>
                  <Ionicons name={transition.icon} size={22} color={transition.color} />
                </View>
                <ThemedText style={styles.gridButtonText}>{transition.label}</ThemedText>
              </Pressable>
            ) : (
              <View style={[styles.gridButton, styles.disabledButton]}>
                <View style={[styles.iconBox, { backgroundColor: Colors.border }]}>
                  <Ionicons name="checkmark-done" size={22} color={Colors.tabIconDefault} />
                </View>
                <ThemedText style={[styles.gridButtonText, { color: Colors.tabIconDefault }]}>
                  Job Completed
                </ThemedText>
              </View>
            )}

            {/* Grid Item 2: Generate Bill */}
            <Pressable
              style={({ pressed }) => [
                styles.gridButton,
                pressed && styles.pressed,
              ]}
              onPress={() => onGenerateBill(repair)}
            >
              <View style={[styles.iconBox, { backgroundColor: Colors.primary + '18' }]}>
                <Ionicons name="receipt-outline" size={22} color={Colors.primary} />
              </View>
              <ThemedText style={styles.gridButtonText}>Generate Bill</ThemedText>
            </Pressable>

            {/* Grid Item 3: View Job Card */}
            <Pressable
              style={({ pressed }) => [
                styles.gridButton,
                pressed && styles.pressed,
              ]}
              onPress={() => onViewDetails(repair)}
            >
              <View style={[styles.iconBox, { backgroundColor: Colors.primary + '18' }]}>
                <Ionicons name="eye-outline" size={22} color={Colors.primary} />
              </View>
              <ThemedText style={styles.gridButtonText}>View Job Card</ThemedText>
            </Pressable>

            {/* Grid Item 4: Edit Details */}
            {canEdit ? (
              <Pressable
                style={({ pressed }) => [
                  styles.gridButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => onEditDetails(repair)}
              >
                <View style={[styles.iconBox, { backgroundColor: Colors.accent + '25' }]}>
                  <Ionicons name="create-outline" size={22} color={Colors.primary} />
                </View>
                <ThemedText style={styles.gridButtonText}>Edit Job Card</ThemedText>
              </Pressable>
            ) : (
              <View style={[styles.gridButton, styles.disabledButton]}>
                <View style={[styles.iconBox, { backgroundColor: Colors.border }]}>
                  <Ionicons name="lock-closed-outline" size={22} color={Colors.tabIconDefault} />
                </View>
                <ThemedText style={[styles.gridButtonText, { color: Colors.tabIconDefault }]}>
                  Edit (Locked)
                </ThemedText>
              </View>
            )}

            {/* Grid Item 5: Call Customer */}
            <Pressable
              style={({ pressed }) => [
                styles.gridButton,
                pressed && styles.pressed,
                !repair.phone_number && styles.disabledButton,
              ]}
              onPress={() => handleCall(repair.phone_number)}
              disabled={!repair.phone_number}
            >
              <View style={[styles.iconBox, { backgroundColor: Colors.success + '18' }]}>
                <Ionicons name="call-outline" size={22} color={Colors.success} />
              </View>
              <ThemedText style={styles.gridButtonText}>Call Customer</ThemedText>
            </Pressable>

            {/* Grid Item 6: Delete Job */}
            {canDelete ? (
              <Pressable
                style={({ pressed }) => [
                  styles.gridButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => onDelete(repair)}
              >
                <View style={[styles.iconBox, { backgroundColor: Colors.error + '18' }]}>
                  <Ionicons name="trash-outline" size={22} color={Colors.error} />
                </View>
                <ThemedText style={[styles.gridButtonText, { color: Colors.error }]}>
                  Delete Job
                </ThemedText>
              </Pressable>
            ) : (
              <View style={[styles.gridButton, styles.disabledButton]}>
                <View style={[styles.iconBox, { backgroundColor: Colors.border }]}>
                  <Ionicons name="lock-closed-outline" size={22} color={Colors.tabIconDefault} />
                </View>
                <ThemedText style={[styles.gridButtonText, { color: Colors.tabIconDefault }]}>
                  Delete Job (Locked)
                </ThemedText>
              </View>
            )}
          </View>

          {/* Full-width Close/Cancel Button at Bottom */}
          <Pressable
            style={({ pressed }) => [
              styles.cancelBtn,
              pressed && styles.pressed,
            ]}
            onPress={onClose}
          >
            <ThemedText style={styles.cancelText}>Close</ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 15, 15, 0.62)',
  },
  sheet: {
    backgroundColor: Colors.background, // Cream app background
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: Spacing.four,
    paddingBottom: 40,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 14,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.border,
  },
  tealHeaderCard: {
    backgroundColor: Colors.primary, // Teal color card background (#3D7A78)
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: Spacing.four,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  vehicleNo: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textInverse, // White text on teal card
  },
  ownerInfo: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.82)', // Subtle white text
    marginTop: 4,
  },
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
    backgroundColor: Colors.backgroundElement, // Cream color button background
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gridButtonFull: {
    width: '100%',
    height: 58,
    flexDirection: 'row',
    backgroundColor: Colors.backgroundElement, // Cream color button background
    borderRadius: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disabledButton: {
    opacity: 0.65,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  cancelBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary, // Teal border
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary, // Teal text
  },
  pressed: {
    opacity: 0.8,
  },
});
