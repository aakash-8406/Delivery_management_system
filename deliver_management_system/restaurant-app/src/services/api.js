/**
 * restaurant-app/src/services/api.js
 * All calls go to real AWS backend. Auth uses AWS Cognito.
 */

const BASE              = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_RESTAURANT_CLIENT_ID;
const COGNITO_REGION    = import.meta.env.VITE_AWS_REGION ?? "ap-southeast-1";

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

/** POST /register via Cognito + create restaurant profile */
export const registerRestaurant = async ({ name, location, email, password }) => {
  const e = email.toLowerCase().trim();
  await cognito('SignUp', {
    ClientId: COGNITO_CLIENT_ID,
    Username: e,
    Password: password,
    UserAttributes: [
      { Name: 'email', Value: e },
      { Name: 'name',  Value: name },
    ],
  });
  // Auto-confirm then login to get token
  const loginResult = await loginRestaurant(e, password);

  // Create restaurant profile in DynamoDB via API
  try {
    await request('POST', '/register', { name, location, email: e, password: 'cognito-managed' });
  } catch (err) {
    if (!err.message?.includes('409')) throw err; // ignore duplicate
  }

  return loginResult;
};

/** Login via Cognito, fetch restaurant profile from DynamoDB */
export const loginRestaurant = async (email, password) => {
  const e = email.toLowerCase().trim();
  const data = await cognito('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: COGNITO_CLIENT_ID,
    AuthParameters: { USERNAME: e, PASSWORD: password },
  });
  const idToken = data.AuthenticationResult.IdToken;

  // Fetch restaurant profile
  let restaurant;
  try {
    const profile = await fetch(`${BASE}/restaurants/${encodeURIComponent(e)}`);
    const json = await profile.json();
    restaurant = json.data ?? json;
    if (!restaurant?.restaurantId) throw new Error('no profile');
  } catch {
    // Profile doesn't exist yet — create it
    const p = JSON.parse(atob(idToken.split('.')[1]));
    restaurant = { restaurantId: e, email: e, name: p.name ?? e, location: '', cuisine: '', rating: '', deliveryTime: '', deliveryFee: '', offer: '', isVeg: false, menu: [] };
  }

  return { token: idToken, restaurant };
};

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
