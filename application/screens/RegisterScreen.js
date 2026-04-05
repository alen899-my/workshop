import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { z } from 'zod';
import { useToast } from '../components/ui/WorkshopToast';
import { API_URL } from '../api';
import { WorkshopButton } from '../components/ui/WorkshopButton';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  Warehouse,
  ArrowRight,
  ChevronLeft,
  ChevronDown,
} from 'lucide-react-native';
import { PhoneField } from '../components/ui/PhoneField';
import { Country, State, City } from 'country-state-city';
import countryToCurrency from 'country-to-currency';
import { AppPicker } from '../components/ui/AppPicker';

const FONT = Platform.OS === 'ios' ? 'System' : 'sans-serif';

const registerSchema = z
  .object({
    shopName: z.string().min(1, 'Required'),
    ownerName: z.string().min(1, 'Required'),
    country: z.string().min(1, 'Select a country'),
    state: z.string().min(1, 'Select a state'),
    city: z.string().min(1, 'Select a city'),
    address: z.string().min(1, 'Required'),
    phone: z.string().min(8, 'Invalid phone number'),
    password: z.string().min(6, 'Min 6 characters'),
    confirmPassword: z.string().min(1, 'Required'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// ─── Reusable sub-components ─────────────────────────────────────────────────

function Label({ children }) {
  return <Text style={[s.label, { fontFamily: FONT }]}>{children}</Text>;
}

function FieldError({ message }) {
  if (!message) return null;
  return <Text style={[s.fieldError, { fontFamily: FONT }]}>{message}</Text>;
}

function InputRow({ icon, error, children, style }) {
  return (
    <View style={[s.inputRow, error && s.inputError, style]}>
      {icon && <View style={{ marginRight: 10 }}>{icon}</View>}
      {children}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    shopName: '',
    ownerName: '',
    country: '',
    state: '',
    city: '',
    address: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [formattedPhone, setFormattedPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { toast } = useToast();

  const countries = useMemo(
    () => Country.getAllCountries().map(c => ({ id: c.isoCode, name: c.name })),
    [],
  );

  const states = useMemo(
    () =>
      form.country
        ? State.getStatesOfCountry(form.country).map(s => ({ id: s.isoCode, name: s.name }))
        : [],
    [form.country],
  );

  const cities = useMemo(
    () =>
      form.state
        ? City.getCitiesOfState(form.country, form.state).map(c => ({ id: c.name, name: c.name }))
        : [],
    [form.country, form.state],
  );

  function updateForm(key, value) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function handleCountrySelect(countryCode) {
    const currency = countryToCurrency[countryCode] || '';
    setForm(f => ({ ...f, country: countryCode, state: '', city: '', currency }));
  }

  const handleRegister = async () => {
    const submitData = { ...form, phone: formattedPhone || form.phone };
    const valid = registerSchema.safeParse(submitData);
    if (!valid.success) {
      const errs = {};
      valid.error.issues.forEach(i => (errs[i.path[0]] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const locationString = `${submitData.address}, ${submitData.city}, ${submitData.state}, ${submitData.country}`;
      const currency = countryToCurrency[submitData.country] || 'USD';
      const payload = {
        shopName: submitData.shopName,
        ownerName: submitData.ownerName,
        location: locationString,
        phone: submitData.phone,
        password: submitData.password,
        country: submitData.country,
        state: submitData.state,
        city: submitData.city,
        address: submitData.address,
        currency,
      };

      const response = await fetch(`${API_URL}/auth/register-shop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast({ type: 'error', title: 'Registration Failed', description: data.error || 'Failed to create shop' });
        setLoading(false);
        return;
      }

      setLoading(false);
      toast({ type: 'success', title: 'Registration Success', description: 'Redirecting to login...' });
      setTimeout(() => navigation.navigate('Login'), 1500);
    } catch {
      setLoading(false);
      toast({ type: 'error', title: 'Network Error', description: 'Failed to connect to the backend.' });
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Dark Header ───────────────────────────────────────────── */}
          <View style={[s.header, { paddingTop: Platform.OS === 'android' ? 52 : 60 }]}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Landing')}
              activeOpacity={0.7}
              style={s.backBtn}
            >
              <ChevronLeft size={20} color="rgba(255,255,255,0.7)" strokeWidth={2} />
            </TouchableOpacity>

            <Text style={[s.logoText, { fontFamily: FONT }]}>
              VEH<Text style={{ color: '#7AB4CC' }}>REP</Text>
            </Text>
            <Text style={[s.headerTag, { fontFamily: FONT }]}>SETUP ACCOUNT</Text>
            <Text style={[s.headerTitle, { fontFamily: FONT }]}>Register Workshop</Text>
            <Text style={[s.headerSub, { fontFamily: FONT }]}>
              Create your professional workshop account
            </Text>
          </View>

          {/* ── Form Card ─────────────────────────────────────────────── */}
          <View style={s.card}>

            {/* Shop Name */}
            <View style={s.fieldGroup}>
              <Label>Shop Name</Label>
              <InputRow
                icon={<Warehouse size={18} color={errors.shopName ? '#F87171' : '#3D7A78'} strokeWidth={2} />}
                error={errors.shopName}
              >
                <TextInput
                  style={[s.textInput, { fontFamily: FONT }]}
                  placeholder="e.g. Speed Auto Works"
                  placeholderTextColor="#A0AEC0"
                  value={form.shopName}
                  onChangeText={v => updateForm('shopName', v)}
                  underlineColorAndroid="transparent"
                />
              </InputRow>
              <FieldError message={errors.shopName} />
            </View>

            {/* Owner Name */}
            <View style={s.fieldGroup}>
              <Label>Owner Name</Label>
              <InputRow
                icon={<User size={18} color={errors.ownerName ? '#F87171' : '#3D7A78'} strokeWidth={2} />}
                error={errors.ownerName}
              >
                <TextInput
                  style={[s.textInput, { fontFamily: FONT }]}
                  placeholder="Enter owner full name"
                  placeholderTextColor="#A0AEC0"
                  value={form.ownerName}
                  onChangeText={v => updateForm('ownerName', v)}
                  underlineColorAndroid="transparent"
                />
              </InputRow>
              <FieldError message={errors.ownerName} />
            </View>

            {/* Country */}
            <View style={s.fieldGroup}>
              <Label>Country</Label>
              <AppPicker
                placeholder="Select Country"
                value={form.country}
                options={countries}
                onSelect={handleCountrySelect}
                error={errors.country}
              />
              <FieldError message={errors.country} />
            </View>

            {/* State */}
            <View style={s.fieldGroup}>
              <Label>State / Province</Label>
              <AppPicker
                placeholder="Select State"
                value={form.state}
                options={states}
                onSelect={v => { updateForm('state', v); updateForm('city', ''); }}
                error={errors.state}
                disabled={!form.country}
              />
              <FieldError message={errors.state} />
            </View>

            {/* City */}
            <View style={s.fieldGroup}>
              <Label>City</Label>
              <AppPicker
                placeholder="Select City"
                value={form.city}
                options={cities}
                onSelect={v => updateForm('city', v)}
                error={errors.city}
                disabled={!form.state}
              />
              <FieldError message={errors.city} />
            </View>

            {/* Address */}
            <View style={s.fieldGroup}>
              <Label>Street Address</Label>
              <InputRow
                icon={<MapPin size={18} color={errors.address ? '#F87171' : '#3D7A78'} strokeWidth={2} />}
                error={errors.address}
              >
                <TextInput
                  style={[s.textInput, { fontFamily: FONT }]}
                  placeholder="Street address or block details"
                  placeholderTextColor="#A0AEC0"
                  value={form.address}
                  onChangeText={v => updateForm('address', v)}
                  underlineColorAndroid="transparent"
                />
              </InputRow>
              <FieldError message={errors.address} />
            </View>

            {/* Phone */}
            <View style={s.fieldGroup}>
              <Label>Phone Number</Label>
              <PhoneField
                defaultCountry={form.country || 'IN'}
                onChangeFormattedText={text => setFormattedPhone(text)}
                error={errors.phone}
              />
              <FieldError message={errors.phone} />
            </View>

            {/* Password */}
            <View style={s.fieldGroup}>
              <Label>Password</Label>
              <InputRow
                icon={<Lock size={18} color={errors.password ? '#F87171' : '#3D7A78'} strokeWidth={2} />}
                error={errors.password}
              >
                <TextInput
                  style={[s.textInput, { fontFamily: FONT }]}
                  placeholder="Min 6 characters"
                  placeholderTextColor="#A0AEC0"
                  secureTextEntry={!showPassword}
                  value={form.password}
                  onChangeText={v => updateForm('password', v)}
                  underlineColorAndroid="transparent"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(p => !p)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  {showPassword
                    ? <EyeOff size={18} color="#94A3B8" strokeWidth={2} />
                    : <Eye size={18} color="#94A3B8" strokeWidth={2} />}
                </TouchableOpacity>
              </InputRow>
              <FieldError message={errors.password} />
            </View>

            {/* Confirm Password */}
            <View style={s.fieldGroup}>
              <Label>Confirm Password</Label>
              <InputRow
                icon={<Lock size={18} color={errors.confirmPassword ? '#F87171' : '#3D7A78'} strokeWidth={2} />}
                error={errors.confirmPassword}
              >
                <TextInput
                  style={[s.textInput, { fontFamily: FONT }]}
                  placeholder="Repeat your password"
                  placeholderTextColor="#A0AEC0"
                  secureTextEntry={!showConfirmPassword}
                  value={form.confirmPassword}
                  onChangeText={v => updateForm('confirmPassword', v)}
                  underlineColorAndroid="transparent"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(p => !p)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  {showConfirmPassword
                    ? <EyeOff size={18} color="#94A3B8" strokeWidth={2} />
                    : <Eye size={18} color="#94A3B8" strokeWidth={2} />}
                </TouchableOpacity>
              </InputRow>
              <FieldError message={errors.confirmPassword} />
            </View>

            {/* Submit */}
            <TouchableOpacity
              onPress={handleRegister}
              activeOpacity={0.85}
              disabled={loading}
              style={[s.submitBtn, loading && { opacity: 0.7 }]}
            >
              <Text style={[s.submitBtnText, { fontFamily: FONT }]}>
                {loading ? 'Creating Account…' : 'Create Workshop'}
              </Text>
              {!loading && <ArrowRight size={18} color="#FFF" strokeWidth={2.5} />}
            </TouchableOpacity>

            {/* Sign in link */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}
              style={s.switchLink}
            >
              <Text style={[s.switchText, { fontFamily: FONT }]}>
                Already have an account?{' '}
                <Text style={s.switchTextBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>

          </View>

          {/* Footer */}
          <Text style={[s.footerText, { fontFamily: FONT }]}>
            By registering, you agree to our Terms of Service.
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  // Header
  header: {
    backgroundColor: '#0A2220',
    paddingHorizontal: 24,
    paddingBottom: 36,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 5,
    marginBottom: 24,
  },
  headerTag: {
    color: '#7AB4CC',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 30,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    lineHeight: 20,
  },
  // Card
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#0A2220',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 16,
  },

  // Field
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  inputError: {
    borderColor: '#F87171',
    backgroundColor: '#FEF2F2',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    height: '100%',
  },
  fieldError: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 5,
    marginLeft: 2,
  },

  // Submit
  submitBtn: {
    backgroundColor: '#3D7A78',
    borderRadius: 14,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // Switch
  switchLink: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  switchText: {
    fontSize: 13,
    color: '#64748B',
  },
  switchTextBold: {
    color: '#3D7A78',
    fontWeight: '700',
  },
  // Footer
  footerText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
    paddingHorizontal: 24,
    paddingBottom: 32,
    lineHeight: 18,
  },
});