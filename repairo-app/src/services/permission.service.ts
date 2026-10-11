import { api } from './api';

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
    return api.get<UserPermissionsResponse>(`/permissions/user/${userId}`);
  },
};
