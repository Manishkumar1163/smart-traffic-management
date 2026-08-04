import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/api/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error('Failed to load profile', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('accessToken', res.data.access_token);
    localStorage.setItem('refreshToken', res.data.refresh_token);
    setUser({
      id: res.data.id || '',
      name: res.data.name,
      email: email,
      role: res.data.role
    });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const registerUser = async (name, email, password, role = 'viewer') => {
    const res = await api.post('/api/auth/register', { name, email, password, role });
    return res.data;
  };

  const hasRole = (allowedRoles) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  const isAuthenticated = () => {
    return localStorage.getItem('accessToken') !== null;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, registerUser, hasRole, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
