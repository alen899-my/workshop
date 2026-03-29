import React from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  ImageBackground,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { WorkshopButton } from '../components/ui/WorkshopButton';
import { ArrowRight } from 'lucide-react-native';

const FONT = Platform.OS === 'ios' ? 'System' : 'sans-serif';
const theme = Colors.light;

export default function LandingScreen({ navigation }) {
  const { width, height } = useWindowDimensions();

  // Responsive values
  const isSmallScreen = height < 700;
  const logoSize = isSmallScreen ? 14 : 16;
  const titleSize = width < 360 ? 32 : (isSmallScreen ? 36 : 42);
  const subtitleSize = isSmallScreen ? 13 : 14;

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Hero Section */}
        <View style={[styles.heroContainer, { height: height * 0.62 }]}>
          <ImageBackground
            source={require('../assets/workshopmobile-screen.jpg')}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          >
            <View style={styles.imageOverlay} />
            
            <SafeAreaView style={styles.safeTop}>
              {/* Logo */}
              <View style={styles.topBar}>
                <Text style={[styles.logo, { fontSize: logoSize }]}>
                  VEH<Text style={{ color: theme.accent }}>REP</Text>
                </Text>
              </View>

              {/* Centralized Headline */}
              <View style={styles.heroContent}>
                <Text style={styles.eyebrow}>
                  Workshop Management
                </Text>
                
                <Text style={[styles.title, { fontSize: titleSize, lineHeight: titleSize * 1.2 }]}>
                  Your Shop.{'\n'}
                  <Text style={{ color: theme.accent }}>Under Control.</Text>
                </Text>
                
                <Text style={[styles.subtitle, { fontSize: subtitleSize }]}>
                  Track every vehicle, repair, and technician from arrival to departure.
                </Text>
              </View>
            </SafeAreaView>
          </ImageBackground>
        </View>

        {/* Bottom Action Section */}
        <View style={styles.bottomContainer}>
          <View style={styles.contentWrap}>
            <View style={styles.dragHandle} />
            
            <View style={styles.textContainer}>
              <Text style={styles.sheetTitle}>Get Started</Text>
              <Text style={styles.sheetSubtitle}>
                Join the platform built exclusively for professional auto repair workshops.
              </Text>
            </View>

            <View style={styles.actions}>
              <WorkshopButton
                variant="primary"
                size="xl"
                onPress={() => navigation?.navigate('Register')}
                fullWidth={true}
                icon={<ArrowRight size={20} color="#FFF" />}
                iconPosition="right"
                style={styles.mainButton}
              >
                Create Free Account
              </WorkshopButton>

              <TouchableOpacity 
                onPress={() => navigation?.navigate('Login')}
                style={styles.loginLink}
                activeOpacity={0.6}
              >
                <Text style={styles.loginText}>
                  Already have an account? <Text style={styles.loginHighlight}>Log in</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  heroContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)', 
  },
  safeTop: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    alignItems: 'flex-start',
  },
  logo: {
    color: '#FFF',
    fontWeight: '900',
    letterSpacing: 4,
    fontFamily: FONT,
  },
  heroContent: {
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  eyebrow: {
    color: theme.accent,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 10,
    fontFamily: FONT,
  },
  title: {
    color: '#FFF',
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 12,
    fontFamily: FONT,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
    fontFamily: FONT,
    paddingRight: 10,
  },

  // Bottom Content Area
  bottomContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: -30, // Negative margin to overlap with hero
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    paddingBottom: Platform.OS === 'ios' ? 40 : 30, 
  },
  contentWrap: {
    paddingHorizontal: 30,
    paddingTop: 16,
    flex: 1,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 32,
  },
  textContainer: {
    marginBottom: 32,
  },
  sheetTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.foreground,
    marginBottom: 8,
    fontFamily: FONT,
    letterSpacing: -0.8,
  },
  sheetSubtitle: {
    fontSize: 15,
    color: '#64748B',
    fontFamily: FONT,
    lineHeight: 24,
  },
  actions: {
    gap: 20,
    width: '100%',
    alignItems: 'center',
  },
  mainButton: {
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderRadius: 16,
  },
  loginLink: {
    paddingVertical: 8,
    width: '100%',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 12,
    fontFamily: FONT,
    color: '#64748B',
  },
  loginHighlight: {
    color: theme.primary,
    fontWeight: 'bold',
  }
});