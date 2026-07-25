import { getStoredToken } from './api';
import type { Shop } from '@/types';
import ENV from '@/config/env';

export const shopService = {
  async getById(id: number) {
    try {
      const token = await getStoredToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${ENV.API_URL}/shops/${id}`, { headers });
      return await res.json() as { success: boolean; data?: Shop; error?: string };
    } catch {
      return { success: false, error: 'Connection failed' };
    }
  },

  async update(id: number, data: Record<string, unknown>) {
    try {
      const token = await getStoredToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${ENV.API_URL}/shops/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      return await res.json() as { success: boolean; data?: Shop; error?: string };
    } catch {
      return { success: false, error: 'Connection failed' };
    }
  },
};
