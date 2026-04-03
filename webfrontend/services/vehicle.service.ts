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
  status?: string;
  created_at: string;
}

export const vehicleService = {
  async getAll(status?: string): Promise<{ success: boolean; data: Vehicle[]; error?: string }> {
    try {
      const url = status ? `${API_URL}?status=${status}` : API_URL;
      const res = await fetch(url, { headers: getAuth(), cache: 'no-store' });
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
  
  async getByNumber(vNumber: string): Promise<{ success: boolean; data?: Vehicle; error?: string }> {
    try {
      const res = await fetch(`${API_URL}/number/${encodeURIComponent(vNumber)}`, { headers: getAuth(), cache: 'no-store' });
      return await res.json();
    } catch (error) {
      return { success: false, error: "Connection failed" };
    }
  },

  async create(data: FormData | Partial<Vehicle>): Promise<{ success: boolean; data?: Vehicle; error?: string }> {
    try {
      const isFormData = data instanceof FormData;
      const res = await fetch(API_URL, {
        method: "POST",
        headers: isFormData ? getAuth() : { "Content-Type": "application/json", ...getAuth() as any },
        body: isFormData ? (data as any) : JSON.stringify(data),
      });
      return await res.json();
    } catch (error) {
      return { success: false, error: "Creation failed" };
    }
  },

  async update(id: string | number, data: FormData | Partial<Vehicle>): Promise<{ success: boolean; data?: Vehicle; error?: string }> {
    try {
      const isFormData = data instanceof FormData;
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: isFormData ? getAuth() : { "Content-Type": "application/json", ...getAuth() as any },
        body: isFormData ? (data as any) : JSON.stringify(data),
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
