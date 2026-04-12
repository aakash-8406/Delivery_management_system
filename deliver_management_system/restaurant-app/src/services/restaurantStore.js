// Shared restaurant store via localStorage
// restaurant-app writes here, customer-app reads from here
const KEY = 'sq_restaurants';

export const getStoredRestaurants = () => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export const saveRestaurant = (restaurant) => {
  try {
    const all = getStoredRestaurants() ?? {};
    all[restaurant.restaurantId] = { ...all[restaurant.restaurantId], ...restaurant };
    localStorage.setItem(KEY, JSON.stringify(all));
    window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
  } catch {}
};

export const getStoredRestaurantList = () => {
  const all = getStoredRestaurants();
  return all ? Object.values(all) : null;
};
