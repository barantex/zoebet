export const API_URL = import.meta.env.VITE_API_URL || '/api';

export function getAuthToken() {
  return localStorage.getItem('zoe.token');
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data: any = {};
  try {
    if (text) data = JSON.parse(text);
  } catch {
    // non-JSON response
    if (!response.ok) throw new Error(`Sunucu hatası: ${response.status}`);
    return text;
  }

  if (!response.ok) {
    const error: any = new Error(data.error || data.message || `API Hatası: ${response.status}`)
    error.unverified = data.unverified
    error.phone = data.phone
    throw error
  }

  return data;
}
