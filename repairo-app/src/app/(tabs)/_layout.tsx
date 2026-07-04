import { Tabs } from 'expo-router';
import { ComponentProps } from 'react';

import FloatingTabBar from '@/components/FloatingTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="repairs" />
      <Tabs.Screen name="vehicles" />
      <Tabs.Screen name="customers" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
