const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/roles`;

const getAuth = (): HeadersInit => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem("workshop_token");
  return token ? { "Authorization": `Bearer ${token}` } : {};
};

export interface Role {
  id: number;
  name: string;
  slug: string;
  description: string;
  status: "active" | "inactive";
  permissions?: string[];
  created_at: string;
}

export const roleService = {
  /** Fetch all roles */
  async getAll(): Promise<{ success: boolean; data: Role[]; error?: string }> {
    try {
      const res = await fetch(API_URL, { 
        cache: 'no-store',
        headers: getAuth()
      });
      return await res.json();
    } catch (error) {
      return { success: false, data: [], error: "Connection error" };
    }
  },

  /** Fetch single role with permissions */
  async getById(id: string | number): Promise<{ success: boolean; data?: Role; error?: string }> {
    try {
      const res = await fetch(`${API_URL}/${id}`, { 
        cache: 'no-store',
        headers: getAuth()
      });
      return await res.json();
    } catch (error) {
      return { success: false, error: "Connection error" };
    }
  },

  /** Create role */
  async create(data: Partial<Role>): Promise<{ success: boolean; data?: Role; error?: string }> {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...getAuth() as any
        },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (error) {
      return { success: false, error: "Mutation failed" };
    }
  },

  /** Update role */
  async update(id: string | number, data: Partial<Role>): Promise<{ success: boolean; data?: Role; error?: string }> {
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
      return { success: false, error: "Mutation failed" };
    }
  },

  /** Delete role */
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
