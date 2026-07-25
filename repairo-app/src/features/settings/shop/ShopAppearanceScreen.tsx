import { useState, useCallback } from 'react';
import { StyleSheet, View, Pressable, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme, useThemePreference } from '@/hooks/use-theme';
import { Spacing, Colors } from '@/constants/theme';
import { getCurrentUser, updateCurrentUser } from '@/services/auth.service';
import { shopService } from '@/services/shop.service';
import ColorPicker from '@/components/ui/ColorPicker';
import SuccessModal from '@/components/ui/SuccessModal';

interface ShopAppearanceScreenProps {
  onClose: () => void;
}

export default function ShopAppearanceScreen({ onClose }: ShopAppearanceScreenProps) {
  const { top, bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const { setShopPrimaryColor } = useThemePreference();
  const user = getCurrentUser();
  const initialColor = user?.shopPrimaryColor || Colors.primary;
  const [color, setColor] = useState(initialColor);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = useCallback(async () => {
    if (!user?.shopId) return;
    setSaving(true);
    try {
      const res = await shopService.update(user.shopId, { primary_color: color });
      if (res.success) {
        await updateCurrentUser({ shopPrimaryColor: color });
        await SecureStore.setItemAsync('repairo_shop_primary_color', color);
        setShopPrimaryColor(color);
        setShowSuccess(true);
      } else {
        Alert.alert('Error', res.error || 'Failed to save color');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }, [color, user, setShopPrimaryColor]);

  const handleReset = useCallback(async () => {
    if (!user?.shopId) return;
    Alert.alert(
      'Reset to Default',
      'This will restore your shop to the default teal color.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              const res = await shopService.update(user.shopId!, { primary_color: '' });
              if (res.success) {
                await updateCurrentUser({ shopPrimaryColor: null });
                await SecureStore.deleteItemAsync('repairo_shop_primary_color');
                setShopPrimaryColor(null);
                setColor(Colors.primary);
              } else {
                Alert.alert('Error', res.error || 'Failed to reset color');
              }
            } catch {
              Alert.alert('Error', 'Something went wrong');
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  }, [user, setShopPrimaryColor]);

  const handleSuccessDone = useCallback(() => {
    setShowSuccess(false);
    onClose();
  }, [onClose]);

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: top + 4 }]}>
        <Pressable style={styles.headerBack} onPress={onClose}>
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Shop Appearance</ThemedText>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: Math.max(bottom, 16) + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText themeColor="textSecondary" style={styles.description}>
          Choose a primary color for your shop. This will be used across the app as the main theme color.
        </ThemedText>

        <ColorPicker value={color} onChange={setColor} />

        <View style={styles.previewSection}>
          <ThemedText themeColor="textSecondary" style={styles.previewLabel}>PREVIEW</ThemedText>
          <View style={[styles.previewCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.previewRow}>
              <View style={[styles.previewBadge, { backgroundColor: color }]}>
                <ThemedText style={styles.previewBadgeText}>Primary</ThemedText>
              </View>
              <View style={[styles.previewIcon, { backgroundColor: color }]} />
            </View>
            <View style={[styles.previewBar, { backgroundColor: color + '30' }]}>
              <View style={[styles.previewBarFill, { backgroundColor: color, width: '65%' }]} />
            </View>
            <ThemedText style={[styles.previewText, { color }]}>
              This is how your shop color will look
            </ThemedText>
          </View>
        </View>

        <Pressable
          style={[styles.saveBtn, { backgroundColor: theme.primary, opacity: saving ? 0.6 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <ThemedText style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Color'}</ThemedText>
        </Pressable>

        <Pressable
          style={[styles.resetBtn, { borderColor: theme.border, opacity: saving ? 0.5 : 1 }]}
          onPress={handleReset}
          disabled={saving}
        >
          <Ionicons name="refresh-outline" size={16} color={theme.destructive} />
          <ThemedText style={[styles.resetBtnText, { color: theme.destructive }]}>Reset to Default</ThemedText>
        </Pressable>
      </ScrollView>

      <SuccessModal
        visible={showSuccess}
        title="Color Updated!"
        subtitle="Your shop's primary color has been saved successfully."
        onClose={handleSuccessDone}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 8,
  },
  headerBack: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  description: {
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 20,
    marginBottom: Spacing.four,
  },
  previewSection: {
    marginTop: Spacing.four,
    paddingHorizontal: 20,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: Spacing.two,
  },
  previewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  previewBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  previewBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  previewIcon: { width: 20, height: 20, borderRadius: 10 },
  previewBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  previewBarFill: { height: '100%', borderRadius: 4 },
  previewText: { fontSize: 13, fontWeight: '500' },
  saveBtn: {
    marginHorizontal: 20,
    marginTop: Spacing.five,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 20,
    marginTop: Spacing.three,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
  },
  resetBtnText: { fontSize: 14, fontWeight: '600' },
});
