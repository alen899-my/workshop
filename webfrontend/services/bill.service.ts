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

export interface Bill {
  id?: number;
  repair_id: number;
  items: BillItem[];
  service_charge: number;
  total_amount: number;
}

export const billService = {
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

  /** Save or update a repair bill */
  async saveBill(repairId: string | number, data: { items: BillItem[], service_charge: number }): Promise<{ success: boolean; data?: Bill; error?: string }> {
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
  }
};
