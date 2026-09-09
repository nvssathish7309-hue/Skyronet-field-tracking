import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('fieldtrack_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('fieldtrack_token');
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.data.user);
        localStorage.setItem('fieldtrack_user', JSON.stringify(res.data.data.user));
      }
    } catch (err) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('fieldtrack_token', newToken);
    localStorage.setItem('fieldtrack_user', JSON.stringify(newUser));
  };

  const logout = () => {
    if (token) {
      api.post('/auth/logout').catch(() => {});
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('fieldtrack_token');
    localStorage.removeItem('fieldtrack_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        login,
        logout,
        refreshUser
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
