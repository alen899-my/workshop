import { useMemo } from 'react';
import { Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { Customer } from '@/features/customers/services/customer.service';

interface CustomerActionsModalProps {
  visible: boolean;
  customer: Customer | null;
  onClose: () => void;
  onViewDetails: (customer: Customer) => void;
  onPastVisits: (customer: Customer) => void;
  onVehicles: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  canEdit: boolean;
  canDelete: boolean;
}

function handleCall(phone?: string) {
  if (!phone) return;
  Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
}

export default function CustomerActionsModal({
  visible,
  customer,
  onClose,
  onViewDetails,
  onPastVisits,
  onVehicles,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: CustomerActionsModalProps) {
  const theme = useTheme();
  const styles = useStyles(theme);

  if (!customer) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          <View style={styles.headerCard}>
            <View style={[styles.avatarWrap, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons name="person-outline" size={28} color={theme.primary} />
            </View>
            <View style={styles.headerInfo}>
              <ThemedText style={styles.headerName}>{customer.name || 'Unknown'}</ThemedText>
              <ThemedText style={styles.headerPhone}>{customer.phone || '—'}</ThemedText>
            </View>
          </View>

          <View style={styles.grid}>
            <Pressable
              style={({ pressed }) => [styles.gridButton, pressed && styles.pressed]}
              onPress={() => onViewDetails(customer)}
            >
              <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="eye-outline" size={22} color={theme.primary} />
              </View>
              <ThemedText style={styles.gridButtonText}>Owner Details</ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.gridButton, pressed && styles.pressed]}
              onPress={() => onPastVisits(customer)}
            >
              <View style={[styles.iconBox, { backgroundColor: theme.info + '15' }]}>
                <Ionicons name="construct-outline" size={22} color={theme.info} />
              </View>
              <ThemedText style={styles.gridButtonText}>Past Visits</ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.gridButton, pressed && styles.pressed]}
              onPress={() => onVehicles(customer)}
            >
              <View style={[styles.iconBox, { backgroundColor: theme.warning + '15' }]}>
                <Ionicons name="car-outline" size={22} color={theme.warning} />
              </View>
              <ThemedText style={styles.gridButtonText}>Vehicles</ThemedText>
            </Pressable>

            {canEdit ? (
              <Pressable
                style={({ pressed }) => [styles.gridButton, pressed && styles.pressed]}
                onPress={() => onEdit(customer)}
              >
                <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
                  <Ionicons name="create-outline" size={22} color={theme.primary} />
                </View>
                <ThemedText style={styles.gridButtonText}>Edit Customer</ThemedText>
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
                !customer.phone && styles.disabledButton,
              ]}
              onPress={() => handleCall(customer.phone)}
              disabled={!customer.phone}
            >
              <View style={[styles.iconBox, { backgroundColor: theme.success + '15' }]}>
                <Ionicons name="call-outline" size={22} color={theme.success} />
              </View>
              <ThemedText style={styles.gridButtonText}>Call Customer</ThemedText>
            </Pressable>

            {canDelete ? (
              <Pressable
                style={({ pressed }) => [styles.gridButton, pressed && styles.pressed]}
                onPress={() => onDelete(customer)}
              >
                <View style={[styles.iconBox, { backgroundColor: theme.destructive + '15' }]}>
                  <Ionicons name="trash-outline" size={22} color={theme.destructive} />
                </View>
                <ThemedText style={[styles.gridButtonText, { color: theme.destructive }]}>Delete Customer</ThemedText>
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

    headerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginBottom: 20,
      paddingHorizontal: 4,
    },
    avatarWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerInfo: { flex: 1 },
    headerName: { fontSize: 18, fontWeight: '800', color: theme.text },
    headerPhone: { fontSize: 13, fontWeight: '500', color: theme.textSecondary, marginTop: 2 },

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
