import { apiService } from './api.service';

export const vehicleService = {
  getAll: async (status) => {
    const query = status ? `?status=${status}` : '';
    return apiService.get(`/vehicles${query}`);
  },
  getById: async (id) => {
    return apiService.get(`/vehicles/${id}`);
  },
  getByNumber: async (vNumber) => {
    return apiService.get(`/vehicles/number/${encodeURIComponent(vNumber)}`);
  },
  create: async (data) => {
    if (data instanceof FormData) {
      return apiService.postMultipart('/vehicles', data);
    }
    return apiService.post('/vehicles', data);
  },
  update: async (id, data) => {
    if (data instanceof FormData) {
      return apiService.putMultipart(`/vehicles/${id}`, data);
    }
    return apiService.put(`/vehicles/${id}`, data);
  },
  delete: async (id) => {
    return apiService.delete(`/vehicles/${id}`);
  }
};
