import { apiService } from './api.service';

export const customerService = {
  getAll: async () => {
    return apiService.get('/customers');
  },
  getById: async (id) => {
    return apiService.get(`/customers/${id}`);
  },
  create: async (data) => {
    return apiService.post('/customers', data);
  },
  update: async (id, data) => {
    return apiService.put(`/customers/${id}`, data);
  },
  delete: async (id) => {
    return apiService.delete(`/customers/${id}`);
  }
};
