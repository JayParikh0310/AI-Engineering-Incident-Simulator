import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import type { User, LoginRequest } from '../types/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated) {
        try {
          const userData = await authService.getMe();
          setUser(userData);
        } catch (err) {
          authService.logout();
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [isAuthenticated]);

  const login = async (data: any) => {
    try {
      const response = await authService.login(data);
      setIsAuthenticated(true);
      setUser(response.user);
    } catch (err) {
      // Re-throw to be handled by the component, but ensure state is consistent
      setIsAuthenticated(false);
      setUser(null);
      throw err;
    }
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
