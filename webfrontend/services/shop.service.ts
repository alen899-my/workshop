const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/shops`;

/** Helper to get auth header safely */
const getAuth = (): HeadersInit => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem("workshop_token");
  return token ? { "Authorization": `Bearer ${token}` } : {};
};

export interface Shop {
  id: number;
  name: string;
  location: string;
  address?: string;
  state?: string;
  city?: string;
  owner_name: string;
  phone?: string;
  owner_phone?: string;
  shop_image?: string;
  country?: string;
  currency?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
  place_id?: string;
  operating_hours?: any;
  services_offered?: string[];
  created_at: string;
}

export const shopService = {
  /** Fetch all workshops (optional status filter: Active/Inactive) */
  async getAll(status?: string): Promise<{ success: boolean; data: Shop[]; error?: string }> {
    try {
      const url = status ? `${API_URL}?status=${status}` : API_URL;
      const res = await fetch(url, { 
        cache: 'no-store',
        headers: getAuth()
      });
      return await res.json();
    } catch (error) {
      return { success: false, data: [], error: "Connection failed" };
    }
  },

  /** Fetch single shop details */
  async getById(id: string | number): Promise<{ success: boolean; data?: Shop; error?: string }> {
    try {
      const res = await fetch(`${API_URL}/${id}`, { 
        cache: 'no-store',
        headers: getAuth()
      });
      return await res.json();
    } catch (error) {
      return { success: false, error: "Connection failed" };
    }
  },

  /** Register new shop */
  async create(data: FormData | Partial<Shop>): Promise<{ success: boolean; data?: Shop; error?: string }> {
    try {
      const isFormData = data instanceof FormData;
      const res = await fetch(API_URL, {
        method: "POST",
        headers: isFormData ? getAuth() : { "Content-Type": "application/json", ...getAuth() as any },
        body: isFormData ? (data as any) : JSON.stringify(data),
      });
      return await res.json();
    } catch (error) {
      return { success: false, error: "Registration failed" };
    }
  },

  /** Update workshop profile */
  async update(id: string | number, data: FormData | Partial<Shop>): Promise<{ success: boolean; data?: Shop; error?: string }> {
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

  /** Remove workshop */
  async delete(id: string | number): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${API_URL}/${id}`, { 
        method: "DELETE",
        headers: getAuth()
      });
      return await res.json();
    } catch (error) {
      return { success: false, error: "Deletion failed" };
    }
  },

  /** Public search — no auth needed (landing page finder) */
  async search(location: string, service: string, state?: string, city?: string): Promise<{ success: boolean; data: Shop[]; error?: string }> {
    try {
      const params = new URLSearchParams({ status: "Active" });
      if (location.trim()) params.set("location", location.trim());
      if (service.trim()) params.set("service", service.trim());
      if (state) params.set("state", state);
      if (city) params.set("city", city);
      const res = await fetch(`${API_URL}/public?${params.toString()}`, { cache: "no-store" });
      return await res.json();
    } catch {
      return { success: false, data: [], error: "Search failed" };
    }
  }
};
