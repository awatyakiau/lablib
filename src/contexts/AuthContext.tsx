import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, LoginCredentials, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock API for demonstration
const mockLogin = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Mock validation logic
  if (credentials.studentId === '00061204' && credentials.password === 'Dependable61204') {
    return {
      token: 'mock-token-user',
      user: {
        id: '00061204',
        name: '一般さん',
        role: 'user'
      }
    };
  } else if (credentials.studentId === '00999999' && credentials.password === 'Dependable61204') {
    return {
      token: 'mock-token-admin',
      user: {
        id: '00999999',
        name: '管理者さん',
        role: 'admin'
      }
    };
  }
  
  throw new Error('Invalid credentials');
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Check for saved auth on load
    const savedAuth = localStorage.getItem('lablib-auth');
    if (savedAuth) {
      try {
        const { user } = JSON.parse(savedAuth);
        setUser(user);
      } catch (err) {
        localStorage.removeItem('lablib-auth');
      }
    }
    setIsLoading(false);
  }, []);
  
  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await mockLogin(credentials);
      setUser(response.user);
      localStorage.setItem('lablib-auth', JSON.stringify({
        token: response.token,
        user: response.user
      }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('lablib-auth');
  };
  
  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user, 
        isLoading, 
        login, 
        logout, 
        error 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};