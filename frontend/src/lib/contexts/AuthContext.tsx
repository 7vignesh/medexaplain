'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signUp: async () => { },
  signIn: async () => { },
  logout: async () => { },
  getToken: () => null,
});

export const useAuth = () => useContext(AuthContext);

const STORAGE_KEY = 'auth_token';
const USER_STORAGE_KEY = 'auth_user';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state from localStorage
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(STORAGE_KEY);
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);

      if (savedToken && savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Sign up with email and password
   */
  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, displayName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create account');
      }

      // Save token and user
      localStorage.setItem(STORAGE_KEY, data.data.token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.data.user));
      setUser(data.data.user);

      toast.success('Account created successfully!');
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error.message || 'Failed to create account');
      throw error;
    }
  };

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to sign in');
      }

      // Save token and user
      localStorage.setItem(STORAGE_KEY, data.data.token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.data.user));
      setUser(data.data.user);

      toast.success('Signed in successfully!');
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Failed to sign in');
      throw error;
    }
  };

  /**
   * Logout
   */
  const logout = async () => {
    try {
      const token = localStorage.getItem(STORAGE_KEY);
      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }

      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);

      toast.success('Logged out successfully');
      window.location.href = '/login';
    } catch (error: any) {
      console.error('Logout error:', error);
      // Still clear local storage even if request fails
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
      toast.error('Failed to logout');
    }
  };

  /**
   * Get JWT token for API requests
   */
  const getToken = (): string | null => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    logout,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
