import { Tabs } from 'expo-router';

import FloatingTabBar from '@/components/FloatingTabBar';
import ScreenHeader from '@/components/ScreenHeader';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ header: () => <ScreenHeader /> }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="repairs" />
      <Tabs.Screen name="vehicles" />
      <Tabs.Screen name="customers" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
