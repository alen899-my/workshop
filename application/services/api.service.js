import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../api';

async function getHeaders() {
  const token = await AsyncStorage.getItem('workshop_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(method, path, body) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || data.message || 'Request failed' };
    return { success: true, data: data.data ?? data };
  } catch (e) {
    return { success: false, error: 'Network error. Check your connection.' };
  }
}

async function requestMultipart(method, path, formData) {
  try {
    const token = await AsyncStorage.getItem('workshop_token');
    const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    
    // Do NOT set Content-Type header manually for multipart/form-data. fetch automatically sets the boundary
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: formData,
    });
    
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || data.message || 'Request failed' };
    return { success: true, data: data.data ?? data };
  } catch (e) {
    return { success: false, error: 'Network error during upload.' };
  }
}

export const apiService = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  delete: (path) => request('DELETE', path),
  postMultipart: (path, formData) => requestMultipart('POST', path, formData),
  putMultipart: (path, formData) => requestMultipart('PUT', path, formData),
};
