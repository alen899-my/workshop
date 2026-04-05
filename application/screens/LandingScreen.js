import React from 'react';
import {
  View,
  Text,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { ArrowRight } from 'lucide-react-native';

const FONT = Platform.OS === 'ios' ? 'System' : 'sans-serif';

export default function LandingScreen({ navigation }) {
  const { height } = useWindowDimensions();
  const isSmall = height < 700;

  return (
    <View className="flex-1 bg-white">
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* ── Full-screen hero ──────────────────────────────────────────── */}
      <ImageBackground
        source={require('../assets/workshopmobile-screen.jpg')}
        className="flex-1"
        resizeMode="cover"
      >
        {/* Dark overlay */}
        <View className="absolute inset-0 bg-black/55" />

        <SafeAreaView className="flex-1">
          <View
            className="flex-1 justify-between"
            style={{ paddingTop: Platform.OS === 'android' ? 40 : 0 }}
          >
            {/* ── Logo ── */}
            <View className="px-7 pt-4">
              <Text
                className="text-white font-black tracking-[4px]"
                style={{ fontFamily: FONT, fontSize: 17 }}
              >
                VEH<Text className="text-[#7AB4CC]">REP</Text>
              </Text>
            </View>

            {/* ── Hero copy ── */}
            <View className="px-7 pb-12">
              <Text
                className="text-[#7AB4CC] text-[10px] font-bold tracking-[3px] uppercase mb-3"
                style={{ fontFamily: FONT }}
              >
                Workshop Management
              </Text>
              <Text
                className="text-white font-extrabold tracking-tight mb-4"
                style={{
                  fontFamily: FONT,
                  fontSize: isSmall ? 36 : 44,
                  lineHeight: isSmall ? 44 : 54,
                }}
              >
                Your Shop.{'\n'}
                <Text className="text-[#7AB4CC]">Under Control.</Text>
              </Text>
              <Text
                className="text-white/75 text-[14px] leading-6"
                style={{ fontFamily: FONT, maxWidth: '80%' }}
              >
                Track every vehicle, repair, and technician from arrival to departure.
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>

      {/* ── Bottom sheet ─────────────────────────────────────────────── */}
      <View className="bg-white rounded-t-[32px] -mt-8 px-7 pb-12 pt-6">
        {/* Handle */}
        <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-8" />

        <Text
          className="text-[#0F2321] font-extrabold text-[24px] tracking-tight mb-2"
          style={{ fontFamily: FONT }}
        >
          Get Started
        </Text>
        <Text
          className="text-[#64748B] text-[14px] leading-6 mb-8"
          style={{ fontFamily: FONT }}
        >
          Join the platform built exclusively for professional auto repair workshops.
        </Text>

        {/* Primary CTA */}
        <TouchableOpacity
          onPress={() => navigation?.navigate('Register')}
          activeOpacity={0.85}
          className="bg-[#3D7A78] rounded-2xl h-14 flex-row items-center justify-center mb-3"
          style={{ gap: 8 }}
        >
          <Text
            className="text-white text-[15px] font-bold tracking-wide"
            style={{ fontFamily: FONT }}
          >
            Create Free Account
          </Text>
          <ArrowRight size={18} color="#FFF" strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Secondary link */}
        <TouchableOpacity
          onPress={() => navigation?.navigate('Login')}
          activeOpacity={0.6}
          className="mt-2 items-center py-3"
        >
          <Text
            className="text-[#64748B] text-[13px]"
            style={{ fontFamily: FONT }}
          >
            Already have an account?{' '}
            <Text className="text-[#3D7A78] font-bold">Log In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}