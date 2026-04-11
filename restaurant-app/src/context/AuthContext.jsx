import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sq_restaurant')); } catch { return null; }
  });

  // Called after successful API login/register
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
    <AuthContext.Provider value={{ user, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
