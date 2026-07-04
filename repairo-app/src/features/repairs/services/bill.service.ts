import ENV from '@/config/env';
import { getStoredToken } from '@/services/api';

const API_URL = `${ENV.API_URL}/bills`;

export interface BillItem {
  id?: string;
  name: string;
  qty: number;
  cost: number;
}

export interface TaxSnapshotItem {
  id: number;
  name: string;
  rate: number;
  amount: number;
  is_inclusive: boolean;
  applies_to: string;
}

export const billService = {
  async getByRepairId(repairId: number): Promise<{ success: boolean; data?: { id: number; items: BillItem[]; service_charge: number; tax_snapshot: TaxSnapshotItem[]; tax_total: number; payment_status: string; total: number }; error?: string }> {
    try {
      const token = await getStoredToken();
      const res = await fetch(`${API_URL}/repair/${repairId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Connection failed' };
    }
  },

  async saveBill(repairId: number, data: {
    items: BillItem[];
    service_charge: number;
    tax_snapshot: TaxSnapshotItem[];
    tax_total: number;
    payment_status: string;
  }): Promise<{ success: boolean; data?: { id: number }; error?: string }> {
    try {
      const token = await getStoredToken();
      const res = await fetch(`${API_URL}/repair/${repairId}`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Connection failed' };
    }
  },

  async delete(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await getStoredToken();
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });
      return await res.json();
    } catch {
      return { success: false, error: 'Connection failed' };
    }
  },
};
