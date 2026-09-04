// contexts/AuthContext.jsx - FIXED
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../api/auth';

const AuthContext = createContext();

// This file intentionally exports both the AuthProvider component and the
// useAuth hook together — this is the standard React context co-location
// pattern (context + provider + consumer hook in one file) and is the most
// maintainable structure here, since every consumer already imports useAuth
// from this same path. Splitting useAuth into its own file would only
// optimize Fast Refresh for this one hook export and isn't worth the
// churn of updating every import across the app, so we suppress the rule
// here rather than restructure.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load, restore user from localStorage
  useEffect(() => {
    const restoreUser = () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          // ✅ FIX: Removed the "force admin role" hack — role now comes correctly
          // from the JWT token via the backend (generateToken now includes role)
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    restoreUser();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      const token = data.data?.token;
      if (!token) {
        throw new Error('No token received from server');
      }

      const userData = data.data;

      // Ensure email is present
      if (!userData.email) {
        userData.email = email;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      return { success: true, user: userData };

    } catch (error) {
      console.error('Login error:', error);

      let errorMessage = 'Login failed';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};