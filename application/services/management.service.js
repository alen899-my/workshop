import { apiService } from './api.service';

export const userService = {
  getAll: () => apiService.get('/users'),
  getById: (id) => apiService.get(`/users/${id}`),
  create: (data) => apiService.post('/users', data),
  update: (id, data) => apiService.put(`/users/${id}`, data),
  delete: (id) => apiService.delete(`/users/${id}`),
};

export const shopService = {
  getAll: () => apiService.get('/shops'),
  getById: (id) => apiService.get(`/shops/${id}`),
  create: (data) => apiService.post('/shops', data),
  update: (id, data) => apiService.put(`/shops/${id}`, data),
  delete: (id) => apiService.delete(`/shops/${id}`),
};

export const roleService = {
  getAll: () => apiService.get('/roles'),
  getById: (id) => apiService.get(`/roles/${id}`),
  create: (data) => apiService.post('/roles', data),
  update: (id, data) => apiService.put(`/roles/${id}`, data),
  delete: (id) => apiService.delete(`/roles/${id}`),
};

export const permissionService = {
  getAll: () => apiService.get('/permissions'),
  getById: (id) => apiService.get(`/permissions/${id}`),
  create: (data) => apiService.post('/permissions', data),
  update: (id, data) => apiService.put(`/permissions/${id}`, data),
  delete: (id) => apiService.delete(`/permissions/${id}`),
  getRolePermissions: (roleSlug) => apiService.get(`/permissions/role/${roleSlug}`),
};
