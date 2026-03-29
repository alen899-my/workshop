import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/Colors';
import { z } from 'zod';
import { useToast } from '../components/ui/WorkshopToast';
import { API_URL } from '../api';
import { WorkshopButton } from '../components/ui/WorkshopButton';
import { User, Phone, Lock, Eye, EyeOff, MapPin, Warehouse, ArrowRight } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');
const FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';
const theme = Colors.light;

const registerSchema = z.object({
  shopName: z.string().min(1, 'Shop name required'),
  ownerName: z.string().min(1, 'Owner name required'),
  location: z.string().min(1, 'Location required'),
  phone: z.string().min(1, 'Phone required').transform(v => v.replace(/[\s\-+]/g, '')).pipe(z.string().regex(/^\d{7,15}$/, 'Invalid phone')),
  password: z.string().min(6, 'Min 6 characters'),
  confirmPassword: z.string().min(1, 'Required'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({ shopName: '', ownerName: '', location: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { toast } = useToast();

  function updateForm(key, value) {
    setForm(f => ({ ...f, [key]: value }));
  }

  const handleRegister = async () => {
    const valid = registerSchema.safeParse(form);
    if (!valid.success) {
      const errs = {};
      valid.error.issues.forEach(i => (errs[i.path[0]] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      const { shopName, ownerName, location, phone, password } = form;
      const response = await fetch(`${API_URL}/auth/register-shop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopName, ownerName, location, phone, password }),
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Decorative Top Area */}
      <View style={styles.topShapeArea}>
        <Image 
          source={require('../assets/authpageimage1.jpg')}
          style={styles.bgImage}
          blurRadius={3}
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
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.navigate('Landing')} activeOpacity={0.7}>
              <Text style={styles.logoText}>
                VEH<Text style={{ color: '#63B3ED' }}>REP</Text>
              </Text>
            </TouchableOpacity>
            <Text style={styles.headerGreeting}>Register Workshop</Text>
            <Text style={styles.headerSubtitle}>Set up your digital workplace</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <View style={styles.inputSection}>
              {/* Shop Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>SHOP NAME</Text>
                <View style={[styles.inputWrapper, errors.shopName && styles.inputError]}>
                  <Warehouse size={20} color={errors.shopName ? '#E53E3E' : theme.primary} strokeWidth={2} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Speed Auto Works"
                    placeholderTextColor="#A0AEC0"
                    value={form.shopName}
                    onChangeText={v => updateForm('shopName', v)}
                    underlineColorAndroid="transparent"
                  />
                </View>
                {errors.shopName && <Text style={styles.errorLabel}>{errors.shopName}</Text>}
              </View>

              {/* Owner Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>OWNER NAME</Text>
                <View style={[styles.inputWrapper, errors.ownerName && styles.inputError]}>
                  <User size={20} color={errors.ownerName ? '#E53E3E' : theme.primary} strokeWidth={2} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter owner name"
                    placeholderTextColor="#A0AEC0"
                    value={form.ownerName}
                    onChangeText={v => updateForm('ownerName', v)}
                    underlineColorAndroid="transparent"
                  />
                </View>
                {errors.ownerName && <Text style={styles.errorLabel}>{errors.ownerName}</Text>}
              </View>

              {/* Location */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>LOCATION</Text>
                <View style={[styles.inputWrapper, errors.location && styles.inputError]}>
                  <MapPin size={20} color={errors.location ? '#E53E3E' : theme.primary} strokeWidth={2} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Kochi, Kerala"
                    placeholderTextColor="#A0AEC0"
                    value={form.location}
                    onChangeText={v => updateForm('location', v)}
                    underlineColorAndroid="transparent"
                  />
                </View>
                {errors.location && <Text style={styles.errorLabel}>{errors.location}</Text>}
              </View>

              {/* Phone */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>PHONE NUMBER</Text>
                <View style={[styles.inputWrapper, errors.phone && styles.inputError]}>
                  <Phone size={20} color={errors.phone ? '#E53E3E' : theme.primary} strokeWidth={2} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="09876543210"
                    placeholderTextColor="#A0AEC0"
                    keyboardType="phone-pad"
                    value={form.phone}
                    onChangeText={v => updateForm('phone', v)}
                    underlineColorAndroid="transparent"
                  />
                </View>
                {errors.phone && <Text style={styles.errorLabel}>{errors.phone}</Text>}
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>PASSWORD</Text>
                <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                  <Lock size={20} color={errors.password ? '#E53E3E' : theme.primary} strokeWidth={2} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Min 6 characters"
                    placeholderTextColor="#A0AEC0"
                    secureTextEntry={!showPassword}
                    value={form.password}
                    onChangeText={v => updateForm('password', v)}
                    underlineColorAndroid="transparent"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    {showPassword ? <EyeOff size={20} color="#718096" /> : <Eye size={20} color="#718096" />}
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorLabel}>{errors.password}</Text>}
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CONFIRM PASSWORD</Text>
                <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
                  <Lock size={20} color={errors.confirmPassword ? '#E53E3E' : theme.primary} strokeWidth={2} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Repeat password"
                    placeholderTextColor="#A0AEC0"
                    secureTextEntry={!showPassword}
                    value={form.confirmPassword}
                    onChangeText={v => updateForm('confirmPassword', v)}
                    underlineColorAndroid="transparent"
                  />
                </View>
                {errors.confirmPassword && <Text style={styles.errorLabel}>{errors.confirmPassword}</Text>}
              </View>

              <WorkshopButton
                variant="primary"
                size="lg"
                loading={loading}
                onPress={handleRegister}
                fullWidth={true}
                icon={<ArrowRight size={20} color="#FFF" strokeWidth={2.5} />}
                iconPosition="right"
                style={{ marginTop: 10 }}
              >
                CREATE WORKSHOP
              </WorkshopButton>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.bottomDecoration}>
            <View style={styles.diamond} />
            <Text style={styles.termsText}>
              By registering, you agree to the Terms of Service.
            </Text>
            <View style={styles.diamond} />
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
    height: height * 0.35,
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
    backgroundColor: 'rgba(22, 60, 99, 0.82)',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    height: height * 0.28,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  logoText: {
    fontFamily: FONT,
    fontWeight: '900',
    fontSize: 24,
    letterSpacing: 4,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerGreeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: FONT,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: FONT,
    marginTop: 2,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    marginTop: -20,
  },
  inputSection: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 10,
    fontFamily: FONT,
    fontWeight: '900',
    color: theme.foreground,
    letterSpacing: 1,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    backgroundColor: '#F3F4F6', // Border removed, background visible
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: theme.foreground,
    fontFamily: FONT,
    fontSize: 14,
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
    fontSize: 11,
    color: '#E53E3E',
    fontFamily: FONT,
    marginTop: 1,
    marginLeft: 4,
  },
  footer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    fontFamily: FONT,
    color: '#718096',
  },
  footerLink: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.primary,
    fontFamily: FONT,
  },
  bottomDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 10,
  },
  diamond: {
    width: 6,
    height: 6,
    backgroundColor: '#CBD5E0',
    transform: [{ rotate: '45deg' }],
  },
  termsText: {
    fontSize: 10,
    color: '#A0AEC0',
    fontFamily: FONT,
    textAlign: 'center',
  },
});

