/**
 * restaurant-app/src/services/api.js
 * Real AWS API Gateway client with JWT auth.
 * Falls back to mock when VITE_API_URL is not set.
 */

import * as mock from './mockApi';

const BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const USE_MOCK = !BASE;

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

/** POST /register → { token, restaurant } */
export const registerRestaurant = async (data) => {
  if (USE_MOCK) {
    // mock: just return a fake session
    return { token: 'mock-token', restaurant: { restaurantId: data.email, name: data.name, location: data.location ?? '', menu: [] } };
  }
  return request('POST', '/register', data);
};

/** POST /login → { token, restaurant } */
export const loginRestaurant = async (email, password) => {
  if (USE_MOCK) {
    if (email === 'admin@smartqueue.com' && password === 'admin123')
      return { token: 'mock-token', restaurant: { restaurantId: email, name: 'Demo Restaurant', menu: [] } };
    throw new Error('Invalid email or password');
  }
  return request('POST', '/login', { email, password });
};

// ─── Orders ───────────────────────────────────────────────────────────────────

/** GET /getOrders?restaurantId= → Order[] */
export const fetchOrders = async (restaurantId) => {
  if (USE_MOCK) return mock.fetchOrders();
  const qs = restaurantId ? `?restaurantId=${encodeURIComponent(restaurantId)}` : '';
  const data = await request('GET', `/getOrders${qs}`);
  const list = Array.isArray(data) ? data : (data.orders ?? []);
  return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

/** PATCH /updateOrder/{id} → Order */
export const updateOrder = async (id, status) => {
  if (USE_MOCK) return mock.updateOrder(id, status);
  return request('PATCH', `/updateOrder/${id}`, { status });
};

// ─── Restaurant ───────────────────────────────────────────────────────────────

/** PATCH /restaurants/{id} → restaurant */
export const updateRestaurant = async (restaurantId, data) => {
  if (USE_MOCK) return data;
  return request('PATCH', `/restaurants/${restaurantId}`, data);
};

/** DELETE /restaurants/{id} — master key required */
export const deleteRestaurant = async (restaurantId, masterKey) => {
  if (USE_MOCK) return { deleted: restaurantId };
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

/** GET /restaurants → all restaurants (for master panel) */
export const getAllRestaurants = async () => {
  if (USE_MOCK) return [];
  const data = await request('GET', '/restaurants');
  return Array.isArray(data) ? data : (data.restaurants ?? []);
};
