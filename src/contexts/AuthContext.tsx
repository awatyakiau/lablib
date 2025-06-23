import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, LoginCredentials, AuthResponse } from '../types';
import axios from 'axios';

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
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiYWRtaW4iLCJhZG1pbiI6dHJ1ZSwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzgxODU4NjM0fQ.rRriTQpCxIDAAx_BMZTFGnRfcFjXIlLRJqaWjYx9H6s',
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
    // studentId → student_id に変換して送信
    const response = await axios.post('/api/auth/login', {
      student_id: credentials.studentId,
      password: credentials.password,
    });

    const { token, user } = response.data;
    setUser(user);
    localStorage.setItem('lablib-auth', JSON.stringify({
      token,
      user,
    }));
  } catch (err: any) {
    if (err.response?.data?.error) {
      setError(err.response.data.error);
    } else {
      setError('ログインに失敗しました');
    }
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