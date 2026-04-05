import './global.css';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { StatusBar, View, ActivityIndicator, Platform, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  LayoutDashboard, Wrench, Car, ClipboardList, Settings as SettingsIcon, 
  ShieldCheck, Users, Lock, Milestone, Percent, Banknote, Building2, UserCircle 
} from 'lucide-react-native';

import LandingScreen from './screens/LandingScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DashboardScreen from './screens/DashboardScreen';
import VehiclesScreen from './screens/VehiclesScreen';
import CustomersScreen from './screens/CustomersScreen';
import InvoicesScreen from './screens/InvoicesScreen';
import SettingsScreen from './screens/SettingsScreen';
import CurrencyScreen from './screens/site_settings/CurrencyScreen';
import TaxesScreen from './screens/site_settings/TaxesScreen';

// Repairs Screens
import RepairsScreen from './screens/repairs/RepairsScreen';
import CreateEditRepairScreen from './screens/repairs/CreateEditRepairScreen';
import RepairBillScreen from './screens/repairs/RepairBillScreen';
import VehicleTypePickerScreen from './screens/repairs/VehicleTypePickerScreen';

// Management screens
import ManagementHubScreen from './screens/management/ManagementHubScreen';
import UsersScreen from './screens/management/UsersScreen';
import ShopsScreen from './screens/management/ShopsScreen';
import RolesScreen from './screens/management/RolesScreen';
import PermissionsScreen from './screens/management/PermissionsScreen';

import CreateUserScreen from './screens/management/CreateUserScreen';
import CreateShopScreen from './screens/management/CreateShopScreen';
import CreateRoleScreen from './screens/management/CreateRoleScreen';
import CreatePermissionScreen from './screens/management/CreatePermissionScreen';

import { ToastProvider } from './components/ui/WorkshopToast';
import { AuthProvider, useAuth } from './lib/auth';
import { RBACProvider } from './lib/rbac';
import { ThemeProvider, useTheme } from './lib/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const TopTab = createMaterialTopTabNavigator();
const MgmtStack = createNativeStackNavigator();

const FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

// ── Management Top Tab Navigator (Scrollable) ─────────────────────────────────
function ManagementTabs() {
  const T = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: T.bg, paddingTop: Platform.OS === 'ios' ? 0 : 0 }}>
      {/* Visual Header for the Management Section */}
      <View style={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 15, backgroundColor: T.surface }}>
         <Text style={{ fontSize: 24, fontWeight: '900', color: T.text, fontFamily: FONT }}>Management Hub</Text>
         <Text style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>System administration & settings</Text>
      </View>
      
      <TopTab.Navigator
        screenOptions={{
          tabBarScrollEnabled: true,
          tabBarActiveTintColor: T.primary,
          tabBarInactiveTintColor: T.textMuted,
          tabBarIndicatorStyle: { backgroundColor: T.primary, height: 3, borderRadius: 3 },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '900', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: 0.5 },
          tabBarItemStyle: { width: 'auto', paddingHorizontal: 20 },
          tabBarStyle: { backgroundColor: T.surface, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: T.border },
        }}
      >
        <TopTab.Screen name="UsersTab" component={UsersScreen} options={{ title: 'Users' }} />
        <TopTab.Screen name="RolesTab" component={RolesScreen} options={{ title: 'Roles' }} />
        <TopTab.Screen name="PermissionsTab" component={PermissionsScreen} options={{ title: 'Perms' }} />
        <TopTab.Screen name="TaxesTab" component={TaxesScreen} options={{ title: 'Tax' }} />
        <TopTab.Screen name="CurrencyTab" component={CurrencyScreen} options={{ title: 'Currency' }} />
        <TopTab.Screen name="ShopTab" component={ShopsScreen} options={{ title: 'Store' }} />
        <TopTab.Screen name="ProfileTab" component={SettingsScreen} options={{ title: 'Profile' }} />
      </TopTab.Navigator>
    </View>
  );
}

// Wrap the tabs in a stack if you still need specific full-screen sub-flows
function ManagementNavigator() {
  return (
    <MgmtStack.Navigator screenOptions={{ headerShown: false }}>
      <MgmtStack.Screen name="MgmtTabs" component={ManagementTabs} />
      {/* Keep deep link forms as full screens */}
      <MgmtStack.Screen name="CreateUser" component={CreateUserScreen} options={{ headerShown: true, title: 'Add User' }} />
      <MgmtStack.Screen name="CreateShop" component={CreateShopScreen} options={{ headerShown: true, title: 'Register Shop' }} />
      <MgmtStack.Screen name="CreateRole" component={CreateRoleScreen} options={{ headerShown: true, title: 'Create Role' }} />
      <MgmtStack.Screen name="CreatePermission" component={CreatePermissionScreen} options={{ headerShown: true, title: 'Add Permission' }} />
    </MgmtStack.Navigator>
  );
}

// ── Tab Navigator ─────────────────────────────────────────────────────────────
function TabNavigator() {
  const insets = useSafeAreaInsets();
  const T = useTheme();
  const tabBarPaddingBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);
  const tabBarHeight = 56 + tabBarPaddingBottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: T.primary,
        tabBarInactiveTintColor: T.textMuted,
        tabBarStyle: {
          backgroundColor: T.tabBarBg,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: T.tabBarBorder,
          paddingTop: 8,
          paddingBottom: tabBarPaddingBottom + 4,
          height: tabBarHeight,
          elevation: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: T.isDark ? 0.3 : 0.06,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontFamily: FONT,
          fontSize: 10,
          fontWeight: '900',
          textTransform: 'uppercase',
          marginTop: -2,
          letterSpacing: 0.5,
        },
        tabBarIcon: ({ color, size, focused }) => {
          let Icon;
          if (route.name === 'AppHome') Icon = LayoutDashboard;
          else if (route.name === 'Repairs') Icon = Wrench;
          else if (route.name === 'Vehicles') Icon = Car;
          else if (route.name === 'Customers') Icon = UserCircle;
          else if (route.name === 'Bills') Icon = ClipboardList;
          else if (route.name === 'Management') Icon = ShieldCheck;

          return (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 32,
              borderRadius: 10,
              backgroundColor: focused ? T.primary + '22' : 'transparent',
              paddingHorizontal: 12,
            }}>
              <Icon size={20} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="AppHome" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Repairs" component={RepairsScreen} options={{ tabBarLabel: 'Repairs' }} />
      <Tab.Screen name="Vehicles" component={VehiclesScreen} options={{ tabBarLabel: 'Cars' }} />
      <Tab.Screen name="Customers" component={CustomersScreen} options={{ tabBarLabel: 'Clients' }} />
      <Tab.Screen name="Bills" component={InvoicesScreen} options={{ tabBarLabel: 'Bills' }} />
      <Tab.Screen name="Management" component={ManagementNavigator} options={{ tabBarLabel: 'Manage' }} />
    </Tab.Navigator>
  );
}

// ── Root Content ──────────────────────────────────────────────────────────────
function RootContent() {
  const { isLoggedIn, isLoading } = useAuth();
  const T = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={T.primary} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      key={isLoggedIn ? 'app' : 'auth'}
      screenOptions={{ headerShown: false, animation: 'fade' }}
    >
      {!isLoggedIn ? (
        <>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          {/* Repairs Sub-flow (Full Screen) */}
          <Stack.Screen
            name="Invoices"
            component={InvoicesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Currency"
            component={CurrencyScreen}
            options={{ headerShown: true, title: 'Currency Settings', headerStyle: { backgroundColor: T.surface }, headerTintColor: T.text, headerTitleStyle: { fontFamily: FONT }, headerShadowVisible: false }}
          />
          <Stack.Screen
            name="Taxes"
            component={TaxesScreen}
            options={{ headerShown: true, title: 'Tax Rules', headerStyle: { backgroundColor: T.surface }, headerTintColor: T.text, headerTitleStyle: { fontFamily: FONT }, headerShadowVisible: false }}
          />
          <Stack.Screen
            name="CreateRepair"
            component={CreateEditRepairScreen}
            options={{ headerShown: true, title: '', headerStyle: { backgroundColor: T.surface }, headerTintColor: T.text, headerTitleStyle: { fontFamily: FONT }, headerShadowVisible: false }}
          />
          <Stack.Screen
            name="EditRepair"
            component={CreateEditRepairScreen}
            options={{ headerShown: true, title: '', headerStyle: { backgroundColor: T.surface }, headerTintColor: T.text, headerTitleStyle: { fontFamily: FONT }, headerShadowVisible: false }}
          />
          <Stack.Screen
            name="RepairBill"
            component={RepairBillScreen}
            options={{ headerShown: true, title: 'Repair Billing', headerStyle: { backgroundColor: T.surface }, headerTintColor: T.text, headerTitleStyle: { fontFamily: FONT }, headerShadowVisible: false }}
          />
          <Stack.Screen
            name="VehicleTypePicker"
            component={VehicleTypePickerScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
function ThemedApp() {
  const T = useTheme();
  return (
    <NavigationContainer>
      <StatusBar
        barStyle={T.isDark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <RootContent />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <RBACProvider>
            <ThemedApp />
          </RBACProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
