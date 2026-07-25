import { Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { getCurrentUser } from '@/services/auth.service';
import type { Repair } from '@/features/repairs/services/repair.service';

interface QuickRepairActionsModalProps {
  visible: boolean;
  repair: Repair | null;
  onClose: () => void;
  onViewJobCard: (repair: Repair) => void;
  onEditJobCard: (repair: Repair) => void;
  onEditBill: (repair: Repair) => void;
  onDelete: (repair: Repair) => void;
  canDelete: boolean;
}

function handleCall(phone?: string) {
  if (!phone) return;
  Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
}

export default function QuickRepairActionsModal({
  visible,
  repair,
  onClose,
  onViewJobCard,
  onEditJobCard,
  onEditBill,
  onDelete,
  canDelete,
}: QuickRepairActionsModalProps) {
  if (!repair) return null;

  const theme = useTheme();
  const styles = useStyles(theme);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          <View style={styles.plateCard}>
            <View style={styles.plateBadge}>
              <ThemedText style={styles.plateBadgeText}>{getCurrentUser()?.shopCountry || 'IND'}</ThemedText>
            </View>
            <ThemedText style={styles.plateNumber}>{repair.vehicle_number}</ThemedText>
          </View>
          <ThemedText style={styles.plateSubtitle}>Quick Repair</ThemedText>

          <View style={styles.grid}>
            <Pressable
              style={({ pressed }) => [styles.gridButton, pressed && styles.pressed]}
              onPress={() => onViewJobCard(repair)}
            >
              <View style={[styles.iconBox, { backgroundColor: '#3B82F6' + '15' }]}>
                <Ionicons name="eye-outline" size={22} color="#3B82F6" />
              </View>
              <ThemedText style={styles.gridButtonText}>View Job Card</ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.gridButton, pressed && styles.pressed]}
              onPress={() => onEditJobCard(repair)}
            >
              <View style={[styles.iconBox, { backgroundColor: '#F59E0B' + '20' }]}>
                <Ionicons name="create-outline" size={22} color="#F59E0B" />
              </View>
              <ThemedText style={styles.gridButtonText}>Edit Job Card</ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.gridButton, pressed && styles.pressed]}
              onPress={() => onEditBill(repair)}
            >
              <View style={[styles.iconBox, { backgroundColor: theme.success + '15' }]}>
                <Ionicons name="receipt-outline" size={22} color={theme.success} />
              </View>
              <ThemedText style={styles.gridButtonText}>Edit Bill</ThemedText>
            </Pressable>

            {repair.owner_name && repair.phone_number ? (
              <Pressable
                style={({ pressed }) => [styles.gridButton, pressed && styles.pressed]}
                onPress={() => handleCall(repair.phone_number)}
              >
                <View style={[styles.iconBox, { backgroundColor: '#22C55E' + '15' }]}>
                  <Ionicons name="call-outline" size={22} color="#22C55E" />
                </View>
                <ThemedText style={styles.gridButtonText}>Call Customer</ThemedText>
              </Pressable>
            ) : null}

            {canDelete ? (
              <Pressable
                style={({ pressed }) => [styles.gridButton, pressed && styles.pressed]}
                onPress={() => onDelete(repair)}
              >
                <View style={[styles.iconBox, { backgroundColor: theme.error + '15' }]}>
                  <Ionicons name="trash-outline" size={22} color={theme.error} />
                </View>
                <ThemedText style={styles.gridButtonText}>Delete Job</ThemedText>
              </Pressable>
            ) : (
              <View style={[styles.gridButton, styles.disabledButton]}>
                <View style={[styles.iconBox, { backgroundColor: theme.border }]}>
                  <Ionicons name="lock-closed-outline" size={22} color={theme.textSecondary} />
                </View>
                <ThemedText style={[styles.gridButtonText, { color: theme.textSecondary }]}>
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
  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    sheet: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingBottom: 36,
      paddingTop: 4,
    },
    handleRow: { alignItems: 'center', paddingVertical: 10 },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border },
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
    plateBadgeText: { fontSize: 11, fontWeight: '800', color: theme.background, letterSpacing: 0.5 },
    plateNumber: {
      flex: 1,
      fontSize: 20,
      fontWeight: '900',
      color: theme.text,
      letterSpacing: 1,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    plateSubtitle: { fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: 20, textAlign: 'center' },
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
      aspectRatio: 1.08,
      backgroundColor: theme.card,
      borderRadius: 18,
      padding: 10,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    disabledButton: { opacity: 0.5 },
    iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    gridButtonText: { fontSize: 12, fontWeight: '700', color: theme.text, textAlign: 'center' },
    cancelBtn: {
      height: 50,
      borderRadius: 14,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    cancelText: { fontSize: 15, fontWeight: '800', color: theme.primaryForeground, letterSpacing: 0.3 },
    pressed: { opacity: 0.85 },
  });
};
