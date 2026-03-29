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
  owner_name: string;
  created_at: string;
}

export const shopService = {
  /** Fetch all workshops */
  async getAll(): Promise<{ success: boolean; data: Shop[]; error?: string }> {
    try {
      const res = await fetch(API_URL, { 
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
  async create(data: Partial<Shop>): Promise<{ success: boolean; data?: Shop; error?: string }> {
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
      return { success: false, error: "Registration failed" };
    }
  },

  /** Update workshop profile */
  async update(id: string | number, data: Partial<Shop>): Promise<{ success: boolean; data?: Shop; error?: string }> {
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
  }
};
