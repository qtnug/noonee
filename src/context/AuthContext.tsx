'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User) => void;
  logout: () => void;
  isAdmin: boolean;
  isManager: boolean;
  isStaff: boolean;
  isPortalUser: boolean;
  isLoading: boolean;
  getAuthHeader: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/user/profile', { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => {
        if (active) setUser(data?.success ? data.data.user : null);
      })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const login = (newUser: User) => {
    const { token: _unusedToken, ...safeUser } = newUser;
    setUser(safeUser as User);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('food_user');
    void fetch('/api/auth/logout', { method: 'POST' });
  };

  const token = null;

  const getAuthHeader = (): Record<string, string> => ({});

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAdmin: user?.role === 'admin',
        isManager: user?.role === 'manager',
        isStaff: user?.role === 'staff',
        isPortalUser: user?.role === 'admin' || user?.role === 'manager' || user?.role === 'staff',
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
