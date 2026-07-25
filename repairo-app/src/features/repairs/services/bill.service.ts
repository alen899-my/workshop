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

export interface BillListItem {
  id: number;
  repair_id: number;
  items: BillItem[];
  service_charge: number;
  tax_snapshot?: TaxSnapshotItem[];
  tax_total?: number;
  subtotal_before_tax?: number;
  total_amount: number;
  payment_status?: string;
  payment_method?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  vehicle_number?: string;
  owner_name?: string;
  repair_date?: string;
  repair_status?: string;
  vehicle_image?: string;
  vehicle_type?: string;
  service_type?: string;
  phone_number?: string;
  complaints?: unknown;
  attending_worker_name?: string;
  model_name?: string;
}

interface BillListFilters {
  search?: string;
  payment_status?: string;
  status?: string;
  recordStatus?: string;
}

export const billService = {
  async getAll(filters?: BillListFilters): Promise<{ success: boolean; data?: BillListItem[]; error?: string }> {
    try {
      const token = await getStoredToken();
      const params = new URLSearchParams();
      if (filters?.search) params.set('search', filters.search);
      if (filters?.payment_status) params.set('payment_status', filters.payment_status);
      if (filters?.status) params.set('status', filters.status);
      if (filters?.recordStatus) params.set('recordStatus', filters.recordStatus);
      const qs = params.toString();
      const res = await fetch(`${API_URL}${qs ? `?${qs}` : ''}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Connection failed' };
    }
  },

  async getByRepairId(repairId: number): Promise<{ success: boolean; data?: { id: number; items: BillItem[]; service_charge: number; tax_snapshot: TaxSnapshotItem[]; tax_total: number; payment_status: string; payment_method?: string; total: number }; error?: string }> {
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
    payment_method?: string | null;
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
