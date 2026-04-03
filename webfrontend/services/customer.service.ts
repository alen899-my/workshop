const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/customers`;

const getAuth = (): HeadersInit => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem("workshop_token");
  return token ? { "Authorization": `Bearer ${token}` } : {};
};

export interface Customer {
  id: number;
  shop_id: number;
  name: string;
  phone: string;
  shop_name?: string;
  vehicle_count?: number;
  vehicles?: any[];
  status?: string;
  created_at: string;
}

export const customerService = {
  async getAll(status?: string): Promise<{ success: boolean; data: Customer[]; error?: string }> {
    try {
      const url = status ? `${API_URL}?status=${status}` : API_URL;
      const res = await fetch(url, { headers: getAuth(), cache: 'no-store' });
      return await res.json();
    } catch (error) {
      return { success: false, data: [], error: "Connection failed" };
    }
  },

  async getById(id: string | number): Promise<{ success: boolean; data?: Customer; error?: string }> {
    try {
      const res = await fetch(`${API_URL}/${id}`, { headers: getAuth(), cache: 'no-store' });
      return await res.json();
    } catch (error) {
      return { success: false, error: "Connection failed" };
    }
  },

  async create(data: Partial<Customer>): Promise<{ success: boolean; data?: Customer; error?: string }> {
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

  async update(id: string | number, data: Partial<Customer>): Promise<{ success: boolean; data?: Customer; error?: string }> {
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
