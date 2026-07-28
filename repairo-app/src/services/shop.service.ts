import { getStoredToken } from './api';
import type { Shop } from '@/types';
import ENV from '@/config/env';

export const shopService = {
  async getById(id: number) {
    try {
      const token = await getStoredToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${ENV.API_URL}/shops/${id}`, { headers });
      return await res.json() as { success: boolean; data?: Shop; error?: string };
    } catch {
      return { success: false, error: 'Connection failed' };
    }
  },

  async update(id: number, data: Record<string, unknown>) {
    try {
      const token = await getStoredToken();
      const hasFile = Object.values(data).some((v) => v && typeof v === 'object' && (v as any).uri);
      const headers: Record<string, string> = {};

      if (hasFile) {
        const fd = new FormData();
        for (const [key, value] of Object.entries(data)) {
          if (value && typeof value === 'object' && (value as any).uri) {
            const file = value as any;
            const ext = file.uri.split('.').pop()?.toLowerCase() || 'jpg';
            const name = file.fileName || `shop_${Date.now()}.${ext}`;
            const type = file.mimeType || `image/${ext === 'png' ? 'png' : ext === 'webp' ? 'webp' : 'jpeg'}`;
            fd.append(key, { uri: file.uri, name, type } as any);
          } else if (value !== undefined) {
            fd.append(key, String(value));
          }
        }
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return await new Promise<{ success: boolean; data?: Shop; error?: string }>((resolve) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', `${ENV.API_URL}/shops/${id}`);
          if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          xhr.onload = () => {
            try { resolve(JSON.parse(xhr.responseText)); }
            catch { resolve({ success: false, error: 'Invalid response' }); }
          };
          xhr.onerror = () => resolve({ success: false, error: 'Network error' });
          xhr.send(fd);
        });
      }

      headers['Content-Type'] = 'application/json';
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${ENV.API_URL}/shops/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      return await res.json() as { success: boolean; data?: Shop; error?: string };
    } catch {
      return { success: false, error: 'Connection failed' };
    }
  },
};
