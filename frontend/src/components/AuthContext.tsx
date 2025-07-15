// src/components/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
// Removed useNavigate import - will handle navigation in components
import { jwtDecode } from 'jwt-decode';
import axiosInstance from '../utils/axiosInstance';
import { toast } from 'react-toastify';
import Spinner from './Spinner';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { id: number; username: string; email: string } | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface Props {
  children: React.ReactNode;
}

interface JwtPayload {
  exp: number;
  [key: string]: any;
}

export const AuthProvider = ({ children }: Props) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ id: number; username: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  // Removed navigate - will be handled in individual components

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        // Check if token is still valid
        if (decoded.exp * 1000 > Date.now()) {
          setIsAuthenticated(true);
          // Try to get user info from stored data or decode from token
          const userInfo = localStorage.getItem('userInfo');
          if (userInfo) {
            setUser(JSON.parse(userInfo));
          } else {
            // Set basic user info from token
            setUser({
              id: decoded.sub || decoded.user_id || 1,
              username: decoded.username || 'user',
              email: decoded.email || ''
            });
          }
        } else {
          // Token expired
          localStorage.removeItem('access_token');
          localStorage.removeItem('userInfo');
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('userInfo');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      console.log('Attempting login with:', { username });
      const response = await axiosInstance.post('/login', {
        username,
        password
      });

      console.log('Login response:', response.data);
      localStorage.setItem('access_token', response.data.access_token);

      // Store user info
      const userInfo = {
        id: response.data.user_id || 1,
        username: username,
        email: response.data.email || ''
      };
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      setUser(userInfo);

      setIsAuthenticated(true);
      setLoading(false);
      toast.success('Login successful!');
      return true;
    } catch (err: any) {
      console.error('Login error:', err);
      setIsAuthenticated(false);
      setLoading(false);

      if (err.response?.status === 401) {
        toast.error('Invalid username or password');
      } else if (err.response?.data?.detail) {
        toast.error(err.response.data.detail);
      } else {
        toast.error('Login failed. Please try again.');
      }
      return false;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setLoading(true);
    try {
      console.log('Attempting registration with:', { username, email });
      const response = await axiosInstance.post('/register', {
        username,
        email,
        password
      });
      console.log('Registration response:', response.data);
      setLoading(false);
      toast.success('Registration successful! Please sign in.');
      return true;
    } catch (err: any) {
      console.error('Registration error:', err);
      setLoading(false);

      if (err.response?.data?.detail) {
        toast.error(err.response.data.detail);
      } else if (err.response?.status === 400) {
        toast.error('Username or email already exists');
      } else {
        toast.error('Registration failed. Please try again.');
      }
      // Let the calling component handle the specific error
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('userInfo');
    setIsAuthenticated(false);
    setUser(null);
    toast.info('You have been logged out.');
    // Navigation will be handled by the component that calls logout
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout }}>
      {loading ? <Spinner /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
