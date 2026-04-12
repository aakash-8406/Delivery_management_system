import { getOrders, updateOrderStatus } from './mockStore';

const delay = (ms) => new Promise(r => setTimeout(r, ms));

export const fetchOrders = async () => {
  await delay(600);
  return [...getOrders()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const updateOrder = async (id, status) => {
  await delay(400);
  return updateOrderStatus(id, status);
};
