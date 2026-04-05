import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Store, Save, Coins, AlertTriangle, Search, X } from 'lucide-react-native';
import currencyCodes from 'currency-codes';
import { useTheme } from '../../lib/theme';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../components/ui/WorkshopToast';
import { shopService } from '../../services/management.service';

export default function CurrencyScreen({ navigation }) {
  const T = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();

  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currency, setCurrency] = useState('INR');
  const [searchQuery, setSearchQuery] = useState('');

  const allCurrencies = useMemo(() => {
    try {
      const data = currencyCodes.data || [];
      return data.map(c => ({
        code: c.code,
        label: `${c.code} — ${c.currency || c.name}`
      })).sort((a, b) => a.label.localeCompare(b.label));
    } catch (e) {
      return [{ code: 'INR', label: 'INR — Indian Rupee' }];
    }
  }, []);

  const filteredCurrencies = useMemo(() => {
    if (!searchQuery) return allCurrencies.slice(0, 50); // Show top 50 by default
    const q = searchQuery.toLowerCase();
    const filtered = allCurrencies.filter(c => 
      c.code.toLowerCase().includes(q) || 
      c.label.toLowerCase().includes(q)
    );
    return filtered.slice(0, 50);
  }, [allCurrencies, searchQuery]);

  useEffect(() => {
    const sId = user?.shopId || user?.shop_id;
    if (sId) {
      shopService.getById(Number(sId)).then(res => {
         if (res.success && res.data) {
           setShop(res.data);
           setCurrency(res.data.currency || 'INR');
         }
         setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleSave = async () => {
    const sId = user?.shopId || user?.shop_id;
    if (!shop || !sId) return;
    setSaving(true);
    const res = await shopService.update(Number(sId), { currency });
    setSaving(false);

    if (res.success) {
      toast({ type: 'success', title: 'Saved', description: `Shop currency is now ${currency}.` });
      navigation.goBack();
    } else {
      toast({ type: 'error', title: 'Error', description: 'Failed to update currency.' });
    }
  };

  if (loading) {
     return (
       <View style={[styles.center, { backgroundColor: T.bg }]}>
         <ActivityIndicator size="large" color={T.primary} />
       </View>
     );
  }

  if (!shop) {
     return (
       <View style={[styles.center, { backgroundColor: T.bg }]}>
         <Text style={{ color: T.text, fontSize: 16 }}>No shop found for your account.</Text>
       </View>
     );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        
        {/* Shop Info */}
        <View style={[styles.infoCard, { backgroundColor: T.surface, borderColor: T.border }]}>
          <View style={[styles.iconWrapper, { backgroundColor: T.primary + '20', borderColor: T.primary + '30' }]}>
            <Store size={24} color={T.primary} />
          </View>
          <View>
            <Text style={[styles.label, { color: T.textMuted }]}>ACTIVE SHOP</Text>
            <Text style={[styles.shopName, { color: T.text }]}>{shop.name}</Text>
          </View>
        </View>

        {/* Warning Banner */}
        <View style={[styles.warningBanner, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
          <AlertTriangle size={20} color="#d97706" />
          <View style={styles.warningTextContainer}>
            <Text style={[styles.warningTitle, { color: '#b45309' }]}>Critical: Price Consistency</Text>
            <Text style={[styles.warningText, { color: '#92400e' }]}>
               Changing currency applies instantly. Numbers remain same, but symbol updates.
            </Text>
          </View>
        </View>

        {/* Preview Card */}
        <View style={[styles.previewCard, { backgroundColor: T.primary + '0a', borderColor: T.primary + '30' }]}>
           <View style={styles.previewHeader}>
              <Coins size={14} color={T.primary} />
              <Text style={[styles.previewTitle, { color: T.primary }]}>LIVE DISPLAY PREVIEW</Text>
           </View>
           <Text style={[styles.previewAmount, { color: T.primary }]} numberOfLines={1} adjustsFontSizeToFit>
             {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(4500.50)}
           </Text>
           <View style={[styles.currencyTag, { backgroundColor: T.primary + '20' }]}>
             <Text style={[styles.currencyTagText, { color: T.primary }]}>Code: {currency}</Text>
           </View>
        </View>

        <View style={styles.selectionHeader}>
           <Text style={[styles.sectionTitle, { color: T.textMuted }]}>SELECT WORKSHOP CURRENCY</Text>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: T.surface, borderColor: T.border }]}>
           <Search size={18} color={T.textMuted} />
           <TextInput 
              style={[styles.searchInput, { color: T.text }]}
              placeholder="Search currencies..."
              placeholderTextColor={T.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
           />
           {searchQuery.length > 0 && (
             <TouchableOpacity onPress={() => setSearchQuery('')}>
               <X size={18} color={T.textMuted} />
             </TouchableOpacity>
           )}
        </View>
        
        <View style={styles.currencyList}>
          {filteredCurrencies.map((c) => {
             const active = currency === c.code;
             return (
               <TouchableOpacity 
                 key={c.code}
                 style={[styles.currencyCard, { 
                   backgroundColor: active ? T.primary : T.surface, 
                   borderColor: active ? T.primary : T.border 
                 }]}
                 onPress={() => setCurrency(c.code)}
               >
                  <Text style={[styles.currencyLabel, { color: active ? '#fff' : T.text }]}>{c.label}</Text>
                  <View style={[styles.currencyCodeBadge, { backgroundColor: active ? 'rgba(255,255,255,0.2)' : T.border }]}>
                    <Text style={[styles.currencyCodeText, { color: active ? '#fff' : T.text }]}>{c.code}</Text>
                  </View>
               </TouchableOpacity>
             );
          })}
          {filteredCurrencies.length === 0 && (
            <View style={styles.noResults}>
               <Text style={[styles.noResultsText, { color: T.textMuted }]}>No currencies found matching "{searchQuery}"</Text>
            </View>
          )}
        </View>

      </ScrollView>

      <View style={[styles.footer, { backgroundColor: T.surface, borderColor: T.border }]}>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: T.primary }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : (
            <>
              <Save size={18} color="#fff" />
              <Text style={styles.saveBtnTxt}>SAVE SETTINGS</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingBottom: 40, gap: 16 },
  
  infoCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, gap: 14 },
  iconWrapper: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 2 },
  shopName: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  
  warningBanner: { flexDirection: 'row', padding: 14, borderRadius: 14, borderWidth: 1, gap: 12, alignItems: 'center' },
  warningTextContainer: { flex: 1 },
  warningTitle: { fontSize: 12, fontWeight: '900', marginBottom: 2, textTransform: 'uppercase' },
  warningText: { fontSize: 11, lineHeight: 16, opacity: 0.8 },

  previewCard: { padding: 30, borderRadius: 20, borderWidth: 1, alignItems: 'center', overflow: 'hidden' },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 15 },
  previewTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  previewAmount: { fontSize: 42, fontWeight: '300', letterSpacing: -1, marginBottom: 15 },
  currencyTag: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100 },
  currencyTagText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  selectionHeader: { marginTop: 10 },
  sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, opacity: 0.6 },

  searchContainer: { flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 15, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600' },

  currencyList: { gap: 10 },
  currencyCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, borderWidth: 1 },
  currencyLabel: { fontSize: 14, fontWeight: '700', flex: 1, marginRight: 10 },
  currencyCodeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  currencyCodeText: { fontSize: 11, fontWeight: '900' },

  noResults: { padding: 40, alignItems: 'center' },
  noResultsText: { fontSize: 14, fontWeight: '500', textAlign: 'center' },

  footer: { padding: 20, borderTopWidth: 1 },
  saveBtn: { flexDirection: 'row', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 10, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  saveBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 1.5 }
});
