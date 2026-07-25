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
  operating_hours?: Record<string, { open: string; close: string; closed: boolean }>;
  services_offered?: string[];
  vehicle_types?: string[];
  is_public?: boolean;
  population?: string;
  created_at: string;
}

export interface User {
  id: number;
  shop_id: number;
  name: string;
  email: string;
  role: string;
  shop_name?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
