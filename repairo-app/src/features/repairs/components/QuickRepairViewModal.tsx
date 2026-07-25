import { useMemo } from 'react';
import { getCurrentUser } from '@/services/auth.service';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { Repair } from '@/features/repairs/services/repair.service';

function getComplaintText(complaints?: unknown): string {
  if (!complaints) return 'No complaint specified';
  let blocks: any[];
  if (typeof complaints === 'string') {
    try { blocks = JSON.parse(complaints); } catch { return complaints; }
  } else if (Array.isArray(complaints)) {
    blocks = complaints;
  } else {
    return 'No complaint specified';
  }
  const texts = blocks.flatMap((b: any) =>
    (b.tasks || []).map((t: any) => t.text || '')
  );
  return texts.filter(Boolean).join(', ') || 'No complaint specified';
}

interface QuickRepairViewModalProps {
  visible: boolean;
  repair: Repair | null;
  onClose: () => void;
}

export default function QuickRepairViewModal({ visible, repair, onClose }: QuickRepairViewModalProps) {
  const theme = useTheme();
  const styles = useStyles(theme);

  const complaintText = useMemo(() => getComplaintText(repair?.complaints), [repair?.complaints]);
  const imageUrl = repair?.vehicle_image?.startsWith('http') ? repair.vehicle_image : null;
  const countryCode = useMemo(() => getCurrentUser()?.shopCountry || 'IND', []);

  if (!repair) return null;

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
              <ThemedText style={styles.plateBadgeText}>{countryCode}</ThemedText>
            </View>
            <ThemedText style={styles.plateNumber}>{repair.vehicle_number}</ThemedText>
          </View>

          {imageUrl ? (
            <Image source={imageUrl} style={styles.image} contentFit="cover" />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder, { backgroundColor: '#F59E0B' + '18' }]}>
              <Ionicons name="flash-outline" size={40} color="#F59E0B" />
            </View>
          )}

          <View style={styles.detailRow}>
            <View style={styles.detailIconWrap}>
              <Ionicons name="text-outline" size={16} color={theme.textSecondary} />
            </View>
            <View style={styles.detailContent}>
              <ThemedText style={styles.detailLabel}>Complaint</ThemedText>
              <ThemedText style={styles.detailValue}>{complaintText}</ThemedText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconWrap}>
              <Ionicons name="receipt-outline" size={16} color={theme.textSecondary} />
            </View>
            <View style={styles.detailContent}>
              <ThemedText style={styles.detailLabel}>Bill</ThemedText>
              <ThemedText style={styles.detailValue}>
                {repair.bill_id ? `Bill #${repair.bill_id}` : 'No bill'}
              </ThemedText>
            </View>
          </View>

          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: '#F59E0B' + '22' }]}>
              <Ionicons name="flash-outline" size={12} color="#F59E0B" />
              <ThemedText style={[styles.badgeText, { color: '#F59E0B' }]}>QUICK REPAIR</ThemedText>
            </View>
            <View style={[styles.badge, { backgroundColor: theme.success + '22' }]}>
              <ThemedText style={[styles.badgeText, { color: theme.success }]}>COMPLETED</ThemedText>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.8 }]}
            onPress={onClose}
          >
            <ThemedText style={styles.closeText}>Close</ThemedText>
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
      gap: 16,
    },
    handleRow: { alignItems: 'center', paddingVertical: 10 },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border },
    plateCard: {
      flexDirection: 'row',
      alignItems: 'stretch',
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: theme.backgroundSelected,
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
    image: {
      width: '100%',
      height: 180,
      borderRadius: 16,
      backgroundColor: theme.divider,
    },
    imagePlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    detailIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.backgroundElement,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    detailContent: {
      flex: 1,
      gap: 2,
    },
    detailLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
      lineHeight: 20,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    closeBtn: {
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
    closeText: { fontSize: 15, fontWeight: '800', color: theme.primaryForeground, letterSpacing: 0.3 },
  });
};
