import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useCurrency, formatCurrency } from '@/hooks/use-currency';
import { getCurrentUser, updateCurrentUser } from '@/services/auth.service';
import { shopService } from '@/services/shop.service';

const CURRENCIES = [
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'AFN', name: 'Afghan Afghani' },
  { code: 'ARS', name: 'Argentine Peso' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'BDT', name: 'Bangladeshi Taka' },
  { code: 'BGN', name: 'Bulgarian Lev' },
  { code: 'BHD', name: 'Bahraini Dinar' },
  { code: 'BND', name: 'Brunei Dollar' },
  { code: 'BOB', name: 'Bolivian Boliviano' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CLP', name: 'Chilean Peso' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'COP', name: 'Colombian Peso' },
  { code: 'CRC', name: 'Costa Rican Colon' },
  { code: 'CZK', name: 'Czech Koruna' },
  { code: 'DKK', name: 'Danish Krone' },
  { code: 'DOP', name: 'Dominican Peso' },
  { code: 'DZD', name: 'Algerian Dinar' },
  { code: 'EGP', name: 'Egyptian Pound' },
  { code: 'ETB', name: 'Ethiopian Birr' },
  { code: 'EUR', name: 'Euro' },
  { code: 'FJD', name: 'Fiji Dollar' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'GHS', name: 'Ghanaian Cedi' },
  { code: 'GTQ', name: 'Guatemalan Quetzal' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'HUF', name: 'Hungarian Forint' },
  { code: 'IDR', name: 'Indonesian Rupiah' },
  { code: 'ILS', name: 'Israeli Shekel' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'IQD', name: 'Iraqi Dinar' },
  { code: 'IRR', name: 'Iranian Rial' },
  { code: 'ISK', name: 'Icelandic Krona' },
  { code: 'JOD', name: 'Jordanian Dinar' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'KES', name: 'Kenyan Shilling' },
  { code: 'KHR', name: 'Cambodian Riel' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'KWD', name: 'Kuwaiti Dinar' },
  { code: 'LAK', name: 'Lao Kip' },
  { code: 'LKR', name: 'Sri Lankan Rupee' },
  { code: 'MAD', name: 'Moroccan Dirham' },
  { code: 'MMK', name: 'Myanmar Kyat' },
  { code: 'MNT', name: 'Mongolian Tugrik' },
  { code: 'MOP', name: 'Macanese Pataca' },
  { code: 'MVR', name: 'Maldivian Rufiyaa' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'MYR', name: 'Malaysian Ringgit' },
  { code: 'NGN', name: 'Nigerian Naira' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'NPR', name: 'Nepalese Rupee' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'OMR', name: 'Omani Rial' },
  { code: 'PAB', name: 'Panamanian Balboa' },
  { code: 'PEN', name: 'Peruvian Sol' },
  { code: 'PGK', name: 'Papua New Guinean Kina' },
  { code: 'PHP', name: 'Philippine Peso' },
  { code: 'PKR', name: 'Pakistani Rupee' },
  { code: 'PLN', name: 'Polish Zloty' },
  { code: 'PYG', name: 'Paraguayan Guarani' },
  { code: 'QAR', name: 'Qatari Riyal' },
  { code: 'RON', name: 'Romanian Leu' },
  { code: 'RUB', name: 'Russian Ruble' },
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'TND', name: 'Tunisian Dinar' },
  { code: 'TRY', name: 'Turkish Lira' },
  { code: 'TWD', name: 'Taiwan Dollar' },
  { code: 'TZS', name: 'Tanzanian Shilling' },
  { code: 'UAH', name: 'Ukrainian Hryvnia' },
  { code: 'UGX', name: 'Ugandan Shilling' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'UYU', name: 'Uruguayan Peso' },
  { code: 'VND', name: 'Vietnamese Dong' },
  { code: 'XPF', name: 'CFP Franc' },
  { code: 'ZAR', name: 'South African Rand' },
];

interface CurrencySettingsScreenProps {
  onClose: () => void;
}

export default function CurrencySettingsScreen({ onClose }: CurrencySettingsScreenProps) {
  const { top, bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const user = useMemo(() => getCurrentUser(), []);
  const { symbol, format } = useCurrency(user);

  const [currency, setCurrency] = useState(user?.shopCurrency || 'INR');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return CURRENCIES;
    const q = search.toLowerCase();
    return CURRENCIES.filter(
      (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [search]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const shopId = user?.shopId;
      if (!shopId) return;
      const res = await shopService.update(shopId, { currency });
      if (res.success) {
        await updateCurrentUser({ shopCurrency: currency });
        onClose();
      } else {
        alert('Failed to update currency. Please try again.');
      }
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [currency, user, onClose]);

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: top + 4 }]}>
        <Pressable style={styles.headerBack} onPress={onClose}>
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Currency</ThemedText>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: Math.max(bottom, 16) + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Selection */}
        <View style={styles.section}>
          <ThemedText themeColor="textSecondary" style={styles.sectionTitle}>
            SELECTED CURRENCY
          </ThemedText>
          <View style={[styles.selectedCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.selectedIcon, { backgroundColor: theme.primary + '15' }]}>
              <ThemedText style={{ fontSize: 24, fontWeight: '800', color: theme.primary }}>{symbol}</ThemedText>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>{currency}</ThemedText>
              <ThemedText style={{ fontSize: 12, fontWeight: '500', color: theme.textSecondary }}>
                {CURRENCIES.find((c) => c.code === currency)?.name || currency}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Live Preview */}
        <View style={[styles.section, { alignItems: 'center' }]}>
          <View
            style={[
              styles.previewCard,
              { backgroundColor: theme.primary + '06', borderColor: theme.primary + '30' },
            ]}
          >
            <ThemedText
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: theme.primary + '80',
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              Live Preview
            </ThemedText>
            <ThemedText
              style={{
                fontSize: 36,
                fontWeight: '400',
                color: theme.primary,
                fontVariant: ['tabular-nums'],
              }}
            >
              {formatCurrency(4500.5, currency)}
            </ThemedText>
            <ThemedText
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: theme.primary,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginTop: 8,
              }}
            >
              Code: {currency}
            </ThemedText>
          </View>
        </View>

        {/* Warning */}
        <View style={[styles.section]}>
          <View
            style={[
              styles.warningCard,
              { backgroundColor: theme.warning + '12', borderColor: theme.warning + '30' },
            ]}
          >
            <Ionicons name="warning-outline" size={18} color={theme.warning} />
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText
                style={{ fontSize: 12, fontWeight: '700', color: theme.warning, textTransform: 'uppercase' }}
              >
                Price Consistency
              </ThemedText>
              <ThemedText style={{ fontSize: 11, fontWeight: '500', color: theme.warning + 'cc' }}>
                Changing currency applies instantly to all prices. Existing amounts remain as numbers but display with the new symbol.
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Search + Currency List */}
        <View style={styles.section}>
          <ThemedText themeColor="textSecondary" style={styles.sectionTitle}>
            ALL CURRENCIES
          </ThemedText>
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            value={search}
            onChangeText={setSearch}
            placeholder="Search currencies..."
            placeholderTextColor={theme.tabIconDefault}
          />
          <View
            style={[
              styles.listCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            {filtered.map((c, i) => {
              const active = currency === c.code;
              return (
                <Pressable
                  key={c.code}
                  style={[
                    styles.currencyRow,
                    { borderColor: theme.border },
                    i === 0 && styles.rowFirst,
                    i === filtered.length - 1 && styles.rowLast,
                    active && { backgroundColor: theme.primary + '10' },
                  ]}
                  onPress={() => setCurrency(c.code)}
                >
                  <View
                    style={[
                      styles.radio,
                      { borderColor: active ? theme.primary : theme.border },
                      active && { backgroundColor: theme.primary },
                    ]}
                  >
                    {active && (
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: active ? theme.primary : theme.text,
                      }}
                    >
                      {c.code}
                    </ThemedText>
                    <ThemedText
                      style={{
                        fontSize: 11,
                        fontWeight: '500',
                        color: theme.textSecondary,
                      }}
                    >
                      {c.name}
                    </ThemedText>
                  </View>
                </Pressable>
              );
            })}
            {filtered.length === 0 && (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 13, color: theme.textSecondary, fontStyle: 'italic' }}>
                  No currencies found
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(bottom, 16), backgroundColor: theme.background }]}>
        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: theme.primary },
            pressed && { opacity: 0.8 },
            saving && { opacity: 0.6 },
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="save-outline" size={16} color="#FFFFFF" />
              <ThemedText style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>
                Save Changes
              </ThemedText>
            </View>
          )}
        </Pressable>
      </View>
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
  section: { marginBottom: 16, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    paddingLeft: 4,
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  selectedIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCard: {
    width: '100%',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  listCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowFirst: {},
  rowLast: { borderBottomWidth: 0 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  saveBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
