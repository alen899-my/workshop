import { Spacing, UI } from '@/constants/theme';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ModalSheet from '@/components/ui/ModalSheet';
import { useTheme } from '@/hooks/use-theme';
import { getCallingCode, waitForCountries, countriesCache } from '@/utils/preload-countries';
import { parsePhoneNumberFromString } from 'libphonenumber-js/max';

interface CountryData {
  cca2: string;
  callingCode: string;
  currency: string;
}

interface Props {
  countryCode: string;
  phone: string;
  onCountryChange: (c: CountryData) => void;
  onPhoneChange: (phone: string) => void;
  error?: string;
  label?: string;
  callingCode?: string;
  /** Existing forms use international values; auth forms keep national input. */
  valueFormat?: 'international' | 'national';
}

export default function PhoneInputWithCode({
  countryCode,
  phone,
  onCountryChange,
  onPhoneChange,
  error,
  label = 'Phone Number',
  callingCode: controlledCallingCode,
  valueFormat = 'international',
}: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [all, setAll] = useState<any[] | null>(null);

  useEffect(() => {
    waitForCountries().then(() => {
      if (countriesCache && !all) {
        setAll(Object.values(countriesCache));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayedCode = controlledCallingCode || getCallingCode(countryCode) || '';

  const stripCode = (num: string): string => {
    if (!num) return '';
    if (!displayedCode) return num;
    let s = (num || '').trim().replace(/^00/, '+');
    // Collapse malformed "+91+919..." so prefix can be stripped repeatedly.
    if (s.includes('+')) s = s.startsWith('+') ? '+' + s.slice(1).replace(/\+/g, '') : s.replace(/\+/g, '');
    let guard = 0;
    while (displayedCode && s.startsWith(displayedCode) && guard < 5) {
      s = s.slice(displayedCode.length).trimStart();
      // "+91 +919..." -> after first strip we get "+919..."; keep stripping.
      if (s.startsWith('+') && displayedCode.startsWith('+') && s !== displayedCode) {
        // continue loop to strip again
      }
      guard += 1;
    }
    return s;
  };

  const localNumber = valueFormat === 'national' ? phone : stripCode(phone);

  const handlePhoneChange = useCallback(
    (text: string) => {
      const international = text.trim().replace(/^00/, '+');
      if (international.startsWith('+')) {
        const parsed = parsePhoneNumberFromString(international, { extract: false });
        if (parsed?.isValid() && parsed.country) {
          onCountryChange({ cca2: parsed.country, callingCode: `+${parsed.countryCallingCode}`, currency: countriesCache?.[parsed.country]?.currency?.[0] ?? 'USD' });
          onPhoneChange(valueFormat === 'national' ? parsed.nationalNumber : parsed.number);
          return;
        }
        // Retain invalid international input for validation instead of silently
        // converting it into a different number.
        onPhoneChange(international);
        return;
      }
      const cleaned = text.replace(/[^0-9]/g, '');
      if (valueFormat === 'national' || !cleaned) {
        onPhoneChange(cleaned);
        return;
      }
      // Avoid doubling when the user types/pastes the dial code again
      // (e.g. types "919876543210" while +91 is already selected).
      const codeDigits = (displayedCode || '').replace(/\D/g, '');
      if (codeDigits && cleaned.startsWith(codeDigits) && cleaned.length >= codeDigits.length + 7) {
        const asIs = parsePhoneNumberFromString(`+${cleaned}`, { extract: false });
        if (asIs?.isValid()) {
          onPhoneChange(asIs.number);
          return;
        }
      }
      onPhoneChange(displayedCode + cleaned);
    },
    [displayedCode, onPhoneChange, onCountryChange, valueFormat],
  );

  const filtered = useMemo(() => {
    if (!all) return [];
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter((c: any) => {
      const name = typeof c.name === 'string' ? c.name : c.name?.common ?? '';
      return name.toLowerCase().includes(q) || c.cca2?.toLowerCase().includes(q) || (c.callingCode?.[0] ?? '').includes(q);
    });
  }, [all, search]);

  const handleSelect = useCallback(
    (country: any) => {
      const code = country.callingCode?.[0] ? `+${country.callingCode[0]}` : '';
      onCountryChange({ cca2: country.cca2, callingCode: code, currency: country.currency?.[0] ?? 'USD' });
      if (valueFormat === 'international' && localNumber) {
        let national = (localNumber || '').trim();
        // localNumber may still be a full international number from another
        // country (e.g. "+44..." while switching to +1). Keep only national.
        if (national.startsWith('+') || national.startsWith('00')) {
          const norm = national.replace(/^00/, '+');
          const parsed = parsePhoneNumberFromString(norm, { extract: false });
          if (parsed?.isValid()) national = parsed.nationalNumber;
          else {
            national = norm.replace(/\+/g, '').replace(/[\s\-.()]/g, '');
            const newDigits = code.replace(/\D/g, '');
            if (newDigits && national.startsWith(newDigits) && national.length >= newDigits.length + 7) {
              national = national.slice(newDigits.length);
            }
          }
        }
        national = national.replace(/\D/g, '');
        onPhoneChange(code + national);
      }
      Keyboard.dismiss();
      setOpen(false);
      setSearch('');
    },
    [onCountryChange, onPhoneChange, localNumber, valueFormat],
  );

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View style={[styles.inputContainer, { borderColor: error ? theme.error : theme.border, backgroundColor: theme.card }]}>
        <Pressable style={styles.codeBtn} onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel={`Country code ${countryCode} ${displayedCode}`}>
          <Text style={[styles.codeText, { color: displayedCode ? theme.text : theme.tabIconDefault }]}>{displayedCode || 'Code'}</Text>
          <MaterialCommunityIcons name="chevron-down" size={14} color={theme.textSecondary} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TextInput
          style={[styles.input, { color: theme.text }]}
          value={localNumber}
          onChangeText={handlePhoneChange}
          placeholder="Phone number"
          placeholderTextColor={theme.tabIconDefault}
          keyboardType="phone-pad"
          autoComplete="tel"
          accessibilityLabel={label}
          maxLength={64}
        />
      </View>
      {error && (
        <View style={styles.errorRow}>
          <MaterialCommunityIcons name="alert-circle-outline" size={12} color={theme.error} />
          <Text style={[styles.error, { color: theme.error }]}>{error}</Text>
        </View>
      )}

      <ModalSheet visible={open} title="Select Country Code" onClose={() => { setOpen(false); setSearch(''); }}>
        <View style={[styles.searchWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="magnify" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search countries..."
            placeholderTextColor={theme.tabIconDefault}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <MaterialCommunityIcons name="close-circle" size={16} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <FlatList
          data={filtered}
          ListEmptyComponent={<Text style={{ color: theme.textSecondary, padding: 16 }}>{all ? 'No countries found' : 'Loading countries...'}</Text>}
          keyExtractor={(item: any) => item.cca2}
          renderItem={({ item }: { item: any }) => {
            const active = item.cca2 === countryCode;
            const name = typeof item.name === 'string' ? item.name : item.name?.common ?? '';
            const code = item.callingCode?.[0] ? `+${item.callingCode[0]}` : '';
            return (
              <Pressable
                style={[styles.countryRow, active && { backgroundColor: theme.backgroundSelected }]}
                onPress={() => handleSelect(item)}
              >
                <Text style={[styles.countryName, { color: theme.text, fontWeight: active ? '700' : '500' }]} numberOfLines={1}>
                  {name}
                </Text>
                <Text style={[styles.callingCode, { color: theme.textSecondary }]}>{code}</Text>
                {active && <MaterialCommunityIcons name="check" size={20} color={theme.primary} />}
              </Pressable>
            );
          }}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />
      </ModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: UI.radius,
    height: UI.controlHeight,
    overflow: 'hidden',
  },
  codeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: '100%',
  },

  codeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 28,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    paddingHorizontal: 14,
    paddingVertical: 0,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 2,
    marginTop: 2,
  },
  error: {
    fontSize: 12,
    fontWeight: '600',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.four,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderRadius: UI.radius,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  list: {
    paddingHorizontal: Spacing.four,
    minHeight: 200,
  },
  listContent: {
    paddingBottom: Spacing.four,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12,
  },
  countryName: {
    flex: 1,
    fontSize: 15,
  },
  callingCode: {
    fontSize: 14,
    fontWeight: '600',
  },
});
