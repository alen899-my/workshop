import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import InputField from '@/components/ui/InputField';
import PhoneInputWithCode from '@/components/ui/PhoneInputWithCode';
import ModalSheet from '@/components/ui/ModalSheet';
import { Spacing, UI, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useRBAC } from '@/hooks/use-rbac';
import { authService, getCurrentUser } from '@/services/auth.service';
import { DEFAULT_PHONE_COUNTRY, DEFAULT_CALLING_CODE, normalizeAuthPhone, validEmail } from '@/utils/auth-validation';

const IMG_H = 210;

export default function LoginScreen() {
  const theme = useTheme();
  const styles = useStyles(theme);
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState(DEFAULT_PHONE_COUNTRY);
  const [callingCode, setCallingCode] = useState(DEFAULT_CALLING_CODE);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const { registered } = useLocalSearchParams<{ registered?: string }>();
  const [submitError, setSubmitError] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const submitting = useRef(false);
  const resetting = useRef(false);
  const { refresh: refreshRBAC } = useRBAC();
  const [kbHeight, setKbHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKbHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKbHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const handleLogin = useCallback(async () => {
    if (submitting.current) return;
    const e: typeof errors = {};
    const normalizedPhone = normalizeAuthPhone(phone, countryCode);
    if (!normalizedPhone) e.phone = 'Enter a valid phone number for the selected country';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    setSubmitError('');
    if (Object.keys(e).length || !normalizedPhone) return;
    submitting.current = true;
    Keyboard.dismiss();
    setLoading(true);
    try {
      await authService.login(normalizedPhone, password);
      await refreshRBAC();
      if (!getCurrentUser()) throw new Error('Session expired. Please log in again.');
      router.replace('/(tabs)');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }, [phone, countryCode, password, refreshRBAC]);

  const handleReset = async () => {
    if (resetting.current) return;
    setResetError('');
    setResetMessage('');
    if (!validEmail(resetEmail)) { setResetError('Enter your account email address'); return; }
    resetting.current = true;
    setResetLoading(true);
    try {
      await authService.forgotPassword(resetEmail);
      setResetMessage('If an account uses that email, a password reset link will be sent. Check your inbox and spam folder.');
    } catch (error) {
      setResetError(error instanceof Error ? error.message : 'Please try again.');
    } finally {
      resetting.current = false;
      setResetLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.flex}>
        {/* Hero Image */}
        <View style={[styles.heroWrap, { height: IMG_H + insets.top }]}>
          <Image
            source={require('../../../assets/images/auth.jpg')}
            style={[styles.hero, { height: IMG_H + insets.top }]}
            contentFit="cover"
            accessibilityLabel="Workshop"
          />
          <LinearGradient colors={['transparent', theme.background]} style={styles.gradient} pointerEvents="none" />

          {/* Back Button */}
          <Pressable style={[styles.back, { top: insets.top + 8 }]} hitSlop={12} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
          </Pressable>
        </View>

        {/* Card */}
        <View style={[styles.card, { marginTop: -32, backgroundColor: theme.background }]}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[styles.scrollContent, kbHeight > 0 && { paddingBottom: kbHeight + 80 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            <View style={styles.content}>
              <Text style={[styles.screenTitle, { color: theme.text }]}>Welcome Back</Text>
              <Text style={[styles.screenSub, { color: theme.textSecondary }]}>
                Log in to manage your workshop
              </Text>

              <View style={styles.fields}>
                {registered === '1' && <Text accessibilityLiveRegion="polite" style={{ color: theme.success }}>Account created. Log in with your phone number and password.</Text>}
                {!!submitError && <Text accessibilityRole="alert" style={{ color: theme.error }}>{submitError}</Text>}
                <PhoneInputWithCode
                  countryCode={countryCode}
                  callingCode={callingCode}
                  valueFormat="national"
                  phone={phone}
                  onCountryChange={(c) => { setCountryCode(c.cca2); setCallingCode(c.callingCode); }}
                  onPhoneChange={(v) => { setPhone(v); setErrors((p) => ({ ...p, phone: undefined })); }}
                  error={errors.phone}
                />
                <InputField
                  label="Password"
                  value={password}
                  onChangeText={(v) => { setPassword(v); setErrors((p) => ({ ...p, password: undefined })); }}
                  placeholder="Enter your password"
                  type="password"
                  autoComplete="current-password"
                  error={errors.password}
                />
              </View>

              <Pressable style={styles.forgotWrap} accessibilityRole="button" onPress={() => { setResetOpen(true); setResetError(''); setResetMessage(''); }}>
                <Text style={[styles.forgotText, { color: theme.primary }]}>Forgot password?</Text>
              </Pressable>

              <Pressable
                style={[styles.btn, { backgroundColor: theme.accent, opacity: loading ? 0.6 : 1 }]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.accentForeground} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="login" size={20} color={theme.accentForeground} />
                    <Text style={[styles.btnText, { color: theme.accentForeground }]}>Log In</Text>
                  </>
                )}
              </Pressable>

              {/* Bottom */}
              <View style={styles.bottom}>
                <View style={styles.trustRow}>
                  <MaterialCommunityIcons name="shield-lock-outline" size={14} color={theme.textSecondary} />
                  <Text style={[styles.trustText, { color: theme.textSecondary }]}>
                    Your workshop, all in one place
                  </Text>
                </View>

                <Pressable style={styles.linkWrap} onPress={() => router.replace('/auth/signup')}>
                  <Text style={[styles.linkText, { color: theme.textSecondary }]}>
                    Don&apos;t have an account?{' '}
                    <Text style={{ color: theme.primary, fontWeight: '700' }}>Sign up</Text>
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
      <ModalSheet visible={resetOpen} title="Reset password" onClose={() => setResetOpen(false)}>
        <View style={{ padding: 24, gap: 16 }}>
          <Text style={{ color: theme.textSecondary }}>Enter the email address registered to your account.</Text>
          <InputField label="Email" value={resetEmail} onChangeText={setResetEmail} type="email" autoComplete="email" error={resetError} />
          {!!resetMessage && <Text accessibilityLiveRegion="polite" style={{ color: theme.success }}>{resetMessage}</Text>}
          <Pressable accessibilityRole="button" style={[styles.btn, { backgroundColor: theme.accent, opacity: resetLoading ? 0.6 : 1 }]} onPress={handleReset} disabled={resetLoading}>
            {resetLoading ? <ActivityIndicator color={theme.accentForeground} /> : <Text style={[styles.btnText, { color: theme.accentForeground }]}>Send reset link</Text>}
          </Pressable>
        </View>
      </ModalSheet>
    </KeyboardAvoidingView>
  );
}

const useStyles = (theme: ReturnType<typeof useTheme>) => {
  return useMemo(() => StyleSheet.create({
    flex: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    heroWrap: {
      height: IMG_H,
      position: 'relative',
    },
    hero: {
      width: '100%',
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
      backgroundColor: theme.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
      flex: 1,
      paddingHorizontal: Spacing.four,
      paddingTop: Spacing.three,
      borderTopLeftRadius: UI.sheetRadius,
      borderTopRightRadius: UI.sheetRadius,
    },
    content: {
      paddingTop: Spacing.three,
      width: '100%',
      maxWidth: MaxContentWidth,
      alignSelf: 'center',
    },
    screenTitle: {
      fontSize: 28,
      fontWeight: '400',
      marginBottom: 4,
    },
    screenSub: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: Spacing.four,
    },
    fields: {
      gap: 14,
    },
    forgotWrap: {
      alignSelf: 'flex-end',
      marginTop: Spacing.two,
    },
    forgotText: {
      fontSize: 13,
      fontWeight: '600',
    },
    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 52,
      borderRadius: UI.radius,
      gap: 8,
      marginTop: Spacing.three,
    },
    btnText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.primaryForeground,
    },
    bottom: {
      gap: 10,
      paddingTop: Spacing.three,
    },
    trustRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    trustText: {
      fontSize: 12,
      fontWeight: '500',
    },
    linkWrap: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    linkText: {
      fontSize: 13,
      fontWeight: '500',
    },
  }), [theme]);
}
