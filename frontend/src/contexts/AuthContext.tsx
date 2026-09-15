import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('college_budget_token');
    const savedUser = localStorage.getItem('college_budget_user');
    const API_BASE = `${window.location.protocol}//${window.location.hostname}:5000/api`;

    const autoLogin = () => {
      fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@vignan.ac.in', password: 'admin' })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.token && data.user) {
            setToken(data.token);
            setUser(data.user);
            localStorage.setItem('college_budget_token', data.token);
            localStorage.setItem('college_budget_user', JSON.stringify(data.user));
          }
        })
        .catch(err => console.error('[Auto Auth] Initial session fetch failed:', err))
        .finally(() => setIsLoading(false));
    };

    if (savedToken && savedUser) {
      fetch(`${API_BASE}/auth/profile`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
        .then(res => {
          if (res.ok) {
            return res.json().then(data => {
              if (data.success && data.user) {
                setToken(savedToken);
                setUser(data.user);
                localStorage.setItem('college_budget_user', JSON.stringify(data.user));
                setIsLoading(false);
              } else {
                autoLogin();
              }
            });
          } else {
            autoLogin();
          }
        })
        .catch(() => autoLogin());
    } else {
      autoLogin();
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('college_budget_token', newToken);
    localStorage.setItem('college_budget_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('college_budget_token');
    localStorage.removeItem('college_budget_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!user,
        isLoading,
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
