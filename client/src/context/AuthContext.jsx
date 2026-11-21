import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const STORAGE_KEY = 'lumio_user';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
    } catch {
      return null;
    }
  });
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Verify the cookie-backed session on first load.
    let alive = true;
    api
      .get('/auth/me')
      .then((res) => {
        if (alive) {
          setUser(res.data.data.user);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data.data.user));
        }
      })
      .catch(() => {
        if (alive) {
          setUser(null);
          localStorage.removeItem(STORAGE_KEY);
        }
      })
      .finally(() => alive && setInitializing(false));
    return () => {
      alive = false;
    };
  }, []);

  const persist = (userData) => {
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  };

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    persist(res.data.data.user);
    return res.data.data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    persist(res.data.data.user);
    return res.data.data.user;
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const res = await api.patch('/auth/profile', payload);
    persist(res.data.data.user);
    return res.data.data.user;
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, initializing, login, register, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
