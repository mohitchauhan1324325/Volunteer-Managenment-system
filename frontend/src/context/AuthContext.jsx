import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  // Sync Axios or standard fetch headers with the active token
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchMe();
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchMe = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
      } else {
        // Token might have expired
        logout();
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed.');
      }
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed.');
      }
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await fetch(`${API_URL}/api/volunteers/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Profile update failed.');
      }
      setUser(data.user);
      return data;
    } catch (err) {
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile, refreshUser: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
