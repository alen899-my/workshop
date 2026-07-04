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

import { Colors } from '@/constants/theme';
import { useRBAC } from '@/hooks/use-rbac';

const TABS: { name: string; label: string; icon: keyof typeof Ionicons.glyphMap; permission?: string }[] = [
  { name: 'index', label: 'Home', icon: 'home-outline' },
  { name: 'repairs', label: 'Repairs', icon: 'build-outline', permission: 'view:repairs' },
  { name: 'vehicles', label: 'Vehicles', icon: 'car-outline', permission: 'view:vehicles' },
  { name: 'customers', label: 'Customers', icon: 'people-outline', permission: 'view:customers' },
  { name: 'settings', label: 'Settings', icon: 'settings-outline', permission: 'manage:settings' },
];

function AnimatedTab({
  tab,
  focused,
  onPress,
}: {
  tab: (typeof TABS)[number];
  focused: boolean;
  onPress: () => void;
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

  return (
    <Pressable style={styles.item} onPress={onPress}>
      <Animated.View style={iconStyle}>
        <Ionicons
          name={tab.icon}
          size={22}
          color={focused ? Colors.floatingBar : Colors.mutedDark}
        />
      </Animated.View>
      <Animated.Text
        style={[
          styles.label,
          { color: focused ? Colors.floatingBar : Colors.mutedDark },
        ]}
      >
        {tab.label}
      </Animated.Text>
    </Pressable>
  );
}

export default function FloatingTabBar({ state, navigation }: any) {
  const { bottom } = useSafeAreaInsets();
  const { can } = useRBAC();

  const visibleTabs = TABS.filter((tab) => !tab.permission || can(tab.permission));

  return (
    <View style={[styles.wrapper, { bottom: Math.max(bottom, 16) }]}>
      <View style={styles.bar}>
        {visibleTabs.map((tab) => {
          const routeIndex = state.routes.findIndex((r: any) => r.name === tab.name);
          const focused = state.index === routeIndex;

          return (
            <AnimatedTab
              key={tab.name}
              tab={tab}
              focused={focused}
              onPress={() => navigation.navigate(tab.name)}
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
    backgroundColor: Colors.dark,
    borderRadius: 28,
    height: 64,
    paddingHorizontal: 4,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
