import { apiService } from './api.service';

export const repairService = {
  getAll: (filters) => {
    let q = '';
    if (filters) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const str = params.toString();
      if (str) q = `?${str}`;
    }
    return apiService.get(`/repairs${q}`);
  },
  getById: (id) => apiService.get(`/repairs/${id}`),
  create: (formData) => apiService.postMultipart('/repairs', formData),
  update: (id, formData) => apiService.putMultipart(`/repairs/${id}`, formData),
  delete: (id) => apiService.delete(`/repairs/${id}`),
  getSummaryStats: () => apiService.get('/repairs/stats/summary'),
};

export const billService = {
  getByRepairId: (repairId) => apiService.get(`/bills/repair/${repairId}`),
  saveBill: (repairId, billData) => apiService.post(`/bills/repair/${repairId}`, billData),
};
