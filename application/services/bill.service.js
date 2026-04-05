import { apiService } from './api.service';

export const billService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.recordStatus) params.append('recordStatus', filters.recordStatus);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.payment_status) params.append('payment_status', filters.payment_status);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiService.get(`/bills${query}`);
  },
  getById: async (id) => {
    return apiService.get(`/bills/${id}`);
  },
  create: async (data) => {
    return apiService.post('/bills', data);
  },
  update: async (id, data) => {
    return apiService.put(`/bills/${id}`, data);
  },
  delete: async (id) => {
    return apiService.delete(`/bills/${id}`);
  }
};
