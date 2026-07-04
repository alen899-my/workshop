import { api } from './api';

export const permissionService = {
  async getRolePermissions(role: string): Promise<{ success: boolean; data?: string[]; error?: string }> {
    return api.get(`/permissions/role/${role}`);
  },
};
