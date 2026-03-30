const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/vehicles`;

const getAuth = (): HeadersInit => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem("workshop_token");
  return token ? { "Authorization": `Bearer ${token}` } : {};
};

export interface Vehicle {
  id: number;
  customer_id: number;
  shop_id: number;
  vehicle_number: string;
  model_name: string;
  vehicle_type: string;
  vehicle_image?: string;
  owner_name?: string;
  owner_phone?: string;
  shop_name?: string;
  repairs?: any[];
  created_at: string;
}

export const vehicleService = {
  async getAll(): Promise<{ success: boolean; data: Vehicle[]; error?: string }> {
    try {
      const res = await fetch(API_URL, { headers: getAuth(), cache: 'no-store' });
      return await res.json();
    } catch (error) {
      return { success: false, data: [], error: "Connection failed" };
    }
  },

  async getById(id: string | number): Promise<{ success: boolean; data?: Vehicle; error?: string }> {
    try {
      const res = await fetch(`${API_URL}/${id}`, { headers: getAuth(), cache: 'no-store' });
      return await res.json();
    } catch (error) {
      return { success: false, error: "Connection failed" };
    }
  },

  async create(data: Partial<Vehicle>): Promise<{ success: boolean; data?: Vehicle; error?: string }> {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuth() as any },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (error) {
      return { success: false, error: "Creation failed" };
    }
  },

  async update(id: string | number, data: Partial<Vehicle>): Promise<{ success: boolean; data?: Vehicle; error?: string }> {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuth() as any },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (error) {
      return { success: false, error: "Update failed" };
    }
  },

  async delete(id: string | number): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE", headers: getAuth() });
      return await res.json();
    } catch (error) {
      return { success: false, error: "Deletion failed" };
    }
  }
};
