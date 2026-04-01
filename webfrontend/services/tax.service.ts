const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/taxes`;

const getAuth = (): HeadersInit => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem("workshop_token");
  return token ? { "Authorization": `Bearer ${token}` } : {};
};

export interface TaxSetting {
  id: number;
  shop_id: number;
  shop_name?: string;
  name: string;
  rate: number;
  description?: string;
  is_active: boolean;
  is_inclusive: boolean;  // true = tax included in price (UK/EU), false = added on top (US/India)
  applies_to: 'all' | 'parts' | 'service';
  created_at: string;
  updated_at: string;
}

export const taxService = {
  async getAll(): Promise<{ success: boolean; data: TaxSetting[]; error?: string }> {
    try {
      const res = await fetch(API_URL, { headers: getAuth(), cache: 'no-store' });
      return await res.json();
    } catch {
      return { success: false, data: [], error: "Connection failed" };
    }
  },

  async create(data: Partial<TaxSetting>): Promise<{ success: boolean; data?: TaxSetting; error?: string }> {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuth() as any },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch {
      return { success: false, error: "Creation failed" };
    }
  },

  async update(id: number, data: Partial<TaxSetting>): Promise<{ success: boolean; data?: TaxSetting; error?: string }> {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuth() as any },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch {
      return { success: false, error: "Update failed" };
    }
  },

  async delete(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE", headers: getAuth() });
      return await res.json();
    } catch {
      return { success: false, error: "Deletion failed" };
    }
  },

  // Helper: compute tax amounts for a given subtotal using active tax settings
  computeTaxes(taxSettings: TaxSetting[], partsSubtotal: number, serviceCharge: number): {
    taxSnapshot: Array<{ id: number; name: string; rate: number; amount: number; is_inclusive: boolean; applies_to: string }>;
    taxTotal: number;
  } {
    const activeTaxes = taxSettings.filter(t => t.is_active);
    let taxTotal = 0;
    const taxSnapshot = activeTaxes.map(tax => {
      let base = 0;
      if (tax.applies_to === 'all') base = partsSubtotal + serviceCharge;
      else if (tax.applies_to === 'parts') base = partsSubtotal;
      else if (tax.applies_to === 'service') base = serviceCharge;

      let amount = 0;
      if (tax.is_inclusive) {
        // Inclusive: tax is already IN the base price. Extract it.
        amount = base - (base / (1 + tax.rate / 100));
      } else {
        // Exclusive: tax is added ON TOP
        amount = base * (tax.rate / 100);
      }
      amount = Math.round(amount * 100) / 100;
      taxTotal += amount;
      return { id: tax.id, name: tax.name, rate: tax.rate, amount, is_inclusive: tax.is_inclusive, applies_to: tax.applies_to };
    });
    return { taxSnapshot, taxTotal: Math.round(taxTotal * 100) / 100 };
  }
};
