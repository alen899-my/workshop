import * as SecureStore from 'expo-secure-store';

import { api, setToken } from './api';

const USER_KEY = 'repairo_user';

interface UserData {
  userId?: number;
  shopId?: number;
  shopName?: string;
  ownerName?: string;
  role?: string;
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
  }) {
    const res: { success: boolean; token?: string; data?: UserData; error?: string } =
      await api.post('/auth/register-shop', data);
    if (!res.success) {
      throw new Error(res.error || 'Registration failed');
    }
    if (res.token) {
      await setToken(res.token);
    }
    await saveUser(res.data ?? null);
    return res;
  },

  async logout() {
    await setToken(null);
    await saveUser(null);
  },
};
