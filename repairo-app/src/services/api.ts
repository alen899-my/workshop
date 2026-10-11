import * as Storage from '@/services/storage';

import { API_URL } from '@/config/env';

const TOKEN_KEY = 'repairo_token';
let unauthorizedHandler: (() => Promise<void>) | undefined;
export function setUnauthorizedHandler(handler: () => Promise<void>) { unauthorizedHandler = handler; }

export async function setToken(token: string | null) {
  if (token) {
    await Storage.setItemAsync(TOKEN_KEY, token);
  } else {
    await Storage.deleteItemAsync(TOKEN_KEY);
  }
}

export async function getStoredToken(): Promise<string | null> {
  try {
    return await Storage.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<{ success: boolean; data?: T; token?: string; error?: string; status?: number }> {
  const url = `${API_URL}${endpoint}`;
  const publicAuth = ['/auth/login', '/auth/register-shop', '/auth/forgot-password', '/auth/reset-password'].includes(endpoint);
  const token = publicAuth ? null : await getStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, { ...options, headers, signal: controller.signal });
    const json = await res.json();
    if (res.status === 401 && !publicAuth && endpoint !== '/auth/session' && token === await getStoredToken()) await unauthorizedHandler?.();
    if (!res.ok) return { ...json, success: false, status: res.status, error: json.error || 'Request failed. Please try again.' };
    return json;
  } catch {
    return { success: false, error: controller.signal.aborted ? 'Request timed out. Please try again.' : 'Could not reach the server. Check your connection and try again.' };
  } finally {
    clearTimeout(timeout);
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
