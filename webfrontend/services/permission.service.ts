const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/permissions`;

const getAuth = (): HeadersInit => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem("workshop_token");
  return token ? { "Authorization": `Bearer ${token}` } : {};
};

export interface Permission {
  id: number;
  module_name: string;
  permission_name: string;
  slug: string;
  description: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at?: string;
}

export const permissionService = {
  /** Fetch all permissions */
  async getAll(): Promise<{ success: boolean; data: Permission[]; error?: string }> {
    try {
      const res = await fetch(API_URL, { 
        cache: 'no-store',
        headers: getAuth()
      });
      return await res.json();
    } catch (error) {
      return { success: false, data: [], error: "Server connection failed" };
    }
  },

  /** Fetch single permission */
  async getById(id: string | number): Promise<{ success: boolean; data?: Permission; error?: string }> {
    try {
      const res = await fetch(`${API_URL}/${id}`, { 
        cache: 'no-store',
        headers: getAuth()
      });
      return await res.json();
    } catch (error) {
      return { success: false, error: "Server connection failed" };
    }
  },

  /** Create new permissions (Bulk) */
  async create(payload: { module_name: string; items: any[] }): Promise<{ success: boolean; data?: Permission[]; error?: string }> {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...getAuth() as any
        },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (error) {
      return { success: false, error: "Network error" };
    }
  },

  /** Update permission */
  async update(id: string | number, data: Partial<Permission>): Promise<{ success: boolean; data?: Permission; error?: string }> {
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
      return { success: false, error: "Network error" };
    }
  },

  /** Delete permission */
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
  },

  /** Fetch authorized slugs by role name */
  async getRolePermissions(role: string): Promise<{ success: boolean; data?: string[]; error?: string }> {
    try {
      const res = await fetch(`${API_URL}/role/${role}`, { 
        cache: 'no-store',
        headers: getAuth()
      });
      return await res.json();
    } catch (error) {
      return { success: false, error: "Network error fetching role perms" };
    }
  }
};
