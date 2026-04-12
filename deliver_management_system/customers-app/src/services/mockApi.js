import { restaurants, menuItems } from '../data/mockData';
import { getOrders, addOrder } from './mockStore';

const delay = (ms) => new Promise(r => setTimeout(r, ms));

export const getRestaurants = async (params = {}) => {
  await delay(600);
  return { data: restaurants };
};

export const searchRestaurants = async (query) => {
  await delay(300);
  const q = query.toLowerCase();
  return { data: restaurants.filter(r => r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q)) };
};

export const getRestaurantById = async (id) => {
  await delay(400);
  const r = restaurants.find(r => r.id === Number(id));
  if (!r) throw new Error('Restaurant not found');
  return { data: r };
};

export const getMenuByRestaurant = async (id) => {
  await delay(400);
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
