import ENV from '@/config/env';
import { getStoredToken } from '@/services/api';

const API_URL = `${ENV.API_URL}/vehicles`;

export interface Vehicle {
  id: number;
  customer_id?: number;
  shop_id: number;
  vehicle_number: string;
  model_name?: string;
  vehicle_type?: string;
  vehicle_image?: string;
  brand?: string;
  status?: string;
  created_at?: string;
  owner_name?: string;
  owner_phone?: string;
  shop_name?: string;
  repairs?: { id: number; repair_date: string; status: string; complaints?: unknown }[];
}

export const vehicleService = {
  async getAll(status?: string): Promise<{ success: boolean; data: Vehicle[]; error?: string }> {
    try {
      const token = await getStoredToken();
      const params = status ? `?status=${status}` : '';
      const res = await fetch(`${API_URL}${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return await res.json();
    } catch {
      return { success: false, data: [], error: 'Connection failed' };
    }
  },

  async getById(id: number): Promise<{ success: boolean; data?: Vehicle; error?: string }> {
    try {
      const token = await getStoredToken();
      const res = await fetch(`${API_URL}/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Connection failed' };
    }
  },

  async getByNumber(number: string): Promise<{ success: boolean; data?: Vehicle | null; error?: string }> {
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

  async create(data: FormData): Promise<{ success: boolean; data?: Vehicle; error?: string }> {
    return new Promise((resolve) => {
      getStoredToken().then((token) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', API_URL);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.onload = () => {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch { resolve({ success: false, error: 'Invalid response' }); }
        };
        xhr.onerror = () => resolve({ success: false, error: 'Connection failed' });
        xhr.send(data);
      });
    });
  },

  async update(id: number, data: FormData): Promise<{ success: boolean; data?: Vehicle; error?: string }> {
    return new Promise((resolve) => {
      getStoredToken().then((token) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', `${API_URL}/${id}`);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.onload = () => {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch { resolve({ success: false, error: 'Invalid response' }); }
        };
        xhr.onerror = () => resolve({ success: false, error: 'Connection failed' });
        xhr.send(data);
      });
    });
  },

  async delete(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await getStoredToken();
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Connection failed' };
    }
  },
};
