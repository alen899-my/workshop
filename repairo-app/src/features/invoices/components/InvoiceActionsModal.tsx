import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getCurrentUser } from '@/services/auth.service';
import type { BillListItem } from '@/features/repairs/services/bill.service';

interface InvoiceActionsModalProps {
  visible: boolean;
  invoice: BillListItem | null;
  onClose: () => void;
  onViewBill: (invoice: BillListItem) => void;
  onDelete: (invoice: BillListItem) => void;
}

export default function InvoiceActionsModal({
  visible,
  invoice,
  onClose,
  onViewBill,
  onDelete,
}: InvoiceActionsModalProps) {
  const theme = useTheme();
  const styles = useStyles(theme);

  if (!invoice) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          {/* Vehicle Plate Header */}
          <View style={styles.plateCard}>
            <View style={styles.plateBadge}>
              <ThemedText style={styles.plateBadgeText}>{getCurrentUser()?.shopCountry || 'IND'}</ThemedText>
            </View>
            <ThemedText style={styles.plateNumber}>{invoice.vehicle_number || '-'}</ThemedText>
          </View>
          <ThemedText style={styles.plateSubtitle}>
            {invoice.owner_name || '-'} • {invoice.model_name || invoice.vehicle_type || 'Vehicle'}
          </ThemedText>

          {/* Action Grid */}
          <View style={styles.grid}>
            <Pressable
              style={({ pressed }) => [styles.gridButton, pressed && styles.pressed]}
              onPress={() => onViewBill(invoice)}
            >
              <View style={[styles.iconBox, { backgroundColor: theme.success + '15' }]}>
                <Ionicons name="receipt-outline" size={22} color={theme.success} />
              </View>
              <ThemedText style={styles.gridButtonText}>View / Edit Bill</ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.gridButton, pressed && styles.pressed]}
              onPress={() => onDelete(invoice)}
            >
              <View style={[styles.iconBox, { backgroundColor: theme.error + '15' }]}>
                <Ionicons name="trash-outline" size={22} color={theme.error} />
              </View>
              <ThemedText style={styles.gridButtonText}>Delete Invoice</ThemedText>
            </Pressable>
          </View>

          {/* Close Button */}
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
    backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' },
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
    plateSubtitle: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 20,
      textAlign: 'center',
    },
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
  }), [theme]);
};
