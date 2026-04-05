import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Phone, Shield, Key, Moon, Sun, LogOut, Banknote, Percent, ChevronRight } from 'lucide-react-native';

import DashboardHeader from '../components/DashboardHeader';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { useToast } from '../components/ui/WorkshopToast';
import { userService } from '../services/management.service';

const FONT = 'monospace';

export default function SettingsScreen({ navigation }) {
  const T = useTheme();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', password: '', confirmPassword: '' });

  useEffect(() => {
    if (user) {
      setForm(f => ({ ...f, name: user.name || '', phone: user.phone || '' }));
    }
  }, [user]);

  const handleSave = async () => {
    if (!form.name || !form.phone) {
       toast({ type: 'error', title: 'Missing', description: 'Name and Phone are required' });
       return;
    }
    if (form.password && form.password !== form.confirmPassword) {
       toast({ type: 'error', title: 'Mismatch', description: 'Passwords do not match' });
       return;
    }

    setLoading(true);
    const payload = { name: form.name, phone: form.phone };
    if (form.password) payload.password = form.password;

    const res = await userService.update(user.id, payload);
    setLoading(false);

    if (res.success) {
       toast({ type: 'success', title: 'Updated', description: 'Profile updated successfully' });
    } else {
       toast({ type: 'error', title: 'Error', description: res.error || 'Failed to update' });
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout }
    ]);
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: T.bg }]} edges={['top', 'bottom']}>
      <DashboardHeader />
      
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
         <View style={s.header}>
           <Text style={[s.pageTitle, { color: T.text }]}>Settings & Profile</Text>
           <Text style={[s.pageSubtitle, { color: T.textMuted }]}>Manage your account preferences</Text>
         </View>

         {/* Profile Card */}
         <View style={s.section}>
            <Text style={[s.sectionTitle, { color: T.primary }]}>PERSONAL INFO</Text>
            <View style={[s.card, { backgroundColor: T.surface, borderColor: T.border }]}>
               <View style={s.inputRow}>
                  <User size={16} color={T.textMuted} />
                  <TextInput
                    style={[s.input, { color: T.text }]}
                    placeholder="Full Name"
                    placeholderTextColor={T.textMuted}
                    value={form.name}
                    onChangeText={t => setForm({ ...form, name: t })}
                  />
               </View>
               <View style={[s.divider, { backgroundColor: T.border }]} />
               <View style={s.inputRow}>
                  <Phone size={16} color={T.textMuted} />
                  <TextInput
                    style={[s.input, { color: T.text }]}
                    placeholder="Phone Number"
                    keyboardType="phone-pad"
                    placeholderTextColor={T.textMuted}
                    value={form.phone}
                    onChangeText={t => setForm({ ...form, phone: t })}
                  />
               </View>
            </View>
         </View>

         {/* Workshop Configuration */}
         <View style={s.section}>
            <Text style={[s.sectionTitle, { color: T.primary }]}>WORKSHOP CONFIGURATION</Text>
            <View style={[s.card, { backgroundColor: T.surface, borderColor: T.border }]}>
               <TouchableOpacity 
                 style={[s.inputRow, { justifyContent: 'space-between', paddingVertical: 12 }]}
                 onPress={() => navigation.navigate('Currency')}
               >
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                     <Banknote size={20} color={T.text} />
                     <Text style={[s.settingTxt, { color: T.text }]}>Currency Settings</Text>
                  </View>
                  <ChevronRight size={20} color={T.textMuted} />
               </TouchableOpacity>
               
               <View style={[s.divider, { backgroundColor: T.border }]} />

               <TouchableOpacity 
                 style={[s.inputRow, { justifyContent: 'space-between', paddingVertical: 12 }]}
                 onPress={() => navigation.navigate('Taxes')}
               >
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                     <Percent size={20} color={T.text} />
                     <Text style={[s.settingTxt, { color: T.text }]}>Tax Rules</Text>
                  </View>
                  <ChevronRight size={20} color={T.textMuted} />
               </TouchableOpacity>

            </View>
         </View>

         {/* Security Card */}
         <View style={s.section}>
            <Text style={[s.sectionTitle, { color: T.primary }]}>SECURITY</Text>
            <View style={[s.card, { backgroundColor: T.surface, borderColor: T.border }]}>
               <View style={s.inputRow}>
                  <Key size={16} color={T.textMuted} />
                  <TextInput
                    style={[s.input, { color: T.text }]}
                    placeholder="New Password (Optional)"
                    placeholderTextColor={T.textMuted}
                    secureTextEntry
                    value={form.password}
                    onChangeText={t => setForm({ ...form, password: t })}
                  />
               </View>
               <View style={[s.divider, { backgroundColor: T.border }]} />
               <View style={s.inputRow}>
                  <Key size={16} color={T.textMuted} />
                  <TextInput
                    style={[s.input, { color: T.text }]}
                    placeholder="Confirm New Password"
                    placeholderTextColor={T.textMuted}
                    secureTextEntry
                    value={form.confirmPassword}
                    onChangeText={t => setForm({ ...form, confirmPassword: t })}
                  />
               </View>
            </View>
         </View>

         <TouchableOpacity 
            style={[s.saveBtn, { backgroundColor: T.primary }]} 
            onPress={handleSave}
            disabled={loading}
         >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveBtnTxt}>SAVE CHANGES</Text>}
         </TouchableOpacity>

         {/* Preferences */}
         <View style={s.section}>
            <Text style={[s.sectionTitle, { color: T.primary }]}>PREFERENCES</Text>
            <View style={[s.card, { backgroundColor: T.surface, borderColor: T.border }]}>
               <View style={[s.inputRow, { justifyContent: 'space-between', paddingVertical: 12 }]}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                     {T.isDark ? <Moon size={20} color={T.text} /> : <Sun size={20} color={T.text} />}
                     <Text style={[s.settingTxt, { color: T.text }]}>Dark Mode</Text>
                  </View>
                  <Switch 
                     value={T.themeMode === 'dark' || (T.themeMode === 'system' && T.isDark)} 
                     onValueChange={(val) => T.setThemeMode(val ? 'dark' : 'light')} 
                     trackColor={{ false: T.borderStrong, true: T.primary }}
                  />
               </View>
               
               <View style={[s.divider, { backgroundColor: T.border }]} />

               <View style={[s.inputRow, { justifyContent: 'space-between', paddingVertical: 12 }]}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                     <Shield size={20} color={T.text} />
                     <Text style={[s.settingTxt, { color: T.text }]}>Role</Text>
                  </View>
                  <View style={[s.roleBadge, { backgroundColor: T.primary + '20' }]}>
                     <Text style={[s.roleTxt, { color: T.primary }]}>{user?.role?.replace('_', ' ')}</Text>
                  </View>
               </View>

            </View>
         </View>

         <TouchableOpacity style={[s.logoutBtn, { backgroundColor: T.danger + '10' }]} onPress={handleLogout}>
            <LogOut size={20} color={T.danger} />
            <Text style={[s.logoutTxt, { color: T.danger }]}>LOGOUT</Text>
         </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 60 },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30 },
  pageTitle: { fontSize: 28, fontWeight: '900', fontFamily: FONT, letterSpacing: -1 },
  pageSubtitle: { fontSize: 13, marginTop: 4 },

  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 10, fontWeight: '900', fontFamily: FONT, letterSpacing: 2, marginBottom: 8, paddingLeft: 4 },
  card: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16 },
  
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 50 },
  input: { flex: 1, fontSize: 14, fontWeight: '600', height: '100%' },
  settingTxt: { fontSize: 14, fontWeight: '700' },
  
  divider: { height: 1, width: '100%' },

  saveBtn: { marginHorizontal: 20, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  saveBtnTxt: { color: '#FFF', fontSize: 13, fontWeight: '900', fontFamily: FONT, letterSpacing: 1 },

  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  roleTxt: { fontSize: 10, fontWeight: '900', fontFamily: FONT, textTransform: 'uppercase' },

  logoutBtn: { marginHorizontal: 20, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  logoutTxt: { fontSize: 12, fontWeight: '900', fontFamily: FONT, letterSpacing: 1 }
});
