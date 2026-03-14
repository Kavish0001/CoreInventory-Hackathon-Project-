import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { authService } from '../services/api';
import { AuthContext } from './AuthContextValue';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await authService.login(email, password);
      const { user, token } = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      setUser(user);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  }, []);

  const register = useCallback(async (payload) => {
    try {
      const response = await authService.register(payload);
      const { user, token } = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      setUser(user);
      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    try {
      const response = await authService.forgotPassword(email);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, error: error.response?.data?.message || 'Request failed' };
    }
  }, []);

  const resetPassword = useCallback(async (payload) => {
    try {
      const response = await authService.resetPassword(payload);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: error.response?.data?.message || 'Reset failed' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const contextValue = useMemo(() => ({
    user,
    login,
    register,
    forgotPassword,
    resetPassword,
    logout,
    loading
  }), [user, login, register, forgotPassword, resetPassword, logout, loading]);

  return (
    <AuthContext.Provider value={contextValue}> {/* NOSONAR */}
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};
