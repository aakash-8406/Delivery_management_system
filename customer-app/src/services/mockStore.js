// Shared order store via localStorage — both customer-app and restaurant-app read/write here
const KEY = 'sq_orders';
const generateId = () => Math.random().toString(36).substring(2, 9);

const seed = () => [
  {
    id: generateId(), customerName: 'Alice Smith', details: 'Extra spicy',
    items: [{ id: 101, name: 'Classic Cheeseburger', price: 199, qty: 2 }, { id: 301, name: 'Caesar Salad', price: 199, qty: 1 }],
    totalAmount: 631, status: 'ACCEPTED',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), prepTime: 20,
    deliveryAddress: '12 MG Road, Bangalore - 560001',
  },
  {
    id: generateId(), customerName: 'Bob Jones', details: '',
    items: [{ id: 201, name: 'Margherita Pizza', price: 299, qty: 1 }, { id: 204, name: 'Garlic Bread', price: 99, qty: 1 }],
    totalAmount: 432, status: 'DELAYED',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), prepTime: 35,
    deliveryAddress: '45 Koramangala, Bangalore - 560034',
  },
  {
    id: generateId(), customerName: 'Charlie', details: 'No onions',
    items: [{ id: 401, name: 'Chicken Biryani', price: 299, qty: 2 }],
    totalAmount: 661, status: 'DELIVERED',
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), prepTime: 40,
    deliveryAddress: '7 Indiranagar, Bangalore - 560038',
  },
];

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
