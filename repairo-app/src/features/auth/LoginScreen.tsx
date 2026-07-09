import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import InputField from '@/components/ui/InputField';
import PhoneInputWithCode from '@/components/ui/PhoneInputWithCode';
import Toast from '@/components/ui/Toast';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useRBAC } from '@/hooks/use-rbac';
import { authService } from '@/services/auth.service';

const { width } = Dimensions.get('window');
const IMG_H = 210;

export default function LoginScreen() {
  const theme = useTheme();
  const styles = useStyles(theme);
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [callingCode, setCallingCode] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const { refresh: refreshRBAC } = useRBAC();
  const [kbHeight, setKbHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKbHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKbHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const handleLogin = useCallback(async () => {
    const e: typeof errors = {};
    if (phone.length < 5) e.phone = 'Valid phone number required';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    if (Object.keys(e).length) return;

    Keyboard.dismiss();
    setLoading(true);
    try {
      await authService.login(`${callingCode}${phone}`, password);
      await refreshRBAC();
      setToast({ visible: true, message: 'Welcome back! Logged in successfully' });
      setTimeout(() => router.replace('/(tabs)'), 1200);
    } catch (err: any) {
      setErrors({ phone: err?.message || 'Login failed' });
    } finally {
      setLoading(false);
    }
  }, [phone, password, refreshRBAC]);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.flex}>
        {/* Hero Image */}
        <View style={styles.heroWrap}>
          <Image source={require('@/assets/images/auth.jpg')} style={styles.hero} resizeMode="cover" />
          <LinearGradient colors={['transparent', theme.background]} style={styles.gradient} pointerEvents="none" />

          {/* Back Button */}
          <Pressable style={[styles.back, { top: insets.top + 8 }]} hitSlop={12} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.primaryForeground} />
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
              <Text style={[styles.screenTitle, { color: theme.dark }]}>Welcome Back</Text>
              <Text style={[styles.screenSub, { color: theme.textSecondary }]}>
                Log in to manage your workshop
              </Text>

              <View style={styles.fields}>
                <PhoneInputWithCode
                  countryCode={countryCode}
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
                  error={errors.password}
                />
              </View>

              <Pressable style={styles.forgotWrap}>
                <Text style={[styles.forgotText, { color: theme.primary }]}>Forgot password?</Text>
              </Pressable>

              <Pressable
                style={[styles.btn, { backgroundColor: theme.primary, opacity: loading ? 0.6 : 1 }]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.primaryForeground} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="login" size={20} color={theme.primaryForeground} />
                    <Text style={[styles.btnText, { color: theme.primaryForeground }]}>Log In</Text>
                  </>
                )}
              </Pressable>

              {/* Bottom */}
              <View style={styles.bottom}>
                <View style={styles.trustRow}>
                  <MaterialCommunityIcons name="shield-lock-outline" size={14} color={theme.textSecondary} />
                  <Text style={[styles.trustText, { color: theme.textSecondary }]}>
                    Secured with end-to-end encryption
                  </Text>
                </View>

                <Pressable style={styles.linkWrap} onPress={() => router.replace('/auth/signup')}>
                  <Text style={[styles.linkText, { color: theme.textSecondary }]}>
                    Don't have an account?{' '}
                    <Text style={{ color: theme.primary, fontWeight: '700' }}>Sign up</Text>
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type="success"
        onHide={() => setToast({ visible: false, message: '' })}
      />
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
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
    },
    content: {
      paddingTop: Spacing.three,
    },
    screenTitle: {
      fontSize: 24,
      fontWeight: '800',
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
      borderRadius: 14,
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
