import { createContext, useContext, useState } from 'react';

const CustomerAuthContext = createContext();

export const CustomerAuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('biterush_user')); } catch { return null; }
  });

  const login = (userData, token) => {
    localStorage.setItem('biterush_token', token);
    localStorage.setItem('biterush_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('biterush_token');
    localStorage.removeItem('biterush_user');
    setUser(null);
  };

  return (
    <CustomerAuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  return ctx;
};
