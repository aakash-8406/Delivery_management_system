/**
 * Shared mock server for local development.
 * Both customer-app and restaurant-app talk to this on port 3001.
 * Run: node server.js
 */

const http = require('http');

let restaurants = {};  // { [restaurantId]: restaurant }
let orders = [];       // Order[]

const send = (res, status, data) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,x-master-key',
  });
  res.end(JSON.stringify(data));
};

const readBody = (req) => new Promise((resolve) => {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:3001`);
  const path = url.pathname;
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') return send(res, 204, {});

  // ── Auth ──────────────────────────────────────────────────────────────────
  if (method === 'POST' && path === '/register') {
    const body = await readBody(req);
    const restaurant = {
      restaurantId: body.email,
      name: body.name,
      email: body.email,
      location: body.location ?? '',
      cuisine: '', rating: '', deliveryTime: '', deliveryFee: '', offer: '', isVeg: false, menu: [],
      createdAt: new Date().toISOString(),
    };
    restaurants[restaurant.restaurantId] = restaurant;
    return send(res, 200, { token: 'mock-token', restaurant });
  }

  if (method === 'POST' && path === '/login') {
    const body = await readBody(req);
    const r = Object.values(restaurants).find(r => r.email === body.email);
    if (!r) return send(res, 401, { error: 'Invalid email or password' });
    return send(res, 200, { token: 'mock-token', restaurant: r });
  }

  // ── Restaurants ───────────────────────────────────────────────────────────
  if (method === 'GET' && path === '/restaurants') {
    return send(res, 200, { data: Object.values(restaurants) });
  }

  if (method === 'GET' && path.startsWith('/restaurants/')) {
    const id = decodeURIComponent(path.split('/restaurants/')[1]);
    const r = restaurants[id];
    if (!r) return send(res, 404, { error: 'Not found' });
    return send(res, 200, { data: r });
  }

  if (method === 'PATCH' && path.startsWith('/restaurants/')) {
    const id = decodeURIComponent(path.split('/restaurants/')[1]);
    const body = await readBody(req);
    restaurants[id] = { ...restaurants[id], ...body, restaurantId: id };
    return send(res, 200, { data: restaurants[id] });
  }

  if (method === 'DELETE' && path.startsWith('/restaurants/')) {
    const id = decodeURIComponent(path.split('/restaurants/')[1]);
    delete restaurants[id];
    return send(res, 200, { data: { deleted: id } });
  }

  // ── Orders ────────────────────────────────────────────────────────────────
  if (method === 'POST' && path === '/placeOrder') {
    const body = await readBody(req);
    const order = {
      ...body,
      id: Math.random().toString(36).substring(2, 9),
      status: 'ACCEPTED',
      createdAt: new Date().toISOString(),
      prepTime: 10 + (body.items?.reduce((s, i) => s + (i.qty ?? 1), 0) ?? 1) * 5,
    };
    orders.unshift(order);
    return send(res, 200, { data: { orderId: order.id, ...order } });
  }

  if (method === 'GET' && path === '/getOrders') {
    const userId = url.searchParams.get('userId');
    const restaurantId = url.searchParams.get('restaurantId');
    let result = orders;
    if (userId) result = result.filter(o => o.userId === userId);
    if (restaurantId) result = result.filter(o => o.restaurantId === restaurantId);
    return send(res, 200, { data: result });
  }

  if (method === 'PATCH' && path.startsWith('/updateOrder/')) {
    const id = path.split('/updateOrder/')[1];
    const body = await readBody(req);
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) return send(res, 404, { error: 'Order not found' });
    orders[idx] = { ...orders[idx], ...body };
    return send(res, 200, { data: orders[idx] });
  }

  send(res, 404, { error: 'Not found' });
});

server.listen(3001, () => {
  console.log('');
  console.log('  Mock server running on http://localhost:3001');
  console.log('');
  console.log('  Set in both apps .env:');
  console.log('  VITE_API_URL=http://localhost:3001');
  console.log('');
});
