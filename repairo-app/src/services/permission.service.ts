import ENV from '@/config/env';
import { api, getStoredToken } from './api';

export interface UserPermissionsResponse {
  role_permissions: string[];
  additional_permissions: string[];
  excluded_permissions: string[];
  effective_permissions: string[];
}

export const permissionService = {
  async getRolePermissions(role: string): Promise<{ success: boolean; data?: string[]; error?: string }> {
    return api.get(`/permissions/role/${role}`);
  },

  async getUserPermissions(userId: number): Promise<{ success: boolean; data?: UserPermissionsResponse; error?: string }> {
    try {
      const token = await getStoredToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${ENV.API_URL}/permissions/user/${userId}`, { headers });
      return await res.json();
    } catch {
      return { success: false, error: 'Connection failed' };
    }
  },
};
