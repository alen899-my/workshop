import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StatusBar,
  Image,
  useWindowDimensions,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { z } from 'zod';
import { useToast } from '../components/ui/WorkshopToast';
import { API_URL } from '../api';
import { useAuth } from '../lib/auth';
import { Phone, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import { WorkshopButton } from '../components/ui/WorkshopButton';

const FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';
const theme = Colors.light;

const loginSchema = z.object({
  phone: z.string().min(1, 'Phone is required').transform(v => v.replace(/[\s\-+]/g, '')).pipe(z.string().regex(/^\d{7,15}$/, 'Invalid phone')),
  password: z.string().min(6, 'Min 6 characters'),
});

export default function LoginScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { toast } = useToast();
  const { login } = useAuth();

  // Responsive calculations
  const isSmallScreen = height < 700;
  const headerHeight = height * (isSmallScreen ? 0.32 : 0.4);
  const cardOverlap = isSmallScreen ? -40 : -50;

  const handleLogin = async () => {
    const valid = loginSchema.safeParse({ phone, password });
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
        body: JSON.stringify({ phone, password }),
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
      console.error(err);
      setLoading(false);
      toast({ type: 'error', title: 'Network Error', description: 'Could not connect to the backend server.' });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Decorative Top Area */}
      <View style={[styles.topShapeArea, { height: headerHeight + 60 }]}>
        <Image 
          source={require('../assets/authpageimage1.jpg')}
          style={styles.bgImage}
          blurRadius={2}
        />
        <View style={styles.overlay} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={[styles.header, { height: headerHeight }]}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Landing')}
              activeOpacity={0.7}
            >
              <Text style={styles.logoText}>
                VEH<Text style={{ color: '#63B3ED' }}>REP</Text>
              </Text>
            </TouchableOpacity>
            <Text style={[styles.headerGreeting, { fontSize: isSmallScreen ? 28 : 32 }]}>Welcome Back</Text>
           
          </View>

          {/* Form Card */}
          <View style={[styles.formCard, { marginTop: cardOverlap }]}>
            <View style={styles.inputSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>PHONE NUMBER</Text>
                <View style={[styles.inputWrapper, errors.phone && styles.inputError]}>
                  <Phone size={18} color={errors.phone ? '#E53E3E' : theme.primary} strokeWidth={2} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter phone number"
                    placeholderTextColor="#A0AEC0"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    autoCapitalize="none"
                    underlineColorAndroid="transparent"
                  />
                </View>
                {errors.phone && <Text style={styles.errorLabel}>{errors.phone}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>PASSWORD</Text>
                  <TouchableOpacity activeOpacity={0.7}>
                    <Text style={styles.forgotText}>FORGOT?</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                  <Lock size={18} color={errors.password ? '#E53E3E' : theme.primary} strokeWidth={2} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password"
                    placeholderTextColor="#A0AEC0"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    underlineColorAndroid="transparent"
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="#718096" strokeWidth={2} />
                    ) : (
                      <Eye size={18} color="#718096" strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorLabel}>{errors.password}</Text>}
              </View>

              <WorkshopButton
                variant="primary"
                size="xl"
                loading={loading}
                onPress={handleLogin}
                fullWidth={true}
                icon={<ArrowRight size={20} color="#FFF" strokeWidth={2.5} />}
                iconPosition="right"
                style={{ marginTop: 10 }}
              >
                SIGN IN
              </WorkshopButton>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>New here?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.footerLink}>Register Your Shop</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.bottomDecoration}>
            <View style={styles.diamond} />
            <View style={styles.diamondLine} />
            <View style={styles.diamond} />
          </View>

          <View style={styles.bottomImageContainer}>
            <Image 
              source={require('../assets/authpageimage1.jpg')}
              style={styles.bottomImage}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topShapeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  bgImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(22, 60, 99, 0.85)',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  logoText: {
    fontFamily: FONT,
    fontWeight: '900',
    fontSize: 28,
    letterSpacing: 6,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  headerGreeting: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: FONT,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: FONT,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 30,
    elevation: 8,
    ...Platform.select({
      web: { boxShadow: '0 10px 20px rgba(0,0,0,0.1)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      }
    }),
  },
  inputSection: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontFamily: FONT,
    fontWeight: '900',
    color: theme.foreground,
    letterSpacing: 1.2,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: theme.foreground,
    fontFamily: FONT,
    fontSize: 12,
    height: '100%',
    outlineWidth: 0,
    outlineStyle: 'none',
  },
  eyeIcon: {
    marginLeft: 10,
  },
  inputError: {
    backgroundColor: '#FFF5F5',
  },
  errorLabel: {
    fontSize: 12,
    color: '#E53E3E',
    fontFamily: FONT,
    marginTop: 2,
    marginLeft: 4,
  },
  forgotText: {
    fontSize: 11,
    fontFamily: FONT,
    fontWeight: 'bold',
    color: theme.primary,
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    fontFamily: FONT,
    color: '#718096',
  },
  footerLink: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.primary,
    fontFamily: FONT,
  },
  bottomDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    gap: 12,
  },
  diamond: {
    width: 6,
    height: 6,
    backgroundColor: '#CBD5E0',
    transform: [{ rotate: '45deg' }],
  },
  diamondLine: {
    width: 40,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  bottomImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    alignSelf: 'center',
    marginTop: 30,
    opacity: 0.3,
    borderWidth: 2,
    borderColor: '#CBD5E0',
  },
  bottomImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});