/**
 * customer-app/src/services/api.js
 * All calls go to real AWS backend. Auth uses AWS Cognito.
 */

const BASE              = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CUSTOMER_CLIENT_ID;
const COGNITO_REGION    = import.meta.env.VITE_AWS_REGION ?? "ap-southeast-1";

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

// ─── Cognito ─────────────────────────────────────────────────────────────────

const cognito = async (action, payload) => {
  const res = await fetch(`https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${action}`,
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? json.__type ?? 'Auth failed');
  return json;
};

export const registerUser = async ({ name, email, password }) => {
  const e = email.toLowerCase().trim();
  await cognito('SignUp', {
    ClientId: COGNITO_CLIENT_ID,
    Username: e,
    Password: password,
    UserAttributes: [{ Name: 'email', Value: e }, { Name: 'name', Value: name }],
  });
  return loginUser({ email, password });
};

export const loginUser = async ({ email, password }) => {
  const data = await cognito('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: COGNITO_CLIENT_ID,
    AuthParameters: { USERNAME: email.toLowerCase().trim(), PASSWORD: password },
  });
  const idToken = data.AuthenticationResult.IdToken;
  const p = JSON.parse(atob(idToken.split('.')[1]));
  const user = { id: p.sub, userId: p.sub, email: p.email, name: p.name ?? p['cognito:username'] };
  return { data: { user, token: idToken } };
};

export const forgotPassword = async (email) => {
  await cognito('ForgotPassword', { ClientId: COGNITO_CLIENT_ID, Username: email.toLowerCase().trim() });
  return { data: { message: 'Reset code sent to ' + email } };
};

export const resetPassword = async (email, code, newPassword) => {
  await cognito('ConfirmForgotPassword', {
    ClientId: COGNITO_CLIENT_ID,
    Username: email.toLowerCase().trim(),
    ConfirmationCode: code,
    Password: newPassword,
  });
  return { data: { message: 'Password reset successfully' } };
};

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
