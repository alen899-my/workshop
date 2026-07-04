import ENV from '@/config/env';
import { getStoredToken } from '@/services/api';

const API_URL = `${ENV.API_URL}/users`;

export interface Worker {
  id: number;
  name: string;
  role: string;
}

export const workerService = {
  async getWorkers(): Promise<{ success: boolean; data?: Worker[]; error?: string }> {
    try {
      const token = await getStoredToken();
      const res = await fetch(`${API_URL}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Connection failed' };
    }
  },
};
