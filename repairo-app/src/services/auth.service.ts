import * as SecureStore from 'expo-secure-store';

import { api, setToken } from './api';
import { getCallingCode, waitForCountries } from '@/utils/preload-countries';

const USER_KEY = 'repairo_user';

interface UserData {
  userId?: number;
  shopId?: number;
  shopName?: string;
  ownerName?: string;
  role?: string;
  shopCurrency?: string;
  shopCountry?: string;
  shopCallingCode?: string;
  phone?: string;
  email?: string;
  profile_image?: string | null;
  shopPrimaryColor?: string | null;
}

let _currentUser: UserData | null = null;

export async function loadStoredUser(): Promise<UserData | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    if (raw) {
      _currentUser = JSON.parse(raw);
      return _currentUser;
    }
  } catch {}
  return null;
}

export async function updateCurrentUser(data: Partial<UserData>) {
  if (_currentUser) {
    _currentUser = { ..._currentUser, ...data };
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(_currentUser));
  }
}

export function getCurrentUser(): UserData | null {
  return _currentUser;
}

async function saveUser(user: UserData | null) {
  _currentUser = user;
  if (user) {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } else {
    try { await SecureStore.deleteItemAsync(USER_KEY); } catch {}
  }
}

export const authService = {
  async login(phone: string, password: string) {
    const res: { success: boolean; token?: string; data?: UserData; error?: string } =
      await api.post('/auth/login', { phone, password });
    if (!res.success) {
      throw new Error(res.error || 'Login failed');
    }
    if (res.token) {
      await setToken(res.token);
    }
    // Compute and persist the calling code from shop country so it's available immediately
    if (res.data?.shopCountry) {
      await waitForCountries();
      const code = getCallingCode(res.data.shopCountry);
      if (code) res.data.shopCallingCode = code;
    }
    await saveUser(res.data ?? null);
    return res;
  },

  async register(data: {
    shopName: string;
    location: string;
    ownerName: string;
    phone: string;
    email: string;
    country: string;
    currency: string;
    password: string;
    callingCode?: string;
  }) {
    const { callingCode, ...payload } = data;
    const res: { success: boolean; token?: string; data?: UserData; error?: string } =
      await api.post('/auth/register-shop', payload);
    if (!res.success) {
      throw new Error(res.error || 'Registration failed');
    }
    if (res.token) {
      await setToken(res.token);
    }
    // Merge the callingCode from the signup form into the persisted user so
    // CreateRepairScreen can use it without waiting for country data to load
    const userData: UserData | null = res.data
      ? { ...res.data, ...(callingCode ? { shopCallingCode: callingCode } : {}) }
      : null;
    await saveUser(userData);
    return res;
  },

  async logout() {
    await setToken(null);
    await saveUser(null);
  },
};
