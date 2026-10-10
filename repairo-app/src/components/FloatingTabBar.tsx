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
import { useTheme } from '@/hooks/use-theme';

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
  const theme = useTheme();
  const scale = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    scale.value = withTiming(focused ? 1 : 0, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + scale.value * 0.04 }],
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: scale.value,
    transform: [{ scaleX: scale.value }],
  }));

  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={tab.label} style={[styles.item, { backgroundColor: focused ? theme.primary : 'transparent', borderRadius: 24 }]} onPress={onPress}>
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

  const visibleTabs = loading
    ? TABS
    : TABS.filter((tab) => !tab.permission || can(tab.permission));

  const barBg = theme.floatingBar;
  const barBorder = theme.border;
  const barShadow = theme.text;

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
              tabIconSelected={theme.primaryForeground}
              tabIconDefault={theme.tabIconDefault}
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
    borderRadius: 32,
    height: 72,
    width: '100%',
    paddingHorizontal: 6,
    backgroundColor: '#111318',
    borderWidth: 1,
    borderColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 4,
  },
  indicator: {
    width: 20,
    height: 2,
    borderRadius: 1.5,
    marginTop: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
