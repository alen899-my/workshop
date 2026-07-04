import ENV from '@/config/env';
import { getStoredToken } from '@/services/api';

const API_URL = `${ENV.API_URL}/vehicles`;

export interface VehicleData {
  id: number;
  vehicle_number: string;
  model_name: string;
  vehicle_type: string;
  vehicle_image?: string;
  owner_name?: string;
  owner_phone?: string;
  brand?: string;
}

export const vehicleService = {
  async getAll(): Promise<{ success: boolean; data: VehicleData[]; error?: string }> {
    try {
      const token = await getStoredToken();
      const res = await fetch(API_URL, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return await res.json();
    } catch {
      return { success: false, data: [], error: 'Connection failed' };
    }
  },

  async getByNumber(number: string): Promise<{ success: boolean; data?: VehicleData; error?: string }> {
    try {
      const token = await getStoredToken();
      const res = await fetch(`${API_URL}/number/${encodeURIComponent(number)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Connection failed' };
    }
  },
};
