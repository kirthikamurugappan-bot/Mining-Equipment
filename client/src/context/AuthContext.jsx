import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('minetrack_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('minetrack_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('minetrack_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            const userData = res.data.data || res.data.user;
            setUser(userData);
            localStorage.setItem('minetrack_user', JSON.stringify(userData));
          } else {
            logout();
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    if (res.data.success) {
      const newToken = res.data.token;
      const newUser = res.data.user || res.data.data?.user || res.data.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('minetrack_token', newToken);
      localStorage.setItem('minetrack_user', JSON.stringify(newUser));
      return { success: true, user: newUser };
    }
    return { success: false, message: res.data.message || 'Login failed' };
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch {
      // Ignore logout network errors
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('minetrack_token');
      localStorage.removeItem('minetrack_user');
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('minetrack_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      updateUser,
      isAuthenticated: !!token && !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
