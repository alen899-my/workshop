import React, { useEffect, useRef } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  ImageBackground,
  Dimensions,
  SafeAreaView,
  Platform,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { WorkshopButton } from '../components/ui/WorkshopButton';

const { width, height } = Dimensions.get('window');
const FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';
const theme = Colors.light;

export default function LandingScreen({ navigation }) {
  const anims = useRef([...Array(3)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      150,
      anims.map((a) =>
        Animated.timing(a, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        })
      )
    ).start();
  }, []);

  const slideUp = (i) => ({
    opacity: anims[i],
    transform: [
      {
        translateY: anims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [40, 0],
        }),
      },
    ],
  });

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Hero Image taking the top portion of the screen */}
      <ImageBackground
        source={require('../assets/workshopmobile-screen.jpg')}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.imageOverlay} />
        
        <SafeAreaView style={styles.safeTop}>
          {/* Logo gracefully positioned at the top */}
          <Animated.View style={[styles.topBar, slideUp(0)]}>
            <Text style={styles.logo}>
              VEH<Text style={{ color: theme.accent }}>REP</Text>
            </Text>
          </Animated.View>

          {/* Centralized Headline within the image area */}
          <View style={styles.heroContent}>
            <Animated.Text style={[styles.eyebrow, slideUp(1)]}>
              Workshop Management
            </Animated.Text>
            
            <Animated.Text style={[styles.title, slideUp(1)]}>
              Your Shop.{'\n'}
              <Text style={{ color: theme.accent }}>Under Control.</Text>
            </Animated.Text>
            
            <Animated.Text style={[styles.subtitle, slideUp(1)]}>
              Track every vehicle, repair, and technician from arrival to departure.
            </Animated.Text>
          </View>
        </SafeAreaView>
      </ImageBackground>

      {/* Bottom Action Sheet (Professional Uber/Lyft design) */}
      <Animated.View style={[styles.bottomSheet, slideUp(2)]}>
        <View style={styles.dragHandle} />
        
        <Text style={styles.sheetTitle}>Get Started</Text>
        <Text style={styles.sheetSubtitle}>
          Join the platform built exclusively for professional auto repair workshops.
        </Text>

        <View style={styles.actions}>
          <WorkshopButton
            variant="primary"
            size="lg"
            onPress={() => navigation?.navigate('Register')}
            fullWidth={true}
            style={styles.mainButton}
          >
            Create Free Account
          </WorkshopButton>

          <TouchableOpacity 
            onPress={() => navigation?.navigate('Login')}
            style={styles.loginLink}
          >
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginHighlight}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  bg: {
    width: '100%',
    height: height * 0.68, 
    justifyContent: 'flex-start',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)', // Slightly lighter overlay for the hero image
  },
  safeTop: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'android' ? 50 : 20,
    alignItems: 'flex-start',
  },
  logo: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 6,
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
    marginBottom: 12,
    fontFamily: FONT,
  },
  title: {
    color: '#FFF',
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 50,
    letterSpacing: -1,
    marginBottom: 16,
    fontFamily: FONT,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: FONT,
    paddingRight: 20,
  },

  // Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: height * 0.35, 
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 20,
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.foreground,
    marginBottom: 6,
    fontFamily: FONT,
    letterSpacing: -0.5,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 28,
    fontFamily: FONT,
    lineHeight: 22,
  },
  actions: {
    gap: 16,
  },
  mainButton: {
    marginBottom: 4,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 4,
  },
  loginText: {
    fontSize: 13,
    fontFamily: FONT,
    color: '#718096',
  },
  loginHighlight: {
    color: theme.primary,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  }
});