import * as SecureStore from 'expo-secure-store';

import ENV from '@/config/env';

const TOKEN_KEY = 'repairo_token';

export async function setToken(token: string | null) {
  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } else {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {}
  }
}

export async function getStoredToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

let _token: string | null = null;

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<{ success: boolean; data?: T; token?: string; error?: string }> {
  const url = `${ENV.API_URL}${endpoint}`;
  const token = _token || (await getStoredToken());

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, { ...options, headers });
    const json = await res.json();
    return json;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
