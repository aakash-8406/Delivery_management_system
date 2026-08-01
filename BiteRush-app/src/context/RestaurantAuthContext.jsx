import { createContext, useContext, useState } from 'react';

const RestaurantAuthContext = createContext(null);

export function RestaurantAuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sq_restaurant')); } catch { return null; }
  });

  const setSession = (restaurant, token) => {
    localStorage.setItem('sq_restaurant', JSON.stringify(restaurant));
    localStorage.setItem('sq_token', token);
    setUser(restaurant);
  };

  const logout = () => {
    localStorage.removeItem('sq_restaurant');
    localStorage.removeItem('sq_token');
    setUser(null);
  };

  return (
    <RestaurantAuthContext.Provider value={{ user, setSession, logout }}>
      {children}
    </RestaurantAuthContext.Provider>
  );
}

export const useRestaurantAuth = () => useContext(RestaurantAuthContext);
