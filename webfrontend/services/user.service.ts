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
  role: string;
  status: "active" | "inactive";
  created_at: string;
}

export const userService = {
  /** Fetch all team members */
  async getAll(shopId?: number): Promise<{ success: boolean; data: User[]; error?: string }> {
    try {
      const url = shopId ? `${API_URL}?shopId=${shopId}` : API_URL;
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
  async create(data: Partial<User> & { password?: string }): Promise<{ success: boolean; data?: User; error?: string }> {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...getAuth() as any // Cast to any to handle the spread with Content-Type
        },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (error) {
      return { success: false, error: "Creation failed" };
    }
  },

  /** Update profile */
  async update(id: string | number, data: Partial<User>): Promise<{ success: boolean; data?: User; error?: string }> {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...getAuth() as any
        },
        body: JSON.stringify(data),
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
