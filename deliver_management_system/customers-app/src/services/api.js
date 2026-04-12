/**
 * customer-app/src/services/api.js
 *
 * Real AWS API Gateway client.
 * Falls back to mock data when VITE_API_URL is not set (local dev without backend).
 *
 * To switch to real backend: set VITE_API_URL in .env
 * All functions return { data } to match the same shape as the old mockApi,
 * so zero changes are needed in components.
 */

import * as mock from './mockApi';

const BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const HAS_BACKEND = !!BASE;

// ─── HTTP helper ─────────────────────────────────────────────────────────────

const getAuthHeader = () => {
  const token = localStorage.getItem('biterush_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const request = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message ?? json.error ?? `Request failed (${res.status})`);
  return { data: json.data ?? json };
};

// ─── Restaurants — real API when backend configured, mock fallback ────────────

export const getRestaurants = async (params = {}) => {
  if (!HAS_BACKEND) return mock.getRestaurants(params);
  const res = await request('GET', '/restaurants');
  const list = Array.isArray(res.data) ? res.data : [];
  return {
    data: list.map(r => ({
      ...r,
      id:           r.restaurantId ?? r.id,
      image:        r.image        || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop',
      cuisine:      r.cuisine      || r.location || 'Restaurant',
      rating:       r.rating       != null ? Number(r.rating)       : 4.5,
      deliveryTime: r.deliveryTime || '30-40 min',
      deliveryFee:  r.deliveryFee  != null && r.deliveryFee !== '' ? Number(r.deliveryFee) : 29,
      offer:        r.offer        || '',
      isVeg:        r.isVeg        ?? false,
    })),
  };
};

export const searchRestaurants = (query) => mock.searchRestaurants(query); // local filter
export const getRestaurantById = async (id) => {
  if (!HAS_BACKEND || !id || !isNaN(Number(id))) return mock.getRestaurantById(id);
  try {
    const res = await fetch(`${BASE}/restaurants/${encodeURIComponent(id)}`);
    const json = await res.json();
    const r = json.data ?? json;
    // Normalize to match mock shape expected by Menu.jsx
    return { data: { ...r, id: r.restaurantId ?? r.id, image: r.image ?? 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop', rating: r.rating ?? 4.5, deliveryTime: r.deliveryTime ?? '30-40 min', deliveryFee: r.deliveryFee ?? 29, cuisine: r.cuisine || r.location || 'Restaurant', offer: r.offer ?? '', isVeg: r.isVeg ?? false } };
  } catch { return mock.getRestaurantById(id); }
};

export const getMenuByRestaurant = async (id) => {
  if (!HAS_BACKEND || !id) return mock.getMenuByRestaurant(id);
  // Numeric ids are mock restaurants — use mock data directly
  if (!isNaN(Number(id))) return mock.getMenuByRestaurant(id);
  try {
    const res = await fetch(`${BASE}/restaurants/${encodeURIComponent(id)}`);
    const json = await res.json();
    const restaurant = json.data ?? json;
    if (restaurant?.menu?.length) return { data: restaurant.menu };
    return { data: [] };
  } catch { return mock.getMenuByRestaurant(id); }
};

// ─── Auth — always mock ───────────────────────────────────────────────────────

export const loginUser = (credentials) => mock.loginUser(credentials);
export const registerUser = (userData) => mock.registerUser(userData);
export const forgotPassword = (email) => mock.forgotPassword(email);
export const resetPassword = (token, password) => mock.resetPassword(token, password);

// ─── Orders — real AWS when backend is configured ────────────────────────────

/**
 * POST /placeOrder
 */
export const placeOrder = (orderData) => {
  if (!HAS_BACKEND) return mock.placeOrder(orderData);
  return request('POST', '/placeOrder', orderData);
};

/**
 * GET /getOrders
 */
export const getUserOrders = (userId) => {
  if (!HAS_BACKEND) return mock.getUserOrders(userId);
  const qs = userId ? `?userId=${userId}` : '';
  return request('GET', `/getOrders${qs}`);
};
