import { getStoredToken } from './api';
import ENV from '@/config/env';

export const uploadService = {
  async uploadImage(uri: string, fileName?: string | null, mimeType?: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const token = await getStoredToken();
      const fd = new FormData();
      const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const name = fileName || `upload_${Date.now()}.${ext}`;
      const type = mimeType || `image/${ext === 'png' ? 'png' : ext === 'webp' ? 'webp' : 'jpeg'}`;
      fd.append('image', { uri, name, type } as any);

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${ENV.API_URL}/upload`, {
        method: 'POST',
        headers,
        body: fd,
      });
      const data = await res.json();
      return data;
    } catch {
      return { success: false, error: 'Upload failed' };
    }
  },
};
