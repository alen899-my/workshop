import { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/hooks/use-currency';
import { getCurrentUser } from '@/services/auth.service';
import type { BillListItem } from '@/features/repairs/services/bill.service';

function getImageUrl(image?: string): string | null {
  if (!image) return null;
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  return null;
}

function handleCall(phone?: string) {
  if (!phone) return;
  Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
}

function fmtDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = d.toLocaleString('default', { month: 'short' });
  const yyyy = d.getFullYear();
  return `${dd} ${mm} ${yyyy}`;
}

interface InvoiceCardProps {
  invoice: BillListItem;
  onPress?: (invoice: BillListItem) => void;
  onDelete?: (invoice: BillListItem) => void;
}

export default function InvoiceCard({ invoice, onPress, onDelete }: InvoiceCardProps) {
  const theme = useTheme();
  const styles = useStyles(theme);

  const [showDelete, setShowDelete] = useState(false);
  const imageUrl = getImageUrl(invoice.vehicle_image);
  const isPaid = invoice.payment_status === 'Paid';
  const user = useMemo(() => getCurrentUser(), []);

  const handlePress = () => {
    if (showDelete) {
      setShowDelete(false);
    } else {
      onPress?.(invoice);
    }
  };

  const handleDeletePress = () => {
    setShowDelete(false);
    onDelete?.(invoice);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}
      onPress={handlePress}
      onLongPress={onDelete ? () => setShowDelete((prev) => !prev) : undefined}
      delayLongPress={400}
    >
      {/* Top row: vehicle image + plate + payment badge */}
      <View style={styles.topRow}>
        {imageUrl ? (
          <Image source={imageUrl} style={styles.vehicleImage} contentFit="cover" />
        ) : (
          <View style={[styles.vehicleImage, styles.vehicleImagePlaceholder, { backgroundColor: theme.primary + '15' }]}>
            <Ionicons name="car-outline" size={28} color={theme.primary} />
          </View>
        )}

        <View style={styles.topRight}>
          {/* Number plate */}
          <View style={styles.plate}>
            <View style={styles.plateBadge}>
              <ThemedText style={styles.plateBadgeText}>{user?.shopCountry || 'IND'}</ThemedText>
            </View>
            <ThemedText style={styles.plateNumber} numberOfLines={1}>
              {invoice.vehicle_number || '-'}
            </ThemedText>
          </View>

          {/* Vehicle model / type */}
          <ThemedText style={styles.vehicleTitle} numberOfLines={1}>
            {invoice.model_name || invoice.vehicle_type || 'Vehicle'}
          </ThemedText>
        </View>

        {/* Payment badge */}
        <View style={[styles.paymentBadge, { backgroundColor: isPaid ? theme.success + '20' : theme.warning + '20' }]}>
          <View style={[styles.paymentDot, { backgroundColor: isPaid ? theme.success : theme.warning }]} />
          <ThemedText style={[styles.paymentText, { color: isPaid ? theme.success : theme.warning }]}>
            {invoice.payment_status || 'Unpaid'}
          </ThemedText>
        </View>
      </View>

      {/* Owner + date + amount */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="person-outline" size={13} color={theme.textSecondary} />
          <ThemedText style={styles.infoText} numberOfLines={1}>
            {invoice.owner_name || '-'}
          </ThemedText>
          {invoice.phone_number && (
            <Pressable onPress={() => handleCall(invoice.phone_number)} style={styles.callBtn}>
              <Ionicons name="call" size={10} color={theme.textInverse} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.infoRow}>
        {invoice.created_at && (
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={13} color={theme.textSecondary} />
            <ThemedText style={styles.infoText}>{fmtDate(invoice.created_at)}</ThemedText>
          </View>
        )}

        {invoice.service_type && (
          <View style={styles.infoItem}>
            <Ionicons name="build-outline" size={13} color={theme.textSecondary} />
            <ThemedText style={styles.infoText} numberOfLines={1}>{invoice.service_type}</ThemedText>
          </View>
        )}
      </View>

      {/* Worker */}
      {invoice.attending_worker_name && (
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="person-circle-outline" size={13} color={theme.textSecondary} />
            <ThemedText style={styles.infoText} numberOfLines={1}>Worker: {invoice.attending_worker_name}</ThemedText>
          </View>
        </View>
      )}

      {/* Bottom row: amount + delete/chevron */}
      <View style={styles.bottomRow}>
        <ThemedText style={styles.amount}>
          {formatCurrency(invoice.total_amount, user?.shopCurrency)}
        </ThemedText>

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

import { useState } from 'react';

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

    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.three,
    },
    vehicleImage: {
      width: 80,
      height: 80,
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

    plate: {
      flexDirection: 'row',
      alignItems: 'stretch',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 6,
      overflow: 'hidden',
      backgroundColor: theme.backgroundSelected,
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
      fontSize: 16,
      fontWeight: '900',
      color: theme.text,
      letterSpacing: 1,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },

    paymentBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
    },
    paymentDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    paymentText: {
      fontSize: 11,
      fontWeight: '700',
    },

    vehicleTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.text,
    },

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
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    callBtn: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.success,
      alignItems: 'center',
      justifyContent: 'center',
    },

    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.divider,
    },
    amount: {
      fontSize: 18,
      fontWeight: '900',
      color: theme.primary,
    },
    deleteBtn: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: theme.error,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }), [theme]);
};
