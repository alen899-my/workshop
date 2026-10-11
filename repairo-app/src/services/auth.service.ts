import * as Storage from '@/services/storage';

import { api, getStoredToken, setToken, setUnauthorizedHandler } from './api';
import { router } from 'expo-router';
import { getCallingCode } from '@/utils/preload-countries';

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
  _currentUser = null;
  try {
    const raw = await Storage.getItemAsync(USER_KEY);
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
    await Storage.setItemAsync(USER_KEY, JSON.stringify(_currentUser));
  }
}

export function getCurrentUser(): UserData | null {
  return _currentUser;
}

async function saveUser(user: UserData | null) {
  if (user) {
    await Storage.setItemAsync(USER_KEY, JSON.stringify(user));
  } else {
    await Storage.deleteItemAsync(USER_KEY);
  }
  _currentUser = user;
}

export class AuthError extends Error {
  constructor(message: string, public fields: Record<string, string> = {}) { super(message); }
}

async function persistSession(token: string, user: UserData) {
  try {
    await saveUser(user);
    await setToken(token);
  } catch {
    await Promise.allSettled([setToken(null), saveUser(null)]);
    _currentUser = null;
    throw new Error('Could not save your session. Please try logging in again.');
  }
}

export const authService = {
  async restoreSession(): Promise<boolean> {
    if (!await getStoredToken()) { await saveUser(null); return false; }
    const res = await api.get<UserData>('/auth/session');
    if (res.status === 401) { await this.logout(); return false; }
    if (!res.success || !res.data?.userId) throw new Error(res.error || 'Unable to verify your session');
    const user = { ...res.data, shopCallingCode: getCallingCode(res.data.shopCountry || 'IN') };
    await saveUser(user);
    return true;
  },
  async login(phone: string, password: string) {
    const res: { success: boolean; token?: string; data?: UserData; error?: string } =
      await api.post('/auth/login', { phone, password });
    if (!res.success || !res.token || !res.data?.userId) {
      throw new Error(res.error || 'Login failed');
    }
    // Compute and persist the calling code from shop country so it's available immediately
    if (res.data?.shopCountry) {
      const code = getCallingCode(res.data.shopCountry);
      if (code) res.data.shopCallingCode = code;
    }
    await persistSession(res.token, res.data);
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
    phoneCountry?: string;
    latitude?: number;
    longitude?: number;
  }) {
    const res: { success: boolean; token?: string; data?: UserData; error?: string; fields?: Record<string, string> } =
      await api.post('/auth/register-shop', data);
    if (!res.success) {
      throw new AuthError(res.error || 'Registration failed', res.fields);
    }
    // Signup returns to login. Do not briefly create a session and then log out.
    return res;
  },

  async logout() {
    _currentUser = null;
    await Promise.all([setToken(null), saveUser(null)]);
  },

  async forgotPassword(email: string) {
    const res = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
    if (!res.success) throw new Error(res.error || 'Unable to request a password reset');
  },
};

setUnauthorizedHandler(async () => {
  await authService.logout();
  router.replace('/auth/login');
});
