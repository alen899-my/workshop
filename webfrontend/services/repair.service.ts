const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/repairs`;

const getAuth = (): HeadersInit => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem("workshop_token");
  return token ? { "Authorization": `Bearer ${token}` } : {};
};

export interface Repair {
  id: number;
  shop_id: number;
  vehicle_image?: string;
  vehicle_number: string;
  owner_name?: string;
  phone_number?: string;
  complaints?: string;
  repair_date?: string;
  attending_worker_id?: number;
  submitted_by_id?: number;
  status: string;
  service_type: string;
  created_at: string;
  shop_name?: string;
  attending_worker_name?: string;
  submitted_by_name?: string;
}

export const repairService = {
  /** Fetch all repairs */
  async getAll(): Promise<{ success: boolean; data: Repair[]; error?: string }> {
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

  /** Fetch single repair */
  async getById(id: string | number): Promise<{ success: boolean; data?: Repair; error?: string }> {
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

  /** Create repair */
  async create(data: FormData): Promise<{ success: boolean; data?: Repair; error?: string }> {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: getAuth(),
        body: data, // Using FormData for file upload
      });
      return await res.json();
    } catch (error) {
      return { success: false, error: "Creation failed" };
    }
  },

  /** Update repair */
  async update(id: string | number, data: FormData): Promise<{ success: boolean; data?: Repair; error?: string }> {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: getAuth(),
        body: data,
      });
      return await res.json();
    } catch (error) {
      return { success: false, error: "Update failed" };
    }
  },

  /** Delete repair */
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
