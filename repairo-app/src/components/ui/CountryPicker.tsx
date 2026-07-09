import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import ModalSheet from '@/components/ui/ModalSheet';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { waitForCountries, countriesCache } from '@/utils/preload-countries';

interface CountryData {
  cca2: string;
  name: string;
  currency: string;
  callingCode: string;
}

interface Props {
  value: string;
  onChange: (country: CountryData) => void;
  error?: string;
  selectedName?: string;
}

export default function CountryPicker({ value, onChange, error, selectedName: controlledName }: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [all, setAll] = useState<any[] | null>(null);
  const [localName, setLocalName] = useState('');

  const displayName = controlledName || localName;

  useEffect(() => {
    waitForCountries().then(() => {
      if (countriesCache && !all) {
        setAll(Object.values(countriesCache));
      }
      if (!controlledName) {
        const c = countriesCache?.[value];
        if (c) setLocalName(typeof c.name === 'string' ? c.name : c.name?.common ?? '');
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const filtered = useMemo(() => {
    if (!all) return [];
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter((c: any) => {
      const name = typeof c.name === 'string' ? c.name : c.name?.common ?? '';
      return name.toLowerCase().includes(q) || c.cca2?.toLowerCase().includes(q);
    });
  }, [all, search]);

  const handleSelect = useCallback(
    (country: any) => {
      const name = typeof country.name === 'string' ? country.name : country.name?.common ?? '';
      setLocalName(name);
      onChange({
        cca2: country.cca2,
        name,
        currency: country.currency?.[0] ?? 'USD',
        callingCode: country.callingCode?.[0] ?? '',
      });
      setOpen(false);
      setSearch('');
    },
    [onChange],
  );

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.text }]}>Country</Text>
      <Pressable
        style={[
          styles.trigger,
          { borderColor: error ? theme.error : theme.border, backgroundColor: theme.card },
        ]}
        onPress={() => setOpen(true)}
      >
        <Text
          style={[styles.triggerText, { color: displayName ? theme.text : theme.tabIconDefault }]}
          numberOfLines={1}
        >
          {displayName || 'Select Country'}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textSecondary} />
      </Pressable>
      {error && (
        <View style={styles.errorRow}>
          <MaterialCommunityIcons name="alert-circle-outline" size={12} color={theme.error} />
          <Text style={[styles.error, { color: theme.error }]}>{error}</Text>
        </View>
      )}

      <ModalSheet visible={open} title="Select Country" onClose={() => { setOpen(false); setSearch(''); }}>
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
            const active = item.cca2 === value;
            const name = typeof item.name === 'string' ? item.name : item.name?.common ?? '';
            return (
              <Pressable
                style={[styles.countryRow, active && { backgroundColor: theme.backgroundSelected }]}
                onPress={() => handleSelect(item)}
              >
                <Text
                  style={[styles.countryName, { color: theme.text, fontWeight: active ? '700' : '500' }]}
                  numberOfLines={1}
                >
                  {name}
                </Text>
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
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },

  triggerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
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
});
