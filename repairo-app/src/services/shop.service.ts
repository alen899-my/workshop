import { api } from './api';
import type { Shop } from '@/types';

export const shopService = {
  async getById(id: number) {
    return api.get<Shop>(`/shops/${id}`);
  },

  async update(id: number, data: Partial<Shop>) {
    return api.put<Shop>(`/shops/${id}`, data);
  },
};
