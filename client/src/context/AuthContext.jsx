import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('bookleaf_token') || null);
  const [demoAccounts, setDemoAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load demo accounts list for evaluation switcher
  useEffect(() => {
    api.auth.getDemoAccounts()
      .then(res => setDemoAccounts(res.users || []))
      .catch(err => console.error('Failed to load demo accounts', err));
  }, []);

  // Restore session
  useEffect(() => {
    if (token) {
      api.auth.getMe()
        .then(res => setUser(res.user))
        .catch(() => {
          localStorage.removeItem('bookleaf_token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await api.auth.login(email, password);
    localStorage.setItem('bookleaf_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('bookleaf_token');
    setToken(null);
    setUser(null);
  };

  const switchAccount = async (email) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(email, '');
      localStorage.setItem('bookleaf_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } catch (err) {
      console.error('Failed to switch persona', err);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: !!user,
    demoAccounts,
    isLoading,
    login,
    logout,
    switchAccount
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
