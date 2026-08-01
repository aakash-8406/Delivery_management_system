/**
 * unified-app/src/services/api.js
 * Single API service for both customer and restaurant flows.
 */

const BASE       = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const MASTER_KEY = import.meta.env.VITE_MASTER_KEY ?? 'MASTER-SMARTQUEUE-2024';

// ─── Token helpers ────────────────────────────────────────────────────────────
const getCustomerToken   = () => localStorage.getItem('biterush_token');
const getRestaurantToken = () => localStorage.getItem('sq_token');

const request = async (method, path, body, extraHeaders = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? json.message ?? `Request failed (${res.status})`);
  return json;
};

const customerRequest = (method, path, body) =>
  request(method, path, body, {
    ...(getCustomerToken() ? { Authorization: `Bearer ${getCustomerToken()}` } : {}),
  });

const restaurantRequest = (method, path, body, extra = {}) =>
  request(method, path, body, {
    ...(getRestaurantToken() ? { Authorization: `Bearer ${getRestaurantToken()}` } : {}),
    ...extra,
  });

// ─── Customer Auth ────────────────────────────────────────────────────────────
export const registerUser = (data) => customerRequest('POST', '/customerRegister', data);
export const loginUser    = (data) => customerRequest('POST', '/customerLogin', data);
export const forgotPassword = async () => ({ data: { message: 'Contact support to reset your password' } });

// ─── Restaurant Auth ──────────────────────────────────────────────────────────
export const registerRestaurant = (data) =>
  restaurantRequest('POST', '/register', data, { 'x-master-key': MASTER_KEY });
export const loginRestaurant = (email, password) =>
  restaurantRequest('POST', '/login', { email, password });

// ─── Restaurants ──────────────────────────────────────────────────────────────
export const getRestaurants = async () => {
  const res  = await customerRequest('GET', '/restaurants');
  const list = Array.isArray(res.data ?? res) ? (res.data ?? res) : [];
  return {
    data: list.map(r => ({
      ...r,
      id:           r.restaurantId ?? r.id,
      image:        r.image        || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop',
      cuisine:      r.cuisine      || r.location || 'Restaurant',
      rating:       r.rating != null ? Number(r.rating) : 4.5,
      deliveryTime: r.deliveryTime || '30-40 min',
      deliveryFee:  r.deliveryFee != null && r.deliveryFee !== '' ? Number(r.deliveryFee) : 29,
      offer:        r.offer  || '',
      isVeg:        r.isVeg  ?? false,
    })),
  };
};

export const searchRestaurants = async (query) => {
  const { data } = await getRestaurants();
  const q = query.toLowerCase();
  return { data: data.filter(r => r.name?.toLowerCase().includes(q) || r.cuisine?.toLowerCase().includes(q)) };
};

export const getRestaurantById = async (id) => {
  const json = await customerRequest('GET', `/restaurants/${encodeURIComponent(id)}`);
  const r    = json.data ?? json;
  return {
    data: {
      ...r,
      id:           r.restaurantId ?? r.id,
      image:        r.image        || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop',
      cuisine:      r.cuisine      || r.location || 'Restaurant',
      rating:       r.rating       ?? 4.5,
      deliveryTime: r.deliveryTime ?? '30-40 min',
      deliveryFee:  r.deliveryFee  ?? 29,
      offer:        r.offer        ?? '',
      isVeg:        r.isVeg        ?? false,
    },
  };
};

export const getMenuByRestaurant = async (id) => {
  const json = await customerRequest('GET', `/restaurants/${encodeURIComponent(id)}`);
  return { data: (json.data ?? json)?.menu ?? [] };
};

export const getAllRestaurants = async () => {
  const data = await restaurantRequest('GET', '/restaurants');
  return Array.isArray(data) ? data : (data.restaurants ?? data.data ?? []);
};

export const updateRestaurant = (restaurantId, data) =>
  restaurantRequest('PATCH', `/restaurants/${restaurantId}`, data);

export const deleteRestaurant = async (restaurantId, masterKey) => {
  const token = getRestaurantToken();
  const res   = await fetch(`${BASE}/restaurants/${encodeURIComponent(restaurantId)}`, {
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

// ─── Orders ──────────────────────────────────────────────────────────────────
export const placeOrder = (orderData) => customerRequest('POST', '/placeOrder', orderData);

export const getUserOrders = (userId) => {
  const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return customerRequest('GET', `/getOrders${qs}`);
};

export const fetchOrders = async (restaurantId) => {
  const qs   = restaurantId ? `?restaurantId=${encodeURIComponent(restaurantId)}` : '';
  const data = await restaurantRequest('GET', `/getOrders${qs}`);
  const list = Array.isArray(data) ? data : (data.orders ?? data.data ?? []);
  return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const updateOrder = (id, status) =>
  restaurantRequest('PATCH', `/updateOrder/${id}`, { status });

// ─── S3 upload ────────────────────────────────────────────────────────────────
export const uploadToS3 = async (file) => {
  const res = await fetch(`${BASE}/getUploadUrl`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileType: file.type, folder: 'restaurants' }),
  });
  const { uploadUrl, publicUrl } = await res.json();
  await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
  return publicUrl;
};
