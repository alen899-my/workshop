import ENV from '@/config/env';
import { getStoredToken } from '@/services/api';

const API_URL = `${ENV.API_URL}/taxes`;

export interface Tax {
  id: number;
  name: string;
  rate: number;
  is_active: boolean;
  is_inclusive: boolean;
  applies_to: string;
}

export const taxService = {
  async getAll(): Promise<{ success: boolean; data?: Tax[]; error?: string }> {
    try {
      const token = await getStoredToken();
      const res = await fetch(API_URL, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Connection failed' };
    }
  },
};
