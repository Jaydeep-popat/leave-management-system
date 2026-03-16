import { createContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data } = await api.get('/users/me');
      if (data.success) {
        setUser(data.data);
      }
    } catch (error) {
      console.error('Not authenticated', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data } = await api.post('/users/login', { email, password });
    if (data.success) {
      setUser(data.data.user);
      toast.success(`Welcome back, ${data.data.user.name}!`);
    }
    return data;
  };

  const registerUser = async (userData) => {
    const { data } = await api.post('/users/register', userData);
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/users/logout');
      toast.success('Logged out successfully');
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, registerUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
