import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import api from '../services/api';

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

    // Restore a cached session immediately so a reload never bounces the user to
    // /login while the profile refresh is in flight (in production the API is the
    // client engine; on localhost it is the :5000 backend — the `api` service
    // routes correctly for both).
    const restoreCached = (): boolean => {
      if (savedToken && savedUser) {
        try {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          return true;
        } catch {
          /* corrupt cache — fall through to auto-login */
        }
      }
      return false;
    };

    const autoLogin = () => {
      api
        .post('/auth/login', { email: 'admin@vignan.ac.in', password: 'admin' })
        .then(res => {
          const data = res.data;
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

    if (restoreCached()) {
      // Refresh the profile in the background; keep the cached session on failure.
      api
        .get('/auth/profile')
        .then(res => {
          const data = res.data;
          if (data?.success && data.user) {
            setUser(data.user);
            localStorage.setItem('college_budget_user', JSON.stringify(data.user));
          }
        })
        .catch(() => {
          /* offline / no backend — keep the cached session, do not log out */
        })
        .finally(() => setIsLoading(false));
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
