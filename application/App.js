import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, View, ActivityIndicator, Platform } from 'react-native';
import { LayoutDashboard, Wrench, Car, ClipboardList, Settings as SettingsIcon, ShieldCheck } from 'lucide-react-native';

import LandingScreen from './screens/LandingScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DashboardScreen from './screens/DashboardScreen';
import { VehiclesScreen, JobsScreen, SettingsScreen } from './screens/AppTabsScreens';

// Repairs Screens
import RepairsScreen from './screens/repairs/RepairsScreen';
import CreateEditRepairScreen from './screens/repairs/CreateEditRepairScreen';
import RepairBillScreen from './screens/repairs/RepairBillScreen';

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
import { Colors } from './constants/Colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const MgmtStack = createNativeStackNavigator();

const FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';
const C = Colors.dark;

// ── Management sub-navigator ──────────────────────────────────────────────────
function ManagementNavigator() {
  return (
    <MgmtStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#1D212A',
        headerTitleStyle: { fontFamily: FONT, fontWeight: '700', fontSize: 16, color: '#1D212A' },
        headerShadowVisible: true,
        headerBackTitle: 'Back',
        contentStyle: { backgroundColor: '#F4F6F8' },
      }}
    >
      <MgmtStack.Screen name="ManagementHub" component={ManagementHubScreen} options={{ headerShown: false }} />
      <MgmtStack.Screen name="Users" component={UsersScreen} options={{ title: 'Users' }} />
      <MgmtStack.Screen name="Shops" component={ShopsScreen} options={{ title: 'Shops' }} />
      <MgmtStack.Screen name="Roles" component={RolesScreen} options={{ title: 'Roles' }} />
      <MgmtStack.Screen name="Permissions" component={PermissionsScreen} options={{ title: 'Permissions' }} />
      
      {/* Create Forms */}
      <MgmtStack.Screen name="CreateUser" component={CreateUserScreen} options={{ title: 'Add User' }} />
      <MgmtStack.Screen name="CreateShop" component={CreateShopScreen} options={{ title: 'Register Shop' }} />
      <MgmtStack.Screen name="CreateRole" component={CreateRoleScreen} options={{ title: 'Create Role' }} />
      <MgmtStack.Screen name="CreatePermission" component={CreatePermissionScreen} options={{ title: 'Add Permission' }} />
    </MgmtStack.Navigator>
  );
}

// ── Repairs Tab screen ──────────────────────────────────────────────────
function RepairsTab() {
  return <RepairsScreen />;
}

// ── Tab Navigator ─────────────────────────────────────────────────────────────
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.3)',
        tabBarStyle: {
          backgroundColor: C.background,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.05)',
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          height: Platform.OS === 'ios' ? 84 : 64,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontFamily: FONT,
          fontSize: 10,
          fontWeight: '900',
          textTransform: 'uppercase',
          marginTop: -2,
        },
        tabBarIcon: ({ color, size }) => {
          let Icon;
          if (route.name === 'AppHome') Icon = LayoutDashboard;
          else if (route.name === 'Repairs') Icon = Wrench;
          else if (route.name === 'Vehicles') Icon = Car;
          else if (route.name === 'Jobs') Icon = ClipboardList;
          else if (route.name === 'Management') Icon = ShieldCheck;
          else if (route.name === 'Settings') Icon = SettingsIcon;
          
          return <Icon size={size - 2} color={color} strokeWidth={2.5} />;
        },
      })}
    >
      <Tab.Screen name="AppHome" component={DashboardScreen} options={{ tabBarLabel: 'DASHBOARD' }} />
      <Tab.Screen name="Repairs" component={RepairsScreen} options={{ tabBarLabel: 'REPAIRS' }} />
      <Tab.Screen name="Vehicles" component={VehiclesScreen} options={{ tabBarLabel: 'VEHICLES' }} />
      <Tab.Screen name="Management" component={ManagementNavigator} options={{ tabBarLabel: 'MANAGE' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'ACCOUNT' }} />
    </Tab.Navigator>
  );
}

// ── Root Content ──────────────────────────────────────────────────────────────
function RootContent() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={C.primary} size="large" />
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
            name="CreateRepair" 
            component={CreateEditRepairScreen} 
            options={{ headerShown: true, title: 'Log New Job', headerStyle: { backgroundColor: '#fff' }, headerTitleStyle: { fontFamily: FONT } }} 
          />
          <Stack.Screen 
            name="EditRepair" 
            component={CreateEditRepairScreen} 
            options={{ headerShown: true, title: 'Update Job', headerStyle: { backgroundColor: '#fff' }, headerTitleStyle: { fontFamily: FONT } }} 
          />
          <Stack.Screen 
            name="RepairBill" 
            component={RepairBillScreen} 
            options={{ headerShown: true, title: 'Repair Billing', headerStyle: { backgroundColor: '#fff' }, headerTitleStyle: { fontFamily: FONT } }} 
          />
        </>
      )}
    </Stack.Navigator>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RBACProvider>
          <NavigationContainer>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <RootContent />
          </NavigationContainer>
        </RBACProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

