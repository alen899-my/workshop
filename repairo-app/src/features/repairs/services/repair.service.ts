import ENV from '@/config/env';
import { getStoredToken } from '@/services/api';

export interface Repair {
  id: number;
  shop_id: number;
  vehicle_image?: string;
  images?: string[];
  vehicle_number: string;
  model_name?: string;
  vehicle_type?: string;
  owner_name?: string;
  phone_number?: string;
  complaints?: unknown;
  repair_date?: string;
  attending_worker_id?: number;
  submitted_by_id?: number;
  status: string;
  service_type: string;
  created_at: string;
  shop_name?: string;
  attending_worker_name?: string;
  submitted_by_name?: string;
  bill_id?: number | null;
  payment_status?: string | null;
  brand?: string;
  km_reading?: string;
  whatsapp_number?: string;
  priority?: string;
  expected_completion?: string;
}

export interface RepairFilters {
  search?: string;
  status?: string;
  serviceType?: string;
  vehicleType?: string;
  worker?: string;
  dateFrom?: string;
  dateTo?: string;
}

const API_URL = `${ENV.API_URL}/repairs`;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getStoredToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export const repairService = {
  async getAll(filters?: RepairFilters): Promise<{ success: boolean; data: Repair[]; error?: string }> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, val]) => {
          if (val) params.append(key, val);
        });
      }
      const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
      const headers = await getAuthHeaders();
      const res = await fetch(url, { headers });
      return await res.json();
    } catch (error) {
      return { success: false, data: [], error: 'Connection failed' };
    }
  },

  async getById(id: string | number): Promise<{ success: boolean; data?: Repair; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/${id}`, { headers });
      return await res.json();
    } catch {
      return { success: false, error: 'Connection failed' };
    }
  },

  async create(data: FormData): Promise<{ success: boolean; data?: Repair; error?: string }> {
    try {
      const token = await getStoredToken();
      return await new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', API_URL);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.onload = () => {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch { resolve({ success: false, error: 'Invalid response' }); }
        };
        xhr.onerror = () => resolve({ success: false, error: 'Network error' });
        xhr.send(data);
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Creation failed';
      console.error('createRepair exception:', msg);
      return { success: false, error: msg };
    }
  },

  async update(id: string | number, data: FormData): Promise<{ success: boolean; data?: Repair; error?: string }> {
    try {
      const token = await getStoredToken();
      return await new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', `${API_URL}/${id}`);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.onload = () => {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch { resolve({ success: false, error: 'Invalid response' }); }
        };
        xhr.onerror = () => resolve({ success: false, error: 'Network error' });
        xhr.send(data);
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Update failed';
      console.error('updateRepair exception:', msg);
      return { success: false, error: msg };
    }
  },

  async delete(id: string | number): Promise<{ success: boolean; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers });
      return await res.json();
    } catch {
      return { success: false, error: 'Deletion failed' };
    }
  },
};
