import { useEffect } from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useRBAC } from '@/hooks/use-rbac';
import { useTheme, useThemePreference } from '@/hooks/use-theme';

const TABS: { name: string; label: string; icon: keyof typeof Ionicons.glyphMap; permission?: string }[] = [
  { name: 'index', label: 'Home', icon: 'home-outline' },

  { name: 'repairs', label: 'Repairs', icon: 'build-outline', permission: 'view:repairs' },
  { name: 'vehicles', label: 'Vehicles', icon: 'car-outline', permission: 'view:vehicles' },
  { name: 'customers', label: 'Customers', icon: 'people-outline', permission: 'view:customers' },
  { name: 'settings', label: 'Profile', icon: 'person-outline' },
];

function AnimatedTab({
  tab,
  focused,
  onPress,
  tabIconSelected,
  tabIconDefault,
}: {
  tab: (typeof TABS)[number];
  focused: boolean;
  onPress: () => void;
  tabIconSelected: string;
  tabIconDefault: string;
}) {
  const scale = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    scale.value = withTiming(focused ? 1 : 0, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.8 + scale.value * 0.4 }],
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: scale.value,
    transform: [{ scaleX: scale.value }],
  }));

  return (
    <Pressable style={styles.item} onPress={onPress}>
      <Animated.View style={iconStyle}>
        <Ionicons
          name={tab.icon}
          size={22}
          color={focused ? tabIconSelected : tabIconDefault}
        />
      </Animated.View>
      <Animated.View style={[styles.indicator, { backgroundColor: tabIconSelected }, indicatorStyle]} />
      <Animated.Text
        style={[
          styles.label,
          { color: focused ? tabIconSelected : tabIconDefault },
        ]}
      >
        {tab.label}
      </Animated.Text>
    </Pressable>
  );
}

export default function FloatingTabBar({ state, navigation }: any) {
  const { bottom } = useSafeAreaInsets();
  const { can, loading } = useRBAC();
  const theme = useTheme();
  const { isDark } = useThemePreference();

  const visibleTabs = loading
    ? TABS
    : TABS.filter((tab) => !tab.permission || can(tab.permission));

  const barBg = isDark ? '#1C1C1E' : '#111318';
  const barBorder = isDark ? '#2C2C2E' : '#000000';
  const barShadow = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.08)';

  return (
    <View style={[styles.wrapper, { bottom: Math.max(bottom, 16) }]}>
      <View style={[styles.bar, { shadowColor: barShadow, backgroundColor: barBg, borderColor: barBorder }]}>  
        {visibleTabs.map((tab) => {
          const routeIndex = state.routes.findIndex((r: any) => r.name === tab.name);
          const focused = state.index === routeIndex;

          return (
            <AnimatedTab
              key={tab.name}
              tab={tab}
              focused={focused}
              onPress={() => navigation.navigate(tab.name)}
              tabIconSelected={theme.tabIconSelected}
              tabIconDefault={'#A1A1AA'}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 28,
    height: 64,
    paddingHorizontal: 4,
    backgroundColor: '#111318',
    borderWidth: 1,
    borderColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 1,
  },
  indicator: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
    marginTop: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
