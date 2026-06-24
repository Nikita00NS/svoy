const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.svoy.local/api';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  get: (url: string) => apiFetch(url),
  post: (url: string, body?: any) => apiFetch(url, { method: 'POST', body: JSON.stringify(body) }),
  patch: (url: string, body?: any) => apiFetch(url, { method: 'PATCH', body: JSON.stringify(body) }),
};
