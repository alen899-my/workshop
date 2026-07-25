import ENV from '@/config/env';
import { getStoredToken } from '@/services/api';

const API_URL = `${ENV.API_URL}/taxes`;

export interface Tax {
  id: number;
  name: string;
  rate: number;
  description?: string;
  is_active: boolean;
  is_inclusive: boolean;
  applies_to: string;
  created_at: string;
  updated_at: string;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getStoredToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export const taxService = {
  async getAll(status?: string): Promise<{ success: boolean; data: Tax[]; error?: string }> {
    try {
      let url = API_URL;
      if (status) url += `?status=${status}`;
      const headers = await getAuthHeaders();
      const res = await fetch(url, { headers });
      return await res.json();
    } catch {
      return { success: false, data: [], error: 'Connection failed' };
    }
  },

  async create(data: Partial<Tax>): Promise<{ success: boolean; data?: Tax; error?: string }> {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Creation failed' };
    }
  },

  async update(id: number, data: Partial<Tax>): Promise<{ success: boolean; data?: Tax; error?: string }> {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Update failed' };
    }
  },

  async delete(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders(),
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Deletion failed' };
    }
  },

  computeTaxes(taxSettings: Tax[], partsSubtotal: number, serviceCharge: number) {
    const activeTaxes = taxSettings.filter((t) => t.is_active);
    let taxTotal = 0;
    const taxSnapshot = activeTaxes.map((tax) => {
      let base = 0;
      if (tax.applies_to === 'all') base = partsSubtotal + serviceCharge;
      else if (tax.applies_to === 'parts') base = partsSubtotal;
      else if (tax.applies_to === 'service') base = serviceCharge;

      let amount = 0;
      if (tax.is_inclusive) {
        amount = base - base / (1 + tax.rate / 100);
      } else {
        amount = base * (tax.rate / 100);
      }
      amount = Math.round(amount * 100) / 100;
      taxTotal += amount;
      return {
        id: tax.id,
        name: tax.name,
        rate: tax.rate,
        amount,
        is_inclusive: tax.is_inclusive,
        applies_to: tax.applies_to,
      };
    });
    return { taxSnapshot, taxTotal: Math.round(taxTotal * 100) / 100 };
  },
};
