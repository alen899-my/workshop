const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/bills`;

const getAuth = (): HeadersInit => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem("workshop_token");
  return token ? { "Authorization": `Bearer ${token}` } : {};
};

export interface BillItem {
  id: string; // generated client-side for keys
  name: string;
  cost: number;
  qty: number;
}

export interface TaxSnapshotItem {
  id: number;
  name: string;
  rate: number;
  amount: number;
  is_inclusive: boolean;
  applies_to: string;
}

export interface Bill {
  id?: number;
  repair_id: number;
  items: BillItem[];
  service_charge: number;
  tax_snapshot?: TaxSnapshotItem[];
  tax_total?: number;
  subtotal_before_tax?: number;
  total_amount: number;
  // Joined fields from repairs
  vehicle_number?: string;
  owner_name?: string;
  repair_date?: string;
  status?: string;
  created_at?: string;
  vehicle_image?: string;
  vehicle_type?: string;
  service_type?: string;
  phone_number?: string;
  complaints?: string;
  attending_worker_name?: string;
}

export const billService = {
  /** Fetch all bills for the current shop */
  async getAll(): Promise<{ success: boolean; data?: Bill[]; error?: string }> {
    try {
      const res = await fetch(`${API_URL}`, {
        cache: 'no-store',
        headers: getAuth()
      });
      return await res.json();
    } catch (error) {
      return { success: false, error: "Connection failed" };
    }
  },
  /** Fetch a repair bill */
  async getByRepairId(repairId: string | number): Promise<{ success: boolean; data?: Bill; error?: string }> {
    try {
      const res = await fetch(`${API_URL}/repair/${repairId}`, { 
        cache: 'no-store',
        headers: getAuth()
      });
      return await res.json();
    } catch (error) {
      return { success: false, error: "Connection failed" };
    }
  },

  /** Save or update a repair bill (with optional tax data) */
  async saveBill(repairId: string | number, data: { 
    items: BillItem[]; 
    service_charge: number;
    tax_snapshot?: TaxSnapshotItem[];
    tax_total?: number;
  }): Promise<{ success: boolean; data?: Bill; error?: string }> {
    try {
      const res = await fetch(`${API_URL}/repair/${repairId}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...getAuth() as any
        },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (error) {
      return { success: false, error: "Save failed" };
    }
  },

  /** Delete a bill by ID */
  async delete(id: string | number): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${API_URL}/${id}`, { 
        method: "DELETE",
        headers: getAuth()
      });
      return await res.json();
    } catch (error) {
      return { success: false, error: "Network error" };
    }
  }
};
