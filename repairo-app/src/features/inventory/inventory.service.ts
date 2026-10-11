import ENV from '@/config/env';
import { getStoredToken } from '@/services/api';

export interface Product {
  id: number; shop_id: number; sku: string; name: string; category: string; unit: string; location: string;
  cost_price: number; selling_price: number; stock: number; reorder_level: number; is_active: boolean; version: number;
}
export interface Movement {
  id: string; quantity: number; balance_after: number; kind: string; reason: string;
  repair_id?: number; actor_name?: string; created_at: string;
}
export interface InventoryShop { id: number; name: string; currency: string }
type Result<T> = { success: boolean; data?: T; error?: string; has_more?: boolean };
async function request<T>(path: string, method = 'GET', body?: unknown): Promise<Result<T>> {
  try {
    const token = await getStoredToken();
    const response = await fetch(ENV.API_URL + '/inventory' + path, {
      method, headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const result = await response.json();
    return response.ok ? result : { success: false, error: result.error || 'Inventory request failed' };
  } catch { return { success: false, error: 'Could not connect. Please try again.' }; }
}
export const inventoryService = {
  shops: () => request<InventoryShop[]>('/shops'),
  list: (shopId: number, search = '', filter = 'active', offset = 0) => request<Product[]>('?' + new URLSearchParams({
    shop_id: String(shopId), search, archived: String(filter === 'archived'), low_stock: String(filter === 'low'), offset: String(offset),
  })),
  save: (data: Record<string, unknown>, id?: number) => request<Product>(id ? '/' + id : '', id ? 'PUT' : 'POST', data),
  stock: (id: number, data: Record<string, unknown>) => request<Product>('/' + id + '/stock', 'POST', data),
  history: (id: number, shopId: number, before?: string) => request<Movement[]>('/' + id + '/movements?' + new URLSearchParams({
    shop_id: String(shopId), ...(before ? { before } : {}),
  })),
};
