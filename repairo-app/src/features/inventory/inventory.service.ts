import { Platform } from 'react-native';
import type { ImagePickerAsset } from 'expo-image-picker';
import ENV from '@/config/env';
import { getStoredToken } from '@/services/api';

export interface Product {
  id: number; shop_id: number; sku: string; name: string; category: string; unit: string; location: string;
  cost_price: number; selling_price: number; stock: number; reorder_level: number; is_active: boolean; version: number;
  image_url?: string | null;
  tax_id?: number | null; tax_name?: string | null; tax_rate?: number | null; tax_inclusive?: boolean | null;
}
export interface Movement {
  id: string; quantity: number; balance_after: number; kind: string; reason: string;
  repair_id?: number; actor_name?: string; created_at: string;
}
export interface InventoryShop { id: number; name: string; currency: string }
type Result<T> = { success: boolean; data?: T; error?: string; has_more?: boolean };
const cache = new Map<string, { expires: number; value: Result<unknown> }>();
const pending = new Map<string, Promise<Result<unknown>>>();
let generation = 0;
function invalidate() { generation++; cache.clear(); pending.clear(); }
async function request<T>(path: string, method = 'GET', body?: unknown): Promise<Result<T>> {
  try {
    const token = await getStoredToken();
    const cacheable = method === 'GET' && (path === '/shops' || path.startsWith('?'));
    const key = token + ':' + path;
    const cached = cache.get(key);
    if (cacheable && cached && cached.expires > Date.now()) return cached.value as Result<T>;
    if (cacheable && pending.has(key)) return await pending.get(key)! as Result<T>;
    const currentGeneration = generation;
    const operation = (async (): Promise<Result<T>> => {
    const response = await fetch(ENV.API_URL + '/inventory' + path, {
      method, headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const result = await response.json();
    const value = response.ok ? result : { success: false, error: result.error || 'Inventory request failed' };
    if (value.success && method !== 'GET') invalidate();
    if (cacheable && value.success && currentGeneration === generation) {
      if (cache.size >= 30) cache.delete(cache.keys().next().value!);
      cache.set(key, { expires: Date.now() + 15000, value });
    }
    return value;
    })();
    if (cacheable) pending.set(key, operation);
    try { return await operation; }
    finally { if (pending.get(key) === operation) pending.delete(key); }
  } catch { return { success: false, error: 'Could not connect. Please try again.' }; }
}
export const inventoryService = {
  invalidate,
  shops: () => request<InventoryShop[]>('/shops'),
  list: (shopId: number, search = '', filter = 'active', offset = 0) => request<Product[]>('?' + new URLSearchParams({
    shop_id: String(shopId), search, archived: String(filter === 'archived'), low_stock: String(filter === 'low'), offset: String(offset),
  })),
  save: (data: Record<string, unknown>, id?: number) => request<Product>(id ? '/' + id : '', id ? 'PUT' : 'POST', data),
  stock: (id: number, data: Record<string, unknown>) => request<Product>('/' + id + '/stock', 'POST', data),
  history: (id: number, shopId: number, before?: string) => request<Movement[]>('/' + id + '/movements?' + new URLSearchParams({
    shop_id: String(shopId), ...(before ? { before } : {}),
  })),
  image: (id: number, shopId: number, asset: ImagePickerAsset) => uploadImage<Product>(id, shopId, asset),
  removeImage: (id: number, shopId: number) => uploadImage<Product>(id, shopId),
};

async function uploadImage<T>(id: number, shopId: number, asset?: ImagePickerAsset): Promise<Result<T>> {
  try {
    const token = await getStoredToken();
    const form = new FormData();
    form.append('shop_id', String(shopId));
    if (asset) {
      const ext = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
      const name = asset.fileName || `product_${id}.${ext}`;
      const type = asset.mimeType || `image/${ext === 'png' ? 'png' : ext === 'webp' ? 'webp' : 'jpeg'}`;
      if (Platform.OS === 'web') {
        form.append('image', await (await fetch(asset.uri)).blob(), name);
      } else {
        form.append('image', { uri: asset.uri, name, type } as unknown as Blob);
      }
    } else {
      form.append('remove', 'true');
    }
    const response = await fetch(ENV.API_URL + '/inventory/' + id + '/image', {
      method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: form,
    });
    const result = await response.json();
    if (response.ok && result.success) invalidate();
    return response.ok ? result : { success: false, error: result.error || 'Photo upload failed' };
  } catch { return { success: false, error: 'Could not connect. Please try again.' }; }
}
