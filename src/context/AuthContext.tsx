'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User) => void;
  logout: () => void;
  isAdmin: boolean;
  isLoading: boolean;
  getAuthHeader: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('food_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        if (parsed.token && typeof document !== 'undefined') {
          document.cookie = `auth_token=${parsed.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax;`;
        }
      }
    } catch (e) {
      // ignore
    }
    setIsLoading(false);
  }, []);

  const login = (newUser: User) => {
    setUser(newUser);
    try {
      localStorage.setItem('food_user', JSON.stringify(newUser));
      if (newUser.token && typeof document !== 'undefined') {
        document.cookie = `auth_token=${newUser.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax;`;
      }
    } catch (e) {
      // ignore
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('food_user');
      if (typeof document !== 'undefined') {
        document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax;';
      }
    } catch (e) {
      // ignore
    }
  };

  const token = user?.token || null;

  const getAuthHeader = (): Record<string, string> => {
    if (user?.token) {
      return { Authorization: `Bearer ${user.token}` };
    }
    return {};
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAdmin: user?.role === 'admin',
        isLoading,
        getAuthHeader,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
