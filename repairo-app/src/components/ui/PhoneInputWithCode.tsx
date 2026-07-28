import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ModalSheet from '@/components/ui/ModalSheet';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getCallingCode, waitForCountries, countriesCache } from '@/utils/preload-countries';

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
}

export default function PhoneInputWithCode({
  countryCode,
  phone,
  onCountryChange,
  onPhoneChange,
  error,
  label = 'Phone Number',
  callingCode: controlledCallingCode,
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
  const codeWithoutPlus = displayedCode ? displayedCode.replace('+', '') : '';

  const stripCode = (num: string): string => {
    if (displayedCode && num.startsWith(displayedCode)) return num.slice(displayedCode.length).trimStart();
    if (codeWithoutPlus && num.startsWith(codeWithoutPlus)) return num.slice(codeWithoutPlus.length).trimStart();
    return num;
  };

  const localNumber = stripCode(phone);

  const handlePhoneChange = useCallback(
    (text: string) => {
      const cleaned = text.replace(/[^0-9\s\-()]/g, '');
      onPhoneChange(displayedCode + cleaned);
    },
    [displayedCode, onPhoneChange],
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
      Keyboard.dismiss();
      setOpen(false);
      setSearch('');
    },
    [onCountryChange],
  );

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View style={[styles.inputContainer, { borderColor: error ? theme.error : theme.border, backgroundColor: theme.card }]}>
        <Pressable style={styles.codeBtn} onPress={() => setOpen(true)}>
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
    borderWidth: 1.5,
    borderRadius: 14,
    height: 52,
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
    borderRadius: 12,
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
