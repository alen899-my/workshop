// Metro selects this module for web; native builds use storage.ts.
// Browser storage persists across reloads but is not encrypted SecureStore.
const fallback = new Map<string, string | null>();

export async function getItemAsync(key: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (fallback.has(key)) return fallback.get(key) ?? null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
    fallback.delete(key);
  } catch {
    // Keep the current session usable when browser storage is blocked.
    fallback.set(key, value);
  }
}

export async function deleteItemAsync(key: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
    fallback.delete(key);
  } catch {
    // Override any old persisted value for the remainder of this session.
    fallback.set(key, null);
  }
}