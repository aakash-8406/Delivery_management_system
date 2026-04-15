/**
 * customer-app/src/services/api.js
 * Real AWS API Gateway — custom Lambda auth (no Cognito).
 */

const BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

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

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const registerUser = (userData) => request('POST', '/customerRegister', userData);
export const loginUser    = (credentials) => request('POST', '/customerLogin', credentials);

export const forgotPassword = async () => ({ data: { message: 'Contact support to reset your password' } });
export const resetPassword  = async () => ({ data: { message: 'Contact support to reset your password' } });

// ─── Restaurants ─────────────────────────────────────────────────────────────

export const getRestaurants = async () => {
  const res = await request('GET', '/restaurants');
  const list = Array.isArray(res.data) ? res.data : [];
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
  const res = await fetch(`${BASE}/restaurants/${encodeURIComponent(id)}`);
  const json = await res.json();
  const r = json.data ?? json;
  return { data: { ...r, id: r.restaurantId ?? r.id, image: r.image ?? 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop', rating: r.rating ?? 4.5, deliveryTime: r.deliveryTime ?? '30-40 min', deliveryFee: r.deliveryFee ?? 29, cuisine: r.cuisine || r.location || 'Restaurant', offer: r.offer ?? '', isVeg: r.isVeg ?? false } };
};

export const getMenuByRestaurant = async (id) => {
  const res = await fetch(`${BASE}/restaurants/${encodeURIComponent(id)}`);
  const json = await res.json();
  return { data: (json.data ?? json)?.menu ?? [] };
};

// ─── Orders ──────────────────────────────────────────────────────────────────

export const placeOrder = (orderData) => request('POST', '/placeOrder', orderData);

export const getUserOrders = (userId) => {
  const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return request('GET', `/getOrders${qs}`);
};
