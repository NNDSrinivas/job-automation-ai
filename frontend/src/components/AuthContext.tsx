// src/components/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axiosInstance from '../utils/axiosInstance';
import { toast } from 'react-toastify';
import Spinner from './Spinner';

interface AuthContextType {
  isAuthenticated: boolean;
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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
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
      localStorage.setItem('token', response.data.access_token);
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
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    toast.info('You have been logged out.');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, register, logout }}>
      {loading ? <Spinner /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
