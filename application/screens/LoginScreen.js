import React, { useState } from 'react';
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
import { useAuth } from '../lib/auth';
import { Lock, Eye, EyeOff, ArrowRight, ChevronLeft } from 'lucide-react-native';
import { PhoneField } from '../components/ui/PhoneField';

const FONT = Platform.OS === 'ios' ? 'System' : 'sans-serif';

const loginSchema = z.object({
  phone: z.string().min(8, 'Enter a valid phone number'),
  password: z.string().min(6, 'Min 6 characters'),
});

// ─── Sub-components ──────────────────────────────────────────────────────────

function Label({ children }) {
  return (
    <Text style={[s.label, { fontFamily: FONT }]}>{children}</Text>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return <Text style={[s.fieldError, { fontFamily: FONT }]}>{message}</Text>;
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function LoginScreen({ navigation }) {
  const [formattedPhone, setFormattedPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { toast } = useToast();
  const { login } = useAuth();

  const handleLogin = async () => {
    const valid = loginSchema.safeParse({ phone: formattedPhone || phone, password });
    if (!valid.success) {
      const errs = {};
      valid.error.issues.forEach(i => (errs[i.path[0]] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone || phone, password }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        toast({ type: 'error', title: 'Login Failed', description: data.error || 'Invalid phone or password.' });
        setLoading(false);
        return;
      }
      await login(data.token, data.data);
      setLoading(false);
      toast({ type: 'success', title: 'Welcome Back!', description: 'Connecting successfully...' });
    } catch (err) {
      setLoading(false);
      toast({ type: 'error', title: 'Network Error', description: 'Could not connect to the server.' });
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
          {/* ── Dark Header ─────────────────────────────────────────────── */}
          <View style={[s.header, { paddingTop: Platform.OS === 'android' ? 52 : 60 }]}>
            {/* Back button */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Landing')}
              activeOpacity={0.7}
              style={s.backBtn}
            >
              <ChevronLeft size={20} color="rgba(255,255,255,0.7)" strokeWidth={2} />
            </TouchableOpacity>

            {/* Logo */}
            <Text style={[s.logoText, { fontFamily: FONT }]}>
              VEH<Text style={{ color: '#7AB4CC' }}>REP</Text>
            </Text>

            <Text style={[s.headerTag, { fontFamily: FONT }]}>WELCOME BACK</Text>
            <Text style={[s.headerTitle, { fontFamily: FONT }]}>Sign In</Text>
            <Text style={[s.headerSub, { fontFamily: FONT }]}>Access your workshop dashboard</Text>
          </View>

          {/* ── Form Card ───────────────────────────────────────────────── */}
          <View style={s.card}>

            {/* Phone Number */}
            <View style={s.fieldGroup}>
              <Label>Phone Number</Label>
              <PhoneField
                defaultCountry="IN"
                onChangeFormattedText={text => setFormattedPhone(text)}
                error={errors.phone}
              />
              <FieldError message={errors.phone} />
            </View>

            {/* Password */}
            <View style={s.fieldGroup}>
              <View style={s.labelRow}>
                <Label>Password</Label>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={[s.forgotText, { fontFamily: FONT }]}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <View style={[s.inputRow, errors.password && s.inputError]}>
                <Lock size={18} color={errors.password ? '#F87171' : '#94A3B8'} strokeWidth={2} />
                <TextInput
                  style={[s.textInput, { fontFamily: FONT }]}
                  placeholder="Enter your password"
                  placeholderTextColor="#A0AEC0"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
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
              </View>
              <FieldError message={errors.password} />
            </View>

            {/* Submit */}
            <TouchableOpacity
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading}
              style={[s.submitBtn, loading && { opacity: 0.7 }]}
            >
              <Text style={[s.submitBtnText, { fontFamily: FONT }]}>
                {loading ? 'Signing In…' : 'Sign In'}
              </Text>
              {!loading && <ArrowRight size={18} color="#FFF" strokeWidth={2.5} />}
            </TouchableOpacity>

            {/* Register link */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.7}
              style={s.switchLink}
            >
              <Text style={[s.switchText, { fontFamily: FONT }]}>
                Don't have an account?{' '}
                <Text style={s.switchTextBold}>Register here</Text>
              </Text>
            </TouchableOpacity>

          </View>
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
    fontSize: 32,
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
    marginBottom: 32,
  },
  // Field
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3D7A78',
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
    fontSize: 15,
    color: '#1E293B',
    marginHorizontal: 10,
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
    marginTop: 4,
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
});