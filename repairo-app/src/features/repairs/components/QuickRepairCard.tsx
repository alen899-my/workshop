import { useMemo } from 'react';
import { getCurrentUser } from '@/services/auth.service';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
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

function getComplaintPreview(complaints?: unknown): string {
  if (!complaints) return '';
  let blocks: any[];
  if (typeof complaints === 'string') {
    try { blocks = JSON.parse(complaints); } catch { return complaints; }
  } else if (Array.isArray(complaints)) {
    blocks = complaints;
  } else {
    return '';
  }
  const texts = blocks.flatMap((b: any) =>
    (b.tasks || []).map((t: any) => t.text || '')
  );
  return texts.filter(Boolean).join(', ');
}

interface QuickRepairCardProps {
  repair: Repair;
  onPress?: (repair: Repair) => void;
  onDelete?: (repair: Repair) => void;
}

export default function QuickRepairCard({ repair, onPress, onDelete }: QuickRepairCardProps) {
  const theme = useTheme();
  const styles = useStyles(theme);

  const imageUrl = getImageUrl(repair.vehicle_image);
  const complaintPreview = getComplaintPreview(repair.complaints);
  const shopCountry = useMemo(() => getCurrentUser()?.shopCountry, []);
  const countryCode = shopCountry || 'IND';

  return (
    <Pressable
      style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}
      onPress={() => onPress?.(repair)}
    >
      <View style={styles.row}>
        {imageUrl ? (
          <Image source={imageUrl} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder, { backgroundColor: '#F59E0B' + '18' }]}>
            <Ionicons name="flash-outline" size={28} color="#F59E0B" />
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.plate}>
            <View style={styles.plateBadge}>
              <ThemedText style={styles.plateBadgeText}>{countryCode}</ThemedText>
            </View>
            <ThemedText style={styles.plateNumber} numberOfLines={1}>
              {repair.vehicle_number}
            </ThemedText>
          </View>

          {complaintPreview ? (
            <ThemedText style={styles.complaint} numberOfLines={1}>
              {complaintPreview}
            </ThemedText>
          ) : null}

          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: '#F59E0B' + '22' }]}>
              <Ionicons name="flash-outline" size={11} color="#F59E0B" />
              <ThemedText style={[styles.badgeText, { color: '#F59E0B' }]}>QUICK</ThemedText>
            </View>
            <View style={[styles.badge, { backgroundColor: theme.success + '22' }]}>
              <ThemedText style={[styles.badgeText, { color: theme.success }]}>COMPLETED</ThemedText>
            </View>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} style={styles.chevron} />
      </View>
    </Pressable>
  );
}

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  return StyleSheet.create({
    wrapper: {
      marginHorizontal: Spacing.two,
      marginBottom: Spacing.two,
      backgroundColor: theme.backgroundElement,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: '#F59E0B' + '30',
      padding: Spacing.three,
    },
    pressed: { opacity: 0.92 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.three,
    },
    image: {
      width: 64,
      height: 64,
      borderRadius: 14,
    },
    imagePlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
      gap: 6,
    },
    plate: {
      flexDirection: 'row',
      alignItems: 'stretch',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 6,
      overflow: 'hidden',
      backgroundColor: theme.backgroundSelected,
      alignSelf: 'flex-start',
    },
    plateBadge: {
      backgroundColor: theme.text,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 5,
    },
    plateBadgeText: {
      fontSize: 8,
      fontWeight: '800',
      color: theme.background,
      letterSpacing: 0.5,
    },
    plateNumber: {
      fontSize: 15,
      fontWeight: '900',
      color: theme.text,
      letterSpacing: 0.8,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    complaint: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.textSecondary,
      lineHeight: 16,
    },
    badges: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    chevron: {
      marginLeft: 4,
    },
  });
};
