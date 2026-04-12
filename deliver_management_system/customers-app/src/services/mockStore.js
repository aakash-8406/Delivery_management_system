// Shared order store via localStorage — both customer-app and restaurant-app read/write here
const KEY = 'sq_orders_v2';
const generateId = () => Math.random().toString(36).substring(2, 9);

const seed = () => [];

export const getOrders = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const initial = seed();
      localStorage.setItem(KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch { return []; }
};

export const saveOrders = (orders) => {
  localStorage.setItem(KEY, JSON.stringify(orders));
  // Notify other tabs/windows
  window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
};

export const addOrder = (order) => {
  const orders = getOrders();
  const newOrder = { ...order, id: generateId(), status: 'ACCEPTED', createdAt: new Date().toISOString() };
  orders.unshift(newOrder);
  saveOrders(orders);
  return newOrder;
};

export const updateOrderStatus = (id, status) => {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx === -1) throw new Error('Order not found');
  orders[idx] = { ...orders[idx], status };
  saveOrders(orders);
  return orders[idx];
};
