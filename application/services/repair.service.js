import { apiService } from './api.service';

export const repairService = {
  getAll: () => apiService.get('/repairs'),
  getById: (id) => apiService.get(`/repairs/${id}`),
  create: (formData) => apiService.postMultipart('/repairs', formData),
  update: (id, formData) => apiService.putMultipart(`/repairs/${id}`, formData),
  delete: (id) => apiService.delete(`/repairs/${id}`),
};

export const billService = {
  getByRepairId: (repairId) => apiService.get(`/bills/repair/${repairId}`),
  saveBill: (repairId, billData) => apiService.post(`/bills/repair/${repairId}`, billData),
};
