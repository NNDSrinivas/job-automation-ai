import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'react-toastify';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isVerified: boolean;
  subscription?: 'free' | 'pro' | 'enterprise';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
  signup: (userData: SignupData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  isAuthenticated: boolean;
}

interface SignupData {
  email: string;
  password: string;
  full_name: string;
  username?: string;  // Add username as optional field
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    console.log('🔍 AuthProvider init - token found:', !!token);
    console.log('🔍 Token value:', token ? `${token.substring(0, 20)}...` : 'null');

    if (token) {
      // Validate existing token
      validateToken(token);
    } else {
      // No token, user needs to login
      setLoading(false);
    }
  }, []);

  const autoLoginDemo = async () => {
    try {
      console.log('🎬 Auto-logging in with demo user...');
      const success = await login('demo', 'demo123');
      if (success) {
        console.log('🎬 Demo auto-login successful!');
      } else {
        console.log('🎬 Demo auto-login failed, user will see login screen');
        setLoading(false);
      }
    } catch (error) {
      console.error('🎬 Demo auto-login error:', error);
      setLoading(false);
    }
  };

  const validateToken = async (token: string) => {
    try {
      console.log('🔍 Validating token with backend...');      console.log('🔍 Making request to: http://localhost:8000/profile');
      
      const response = await fetch('http://localhost:8000/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('🔍 Token validation response status:', response.status);
      console.log('🔍 Token validation response headers:', response.headers);

      if (response.ok) {
        const userData = await response.json();
        console.log('🔍 Token validation successful, user data:', userData);
        // Transform backend data to match User interface
        const user: User = {
          id: userData.id?.toString() || '1',
          email: userData.email || '',
          firstName: userData.username || 'User',
          lastName: '',
          isVerified: true,
          subscription: 'free',
          createdAt: new Date().toISOString()
        };
        setUser(user);
        console.log('🔍 User set from token validation:', user);
      } else {
        console.log('🔍 Token validation failed, response text:', await response.text());
        // Token is invalid, remove it
        localStorage.removeItem('authToken');
        setUser(null);
      }
    } catch (error) {
      console.error('🔍 Token validation error:', error);
      localStorage.removeItem('authToken');
      setUser(null);
    } finally {
      console.log('🔍 Token validation complete, setting loading to false');
      setLoading(false);
    }
  };

  const login = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Login attempt for:', usernameOrEmail);
      console.log('🔐 Backend URL:', 'http://localhost:8000/login');
      console.log('🔐 Browser User Agent:', navigator.userAgent);
      console.log('🔐 Current origin:', window.location.origin);
      setLoading(true);

      const formData = new FormData();
      formData.append('username', usernameOrEmail);
      formData.append('password', password);

      console.log('🔐 FormData contents:');
      for (let pair of formData.entries()) {
        console.log('🔐   ', pair[0], ':', pair[1]);
      }

      console.log('🔐 Sending login request...');
      console.log('🔐 Request details:', {
        method: 'POST',
        url: 'http://localhost:8000/login',
        body: 'FormData with username and password'
      });

      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        body: formData,
      });

      console.log('🔐 Login response status:', response.status);
      console.log('🔐 Login response ok:', response.ok);
      console.log('🔐 Login response statusText:', response.statusText);
      console.log('🔐 Login response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('🔐 Raw response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('🔐 Parsed response data:', data);
      } catch (parseError) {
        console.error('🔐 JSON parse error:', parseError);
        console.log('🔐 Response was not valid JSON:', responseText);
        throw new Error('Invalid response format from server');
      }

      if (response.ok) {
        console.log('✅ Login successful, storing token and user data...');
        localStorage.setItem('authToken', data.access_token);

        // Create user object from backend response
        const userData: User = {
          id: data.user_id.toString(),
          email: data.email,
          firstName: data.username || 'User', // Fallback if no first name
          lastName: '', // Backend doesn't provide separate first/last names
          isVerified: true, // Assume verified if they can login
          subscription: 'free', // Default subscription
          createdAt: new Date().toISOString() // Fallback date
        };

        console.log('👤 Setting user data:', userData);
        setUser(userData);

        console.log('🎉 User state updated, isAuthenticated should be true');
        console.log('🎯 Current isAuthenticated value:', !!userData);
        console.log('🎯 Current user state after setUser:', userData);
        toast.success('Welcome back! Login successful.');

        // Force a re-render check
        setTimeout(() => {
          console.log('🔄 Post-login state check - isAuthenticated:', !!user);
        }, 100);

        return true;
      } else {
        console.log('❌ Login failed:', data.detail);
        toast.error(data.detail || 'Login failed. Please check your credentials.');
        return false;
      }
    } catch (error) {
      console.error('💥 Login error:', error);

      // Type-safe error handling
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorName = error instanceof Error ? error.name : 'Unknown';
      const errorStack = error instanceof Error ? error.stack : 'No stack trace';

      console.error('💥 Error details:', errorMessage);
      console.error('💥 Error stack:', errorStack);

      if (errorName === 'TypeError' && errorMessage.includes('fetch')) {
        toast.error('Connection failed. Please make sure the backend server is running on http://localhost:8000');
      } else {
        toast.error('Login failed. Please try again.');
      }
      return false;
    } finally {
      setLoading(false);
      console.log('🏁 Login process completed, loading set to false');
    }
  };

  const signup = async (userData: SignupData): Promise<boolean> => {
    try {
      console.log('Signup attempt with data:', userData);
      setLoading(true);
      const response = await fetch('http://localhost:8000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          full_name: userData.full_name,
          username: userData.username, // Include username
        }),
      });

      console.log('Signup response status:', response.status);
      const data = await response.json();
      console.log('Signup response data:', data);

      if (response.ok) {
        // Registration successful, now login to get access token
        const loginSuccess = await login(userData.email, userData.password);
        if (loginSuccess) {
          toast.success('Account created successfully! Welcome to Job Automation AI.');
          return true;
        } else {
          toast.error('Account created but login failed. Please try logging in manually.');
          return false;
        }
      } else {
        if (response.status === 400 && data.detail === "Email already exists") {
          toast.error('This email is already registered. Please use the login page or try a different email.');
        } else {
          toast.error(data.detail || 'Signup failed. Please try again.');
        }
        return false;
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Signup failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear all possible authentication tokens and data
    localStorage.removeItem('authToken');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('userInfo');
    
    // Clear any session storage as well
    sessionStorage.clear();
    
    // Reset user state
    setUser(null);
    
    console.log('🚪 User logged out, all auth data cleared');
    toast.info('You have been logged out successfully.');
  };

  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return false;

      const response = await fetch('http://localhost:8000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        toast.success('Profile updated successfully!');
        return true;
      } else {
        toast.error('Failed to update profile.');
        return false;
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile.');
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    updateProfile,
    isAuthenticated: !!user,
  };

  // Debug logging for authentication state
  useEffect(() => {
    console.log('🔍 AuthContext state changed:', {
      user: user ? { id: user.id, email: user.email } : null,
      loading,
      isAuthenticated: !!user
    });
  }, [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
