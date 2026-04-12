import { restaurants, menuItems } from '../data/mockData';
import { getOrders, addOrder } from './mockStore';
import { getStoredRestaurantList, getStoredRestaurants } from './restaurantStore';

const delay = (ms) => new Promise(r => setTimeout(r, ms));

// Merge mockData with any restaurants saved by restaurant-app in localStorage
const getMergedRestaurants = () => {
  const stored = getStoredRestaurants(); // { [restaurantId]: restaurant }
  if (!stored || Object.keys(stored).length === 0) return restaurants;

  // Start with mockData, then append real registered restaurants
  const mockIds = new Set(restaurants.map(r => String(r.id)));
  const realRestaurants = Object.values(stored).filter(r => !mockIds.has(String(r.restaurantId)));

  const normalizedReal = realRestaurants.map(r => ({
    ...r,
    id:           r.restaurantId,
    image:        r.image        || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop',
    cuisine:      r.cuisine      || r.location || 'Restaurant',
    rating:       r.rating       ? parseFloat(r.rating) : 4.0,
    deliveryTime: r.deliveryTime || '30-40 min',
    deliveryFee:  r.deliveryFee  !== undefined && r.deliveryFee !== '' ? parseFloat(r.deliveryFee) : 29,
    offer:        r.offer        || '',
    isVeg:        r.isVeg        ?? false,
    menu:         r.menu         || [],
  }));

  // Also update existing mock restaurants if they were updated via restaurant-app
  const updatedMock = restaurants.map(r => {
    const updated = stored[String(r.id)];
    if (!updated) return r;
    return {
      ...r,
      cuisine:      updated.cuisine      || r.cuisine,
      rating:       updated.rating       ? parseFloat(updated.rating)      : r.rating,
      deliveryTime: updated.deliveryTime || r.deliveryTime,
      deliveryFee:  updated.deliveryFee  !== undefined && updated.deliveryFee !== '' ? parseFloat(updated.deliveryFee) : r.deliveryFee,
      offer:        updated.offer        !== undefined ? updated.offer        : r.offer,
      isVeg:        updated.isVeg        !== undefined ? updated.isVeg        : r.isVeg,
      image:        updated.image        || r.image,
      menu:         updated.menu         || r.menu,
    };
  });

  return [...updatedMock, ...normalizedReal];
};

export const getRestaurants = async (params = {}) => {
  await delay(600);
  return { data: getMergedRestaurants() };
};

export const searchRestaurants = async (query) => {
  await delay(300);
  const q = query.toLowerCase();
  return { data: getMergedRestaurants().filter(r => r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q)) };
};

export const getRestaurantById = async (id) => {
  await delay(400);
  const all = getMergedRestaurants();
  const r = all.find(r => String(r.id) === String(id) || String(r.restaurantId) === String(id));
  if (!r) throw new Error('Restaurant not found');
  // Merge menu from stored if available
  const stored = getStoredRestaurants();
  const storedR = stored?.[String(r.restaurantId ?? r.id)];
  return { data: { ...r, menu: storedR?.menu ?? r.menu ?? [] } };
};

export const getMenuByRestaurant = async (id) => {
  await delay(400);
  // Check stored restaurant menu first
  const stored = getStoredRestaurants();
  const storedR = stored?.[String(id)];
  if (storedR?.menu?.length) return { data: storedR.menu };
  return { data: menuItems[Number(id)] || [] };
};

export const loginUser = async ({ email, password }) => {
  await delay(600);
  if (email === 'customer@bitrush.com' && password === 'customer123') {
    return { data: { user: { id: 'u1', name: 'Customer', email }, token: 'mock-token' } };
  }
  throw new Error('Invalid email or password');
};

export const registerUser = async ({ name, email, password }) => {
  await delay(800);
  return { data: { user: { id: 'u' + Date.now(), name, email }, token: 'mock-token' } };
};

export const forgotPassword = async (email) => {
  await delay(600);
  return { data: { message: 'Reset link sent to ' + email } };
};

export const resetPassword = async (token, password) => {
  await delay(600);
  return { data: { message: 'Password reset successfully' } };
};

export const placeOrder = async (orderData) => {
  await delay(1000);
  const totalItems = orderData.items.reduce((s, i) => s + i.qty, 0);
  const prepTime = 10 + totalItems * 5;
  const order = addOrder({ ...orderData, prepTime });
  return { data: { orderId: order.id, ...order } };
};

export const getUserOrders = async (userId) => {
  await delay(500);
  const all = getOrders();
  const filtered = userId ? all.filter(o => o.userId === userId) : all;
  return { data: filtered };
};
