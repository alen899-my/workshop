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
  model_name?: string;
  vehicle_type?: string;
  owner_name?: string;
  phone_number?: string;
  complaints?: any; // JSON array of objects
  repair_date?: string;
  attending_worker_id?: number;
  submitted_by_id?: number;
  status: string;
  service_type: string;
  created_at: string;
  shop_name?: string;
  attending_worker_name?: string;
  submitted_by_name?: string;
  bill_id?: number | null;
  payment_status?: string | null;
}

export const repairService = {
  /** Fetch all repairs (optional status filter: Active/Inactive, and dynamic filters) */
  async getAll(filters?: Record<string, string>): Promise<{ success: boolean; data: Repair[]; error?: string }> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, val]) => {
          if (val) params.append(key, val);
        });
      }
      
      const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
      const res = await fetch(url, { 
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

  /** Fetch dashboard summary stats */
  async getSummaryStats(): Promise<{ success: boolean; data: { totalRepairs: number; pendingRepairs: number; totalRevenue: number; recentRepairs: Repair[]; avgCompletionHours: string; workers: {id: number; name: string; role: string; active_jobs: number}[] }; error?: string }> {
    try {
      const res = await fetch(`${API_URL}/stats/summary`, {
        cache: 'no-store',
        headers: getAuth()
      });
      return await res.json();
    } catch (error) {
      return { success: false, data: { totalRepairs: 0, pendingRepairs: 0, totalRevenue: 0, recentRepairs: [], avgCompletionHours: "0", workers: [] }, error: "Stats fetch failed" };
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
