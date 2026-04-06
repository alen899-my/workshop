const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/users`;

const getAuth = (): HeadersInit => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem("workshop_token");
  return token ? { "Authorization": `Bearer ${token}` } : {};
};

export interface User {
  id: number;
  shop_id: number;
  name: string;
  phone: string;
  email?: string;
  role: string;
  status?: string;
  profile_image?: string;
  created_at: string;
}

export const userService = {
  /** Fetch all team members (optional status filter: Active/Inactive) */
  async getAll(status?: string, shopId?: number): Promise<{ success: boolean; data: User[]; error?: string }> {
    try {
      let url = API_URL;
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (shopId) params.append('shopId', shopId.toString());
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await fetch(url, { 
        cache: 'no-store',
        headers: getAuth()
      });
      return await res.json();
    } catch (error) {
      return { success: false, data: [], error: "Connection failed" };
    }
  },

  /** Fetch single profile */
  async getById(id: string | number): Promise<{ success: boolean; data?: User; error?: string }> {
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

  /** Create team member */
  async create(data: FormData | Partial<User> & { password?: string }): Promise<{ success: boolean; data?: User; error?: string }> {
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

  /** Update profile */
  async update(id: string | number, data: FormData | Partial<User>): Promise<{ success: boolean; data?: User; error?: string }> {
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

  /** Remove member */
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
  }
};
