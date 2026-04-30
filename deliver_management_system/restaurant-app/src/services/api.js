/**
 * restaurant-app/src/services/api.js
 * Real AWS API Gateway — custom Lambda auth (no Cognito).
 */

const BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

const getToken = () => localStorage.getItem('sq_token');

const request = async (method, path, body) => {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? json.message ?? `Request failed (${res.status})`);
  return json.data ?? json;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const registerRestaurant = (data) => request('POST', '/register', data);
export const loginRestaurant    = (email, password) => request('POST', '/login', { email, password });

// ─── Orders ──────────────────────────────────────────────────────────────────

export const fetchOrders = async (restaurantId) => {
  const qs = restaurantId ? `?restaurantId=${encodeURIComponent(restaurantId)}` : '';
  const data = await request('GET', `/getOrders${qs}`);
  const list = Array.isArray(data) ? data : (data.orders ?? []);
  return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const updateOrder = (id, status) => request('PATCH', `/updateOrder/${id}`, { status });

// ─── Restaurant ───────────────────────────────────────────────────────────────

export const updateRestaurant = (restaurantId, data) =>
  request('PATCH', `/restaurants/${restaurantId}`, data);

export const deleteRestaurant = async (restaurantId, masterKey) => {
  const token = getToken();
  const res = await fetch(`${BASE}/restaurants/${encodeURIComponent(restaurantId)}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-master-key': masterKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? json.message ?? `Request failed (${res.status})`);
  return json.data ?? json;
};

export const getAllRestaurants = async () => {
  const data = await request('GET', '/restaurants');
  return Array.isArray(data) ? data : (data.restaurants ?? []);
};
