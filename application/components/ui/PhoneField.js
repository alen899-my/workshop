import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import { ChevronDown, Search, Check, X } from 'lucide-react-native';
import { Country } from 'country-state-city';
import { AppModal } from './AppModal';

const FONT = Platform.OS === 'ios' ? 'System' : 'sans-serif';

// ── Dial codes map (ISO2 → calling code) ─────────────────────────────────────
const DIAL_CODES = {
  AF:93, AL:355, DZ:213, AD:376, AO:244, AG:1268, AR:54, AM:374,
  AU:61, AT:43, AZ:994, BS:1242, BH:973, BD:880, BB:1246, BY:375,
  BE:32, BZ:501, BJ:229, BT:975, BO:591, BA:387, BW:267, BR:55,
  BN:673, BG:359, BF:226, BI:257, CV:238, KH:855, CM:237, CA:1,
  CF:236, TD:235, CL:56, CN:86, CO:57, KM:269, CG:242, CD:243,
  CR:506, HR:385, CU:53, CY:357, CZ:420, DK:45, DJ:253, DM:1767,
  DO:1809, EC:593, EG:20, SV:503, GQ:240, ER:291, EE:372, SZ:268,
  ET:251, FJ:679, FI:358, FR:33, GA:241, GM:220, GE:995, DE:49,
  GH:233, GR:30, GD:1473, GT:502, GN:224, GW:245, GY:592, HT:509,
  HN:504, HU:36, IS:354, IN:91, ID:62, IR:98, IQ:964, IE:353,
  IL:972, IT:39, JM:1876, JP:81, JO:962, KZ:7, KE:254, KI:686,
  KP:850, KR:82, KW:965, KG:996, LA:856, LV:371, LB:961, LS:266,
  LR:231, LY:218, LI:423, LT:370, LU:352, MG:261, MW:265, MY:60,
  MV:960, ML:223, MT:356, MH:692, MR:222, MU:230, MX:52, FM:691,
  MD:373, MC:377, MN:976, ME:382, MA:212, MZ:258, MM:95, NA:264,
  NR:674, NP:977, NL:31, NZ:64, NI:505, NE:227, NG:234, NO:47,
  OM:968, PK:92, PW:680, PS:970, PA:507, PG:675, PY:595, PE:51,
  PH:63, PL:48, PT:351, QA:974, RO:40, RU:7, RW:250, KN:1869,
  LC:1758, VC:1784, WS:685, SM:378, ST:239, SA:966, SN:221, RS:381,
  SC:248, SL:232, SG:65, SK:421, SI:386, SB:677, SO:252, ZA:27,
  SS:211, ES:34, LK:94, SD:249, SR:597, SE:46, CH:41, SY:963,
  TW:886, TJ:992, TZ:255, TH:66, TL:670, TG:228, TO:676, TT:1868,
  TN:216, TR:90, TM:993, TV:688, UG:256, UA:380, AE:971, GB:44,
  US:1, UY:598, UZ:998, VU:678, VE:58, VN:84, YE:967, ZM:260, ZW:263,
};

// Convert ISO2 → flag emoji (regional indicator letters)
function getFlagEmoji(iso2) {
  if (!iso2 || iso2.length !== 2) return '🌍';
  return iso2
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
}

// ── Country Picker Modal ─────────────────────────────────────────────────────
function CountryPickerModal({ visible, onClose, onSelect, selectedCode }) {
  const [query, setQuery] = useState('');

  const allCountries = useMemo(
    () =>
      Country.getAllCountries()
        .filter(c => DIAL_CODES[c.isoCode])
        .map(c => ({
          iso: c.isoCode,
          name: c.name,
          flag: getFlagEmoji(c.isoCode),
          dial: DIAL_CODES[c.isoCode],
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCountries;
    return allCountries.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        String(c.dial).includes(q),
    );
  }, [query, allCountries]);

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  const handleSelect = (iso) => {
    setQuery('');
    onSelect(iso);
  };

  return (
    <AppModal visible={visible} onClose={handleClose} title="Select Country" scroll={false}>
      {/* Search bar */}
      <View style={s.searchRow}>
        <Search size={16} color="#94A3B8" strokeWidth={2} />
        <TextInput
          style={[s.searchInput, { fontFamily: FONT }]}
          placeholder="Search country or code..."
          placeholderTextColor="#A0AEC0"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          underlineColorAndroid="transparent"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={14} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Country list */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.iso}
        style={{ maxHeight: 400 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        initialNumToRender={20}
        ListEmptyComponent={
          <Text style={[s.emptyText, { fontFamily: FONT }]}>No countries found.</Text>
        }
        renderItem={({ item }) => {
          const isSelected = item.iso === selectedCode;
          return (
            <TouchableOpacity
              style={[s.countryItem, isSelected && s.countryItemSelected]}
              onPress={() => handleSelect(item.iso)}
              activeOpacity={0.7}
            >
              <Text style={s.countryFlag}>{item.flag}</Text>
              <Text
                style={[s.countryName, { fontFamily: FONT }, isSelected && s.countryNameSelected]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text style={[s.countryDial, { fontFamily: FONT }]}>+{item.dial}</Text>
              {isSelected && <Check size={15} color="#3D7A78" strokeWidth={2.5} />}
            </TouchableOpacity>
          );
        }}
      />
    </AppModal>
  );
}

// ── Main PhoneField Export ───────────────────────────────────────────────────
/**
 * Props:
 *   defaultCountry  – ISO2 string, e.g. "IN"
 *   onChangeFormattedText – called with "+91XXXXXXXXXX" on each change
 *   error           – error message string
 *   style           – optional outer wrapper style
 */
export function PhoneField({ defaultCountry = 'IN', onChangeFormattedText, error, style }) {
  const [selectedIso, setSelectedIso] = useState(defaultCountry);
  const [number, setNumber] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (defaultCountry && defaultCountry !== selectedIso) {
      setSelectedIso(defaultCountry);
      // We don't necessarily call onChangeFormattedText here to avoid infinite loops,
      // but the UI will now show the correct flag and dial code.
    }
  }, [defaultCountry]);

  const dial = DIAL_CODES[selectedIso] ?? 1;
  const flag = getFlagEmoji(selectedIso);

  const handleNumberChange = useCallback(
    (text) => {
      // Only allow digits
      const digits = text.replace(/[^0-9]/g, '');
      setNumber(digits);
      onChangeFormattedText?.(`+${dial}${digits}`);
    },
    [dial, onChangeFormattedText],
  );

  const handleCountrySelect = useCallback(
    (iso) => {
      setSelectedIso(iso);
      setPickerOpen(false);
      const newDial = DIAL_CODES[iso] ?? 1;
      onChangeFormattedText?.(`+${newDial}${number}`);
    },
    [number, onChangeFormattedText],
  );

  return (
    <View style={style}>
      <View style={[s.phoneRow, error && s.phoneRowError]}>
        {/* Country selector button */}
        <TouchableOpacity
          style={s.countryBtn}
          onPress={() => setPickerOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={s.flagText}>{flag}</Text>
          <Text style={[s.dialText, { fontFamily: FONT }]}>+{dial}</Text>
          <ChevronDown size={13} color="#94A3B8" strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Divider */}
        <View style={s.divider} />

        {/* Number input */}
        <TextInput
          style={[s.numberInput, { fontFamily: FONT }]}
          placeholder="Phone number"
          placeholderTextColor="#A0AEC0"
          keyboardType="phone-pad"
          value={number}
          onChangeText={handleNumberChange}
          underlineColorAndroid="transparent"
        />
      </View>

      {/* Country picker modal */}
      <CountryPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleCountrySelect}
        selectedCode={selectedIso}
      />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Phone row
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    height: 52,
    overflow: 'hidden',
  },
  phoneRowError: {
    borderColor: '#F87171',
    backgroundColor: '#FEF2F2',
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: '100%',
    gap: 4,
  },
  flagText: {
    fontSize: 22,
    lineHeight: 28,
  },
  dialText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 2,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 2,
  },
  numberInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    paddingHorizontal: 12,
    height: '100%',
  },
  // Search row
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    height: '100%',
  },
  // Country list items
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 10,
    marginBottom: 2,
  },
  countryItemSelected: {
    backgroundColor: '#EDF7F7',
  },
  countryFlag: {
    fontSize: 22,
    width: 30,
  },
  countryName: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  countryNameSelected: {
    color: '#3D7A78',
    fontWeight: '700',
  },
  countryDial: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginRight: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    paddingVertical: 24,
    fontSize: 14,
  },
});
