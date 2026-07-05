import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import CountryPicker from '@/components/ui/CountryPicker';
import InputField from '@/components/ui/InputField';
import LocationPicker from '@/components/ui/LocationPicker';
import PhoneInputWithCode from '@/components/ui/PhoneInputWithCode';
import RegistrationSuccess from '@/components/ui/RegistrationSuccess';
import { Spacing, Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { authService } from '@/services/auth.service';

const { width } = Dimensions.get('window');
const IMG_H = 210;

const STEPS = [
  { key: 'shop', title: 'Shop Details', subtitle: 'Tell us about your workshop' },
  { key: 'owner', title: 'Owner Details', subtitle: 'Who runs the business' },
  { key: 'security', title: 'Security', subtitle: 'Set your credentials' },
] as const;

interface FormData {
  shopName: string;
  location: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  country: string;
  currency: string;
  ownerName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type Errors = Partial<Record<keyof FormData, string>>;

export default function SignupScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    shopName: '',
    location: '',
    phone: '',
    country: '',
    currency: 'USD',
    ownerName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [callingCode, setCallingCode] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [agree, setAgree] = useState(false);
  const [success, setSuccess] = useState(false);
  const [kbHeight, setKbHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKbHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKbHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const update = useCallback(<K extends keyof FormData>(key: K, val: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  const validateStep = useCallback(
    (s: number): boolean => {
      const e: Errors = {};
      if (s === 0) {
        if (!form.shopName.trim()) e.shopName = 'Shop name is required';
        if (!form.location.trim()) e.location = 'Location is required';
        if (form.phone.length < 7) e.phone = 'Valid phone number required';
        if (!form.country) e.country = 'Select your country';
      } else if (s === 1) {
        if (!form.ownerName.trim()) e.ownerName = 'Owner name is required';
        if (!form.email.includes('@')) e.email = 'Valid email required';
      } else if (s === 2) {
        if (form.password.length < 6) e.password = 'At least 6 characters';
        if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
      }
      setErrors(e);
      return Object.keys(e).length === 0;
    },
    [form],
  );

  const nextStep = useCallback(() => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 2));
  }, [step, validateStep]);

  const prevStep = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
    setErrors({});
  }, []);

  const handleRegister = useCallback(async () => {
    if (!validateStep(2)) return;
    if (!agree) return;
    Keyboard.dismiss();
    setLoading(true);
    try {
      await authService.register({
        shopName: form.shopName,
        location: form.location,
        phone: `${callingCode}${form.phone}`,
        ownerName: form.ownerName,
        country: form.country,
        currency: form.currency,
        email: form.email,
        password: form.password,
        callingCode,   // persisted so CreateRepairScreen pre-fills phone/WhatsApp calling code
      });
      setSuccess(true);
    } catch (err: any) {
      setErrors({ shopName: err?.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  }, [form, agree, validateStep]);

  if (success) {
    return <RegistrationSuccess onLogin={() => router.replace('/auth/login')} />;
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 44 : 0}
      >
        {/* Hero Image */}
        <View style={styles.heroWrap}>
          <Image source={require('@/assets/images/auth.jpg')} style={styles.hero} resizeMode="cover" />
          <LinearGradient colors={['transparent', theme.background]} style={styles.gradient} pointerEvents="none" />

          {/* Back Button */}
          <Pressable style={[styles.back, { top: insets.top + 8 }]} hitSlop={12} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textInverse} />
          </Pressable>
        </View>

        {/* Card */}
        <View style={[styles.card, { marginTop: -32, backgroundColor: theme.background, borderTopLeftRadius: 32, borderTopRightRadius: 32 }]}>
          {/* Step Content */}
          <View style={styles.content}>
            <ScrollView
              ref={scrollRef}
              style={styles.scrollArea}
              contentContainerStyle={[styles.scrollContent, kbHeight > 0 && { paddingBottom: kbHeight + 80 }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              {/* Step Indicator */}
              <View style={styles.stepsWrap}>
                <View style={styles.stepsRow}>
                  {STEPS.map((s, i) => (
                    <View key={s.key} style={styles.stepColumn}>
                      <View
                        style={[
                          styles.stepDot,
                          { backgroundColor: i <= step ? theme.primary : 'transparent', borderColor: i <= step ? theme.primary : theme.border },
                        ]}
                      >
                        <Text style={[styles.stepDotText, { color: i <= step ? Colors.textInverse : theme.tabIconDefault }]}>{i + 1}</Text>
                      </View>
                      {i < STEPS.length - 1 && (
                        <View style={[styles.stepLine, { backgroundColor: i < step ? theme.primary : theme.border }]} />
                      )}
                    </View>
                  ))}
                </View>
                <View style={styles.stepsLabels}>
                  {STEPS.map((s, i) => (
                    <Text key={s.key} style={[styles.stepLabel, { color: i <= step ? Colors.textInverse : theme.tabIconDefault, fontWeight: i <= step ? '700' : '500' }]} numberOfLines={1}>{s.title}</Text>
                  ))}
                </View>
              </View>

              <Text style={[styles.screenTitle, { color: theme.dark }]}>{STEPS[step].title}</Text>
              <Text style={[styles.screenSub, { color: theme.textSecondary }]}>{STEPS[step].subtitle}</Text>

              {/* Step 1 – Shop Details */}
              {step === 0 && (
                <View style={styles.fields}>
                  <InputField
                    label="Shop Name"
                    value={form.shopName}
                    onChangeText={(v) => update('shopName', v)}
                    placeholder="e.g. Mike's Auto Repair"
                    type="text"
                    icon="store-outline"
                    error={errors.shopName}
                    autoCapitalize="words"
                  />
                  <LocationPicker
                    label="Location"
                    value={form.location}
                    onChangeText={(v) => update('location', v)}
                    onCoordinatesChange={(lat, lng) => {
                      update('latitude', lat);
                      update('longitude', lng);
                    }}
                    placeholder="e.g. Bangalore, India"
                    error={errors.location}
                  />
                  <PhoneInputWithCode
                    countryCode={form.country}
                    phone={form.phone}
                    onCountryChange={(c) => { update('country', c.cca2); update('currency', c.currency); setCallingCode(c.callingCode); }}
                    onPhoneChange={(v) => update('phone', v)}
                    error={errors.phone}
                  />
                  <CountryPicker
                    value={form.country}
                    onChange={(c) => { update('country', c.cca2); update('currency', c.currency); }}
                    error={errors.country}
                  />
                </View>
              )}

              {/* Step 2 – Owner Details */}
              {step === 1 && (
                <View style={styles.fields}>
                  <InputField
                    label="Owner Name"
                    value={form.ownerName}
                    onChangeText={(v) => update('ownerName', v)}
                    placeholder="e.g. John Smith"
                    type="text"
                    icon="account-outline"
                    error={errors.ownerName}
                    autoCapitalize="words"
                  />
                  <InputField
                    label="Email Address"
                    value={form.email}
                    onChangeText={(v) => update('email', v)}
                    placeholder="e.g. john@example.com"
                    type="email"
                    error={errors.email}
                    keyboardType="email-address"
                  />
                </View>
              )}

              {/* Step 3 – Security */}
              {step === 2 && (
                <View style={styles.fields}>
                  <InputField
                    label="Create Password"
                    value={form.password}
                    onChangeText={(v) => update('password', v)}
                    placeholder="At least 6 characters"
                    type="password"
                    error={errors.password}
                  />
                  <InputField
                    label="Confirm Password"
                    value={form.confirmPassword}
                    onChangeText={(v) => update('confirmPassword', v)}
                    placeholder="Re-enter password"
                    type="password"
                    icon="lock-check-outline"
                    error={errors.confirmPassword}
                  />
                </View>
              )}
            </ScrollView>
          </View>

          {/* Bottom Actions — fixed at bottom */}
          <View style={[styles.bottom, { paddingBottom: insets.bottom + 4 }]}>
            {/* Agree checkbox – last step */}
            {step === 2 && (
              <Pressable style={styles.agreeRow} onPress={() => setAgree(!agree)}>
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: agree ? theme.primary : theme.border, backgroundColor: agree ? theme.primary : 'transparent' },
                  ]}
                >
                  {agree && <MaterialCommunityIcons name="check" size={14} color={Colors.textInverse} />}
                </View>
                <Text style={[styles.agreeText, { color: theme.text }]}>
                  I agree to the{' '}
                  <Text style={{ color: theme.dark, fontWeight: '700' }}>Terms of Service</Text> and{' '}
                  <Text style={{ color: theme.dark, fontWeight: '700' }}>Privacy Policy</Text>
                </Text>
              </Pressable>
            )}

            {step > 0 && step < 2 && (
              <View style={styles.bottomRow}>
                <Pressable style={[styles.btnHalf, { backgroundColor: Colors.text }]} onPress={prevStep}>
                  <MaterialCommunityIcons name="arrow-left" size={18} color={Colors.textInverse} />
                  <Text style={[styles.btnText, { color: Colors.textInverse }]}>Back</Text>
                </Pressable>
                <Pressable style={[styles.btnHalf, { backgroundColor: theme.primary }]} onPress={nextStep}>
                  <Text style={[styles.btnText, { color: Colors.textInverse }]}>Continue</Text>
                  <MaterialCommunityIcons name="arrow-right" size={18} color={Colors.textInverse} />
                </Pressable>
              </View>
            )}

            {step === 0 && (
              <Pressable style={[styles.btn, { backgroundColor: theme.primary }]} onPress={nextStep}>
                <Text style={[styles.btnText, { color: Colors.textInverse }]}>Continue</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color={Colors.textInverse} />
              </Pressable>
            )}

            {step === 2 && (
              <View style={styles.bottomRow}>
                <Pressable style={[styles.btnHalf, { backgroundColor: Colors.text }]} onPress={prevStep}>
                  <MaterialCommunityIcons name="arrow-left" size={18} color={Colors.textInverse} />
                  <Text style={[styles.btnText, { color: Colors.textInverse }]}>Back</Text>
                </Pressable>
                <Pressable
                  style={[styles.btnHalf, { backgroundColor: theme.primary, opacity: loading || !agree ? 0.6 : 1 }]}
                  onPress={handleRegister}
                  disabled={loading || !agree}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.textInverse} />
                  ) : (
                    <Text style={[styles.btnText, { color: Colors.textInverse }]}>Create Account</Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* Login Link */}
            <Pressable style={styles.linkWrap} onPress={() => router.replace('/auth/login')}>
              <Text style={[styles.linkText, { color: theme.textSecondary }]}>
                Already have an account?{' '}
                <Text style={{ color: theme.primary, fontWeight: '700' }}>Log in</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  heroWrap: {
    height: IMG_H,
    position: 'relative',
  },
  hero: {
    width,
    height: IMG_H,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  back: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  // ––– Steps Indicator –––
  stepsWrap: {
    marginBottom: Spacing.three,
    gap: 4,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotText: {
    fontSize: 11,
    fontWeight: '800',
  },
  stepLine: {
    height: 2,
    borderRadius: 1,
    marginLeft: 6,
    flex: 1,
  },
  stepsLabels: {
    flexDirection: 'row',
  },
  stepLabel: {
    flex: 1,
    fontSize: 10,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  // ––– Content –––
  content: {
    flex: 1,
    paddingTop: Spacing.one,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  screenSub: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.three,
  },

  fields: {
    gap: 14,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.three,
    justifyContent: 'center',
  },
  trustText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // ––– Bottom –––
  bottom: {
    gap: 6,
    paddingTop: Spacing.two,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  btnHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    gap: 8,
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agreeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    gap: 8,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  linkWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
