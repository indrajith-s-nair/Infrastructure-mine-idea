'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, getSavedUser, setSavedUser, setAuthTokens, clearAuthTokens, getAccessToken, api } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, phone_number: string, password: string, role?: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  isOfficer: boolean;
  isCitizen: boolean;
  isCentralDesk: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check saved user and verify token
    const saved = getSavedUser();
    const token = getAccessToken();

    if (saved && token) {
      setUser(saved);
      // Background verify profile
      api.auth.getMe()
        .then((freshUser) => {
          setUser(freshUser);
          setSavedUser(freshUser);
        })
        .catch(() => {
          // Token expired or invalid
          clearAuthTokens();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.auth.login({ email, password });
    setAuthTokens(res.tokens.access, res.tokens.refresh);
    setSavedUser(res.user);
    setUser(res.user);
    return res.user;
  };

  const register = async (name: string, email: string, phone_number: string, password: string, role = 'CITIZEN'): Promise<User> => {
    const res = await api.auth.register({ name, email, phone_number, password, role });
    setAuthTokens(res.tokens.access, res.tokens.refresh);
    setSavedUser(res.user);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    clearAuthTokens();
    setUser(null);
  };

  const isCentralDesk = !!(user && user.role === 'CENTRAL_DESK');
  const isOfficer = !!(user && (user.role === 'OFFICER' || user.officer_profile));
  const isCitizen = !!(user && user.role === 'CITIZEN');

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isOfficer,
        isCitizen,
        isCentralDesk,
      }}
    >
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
