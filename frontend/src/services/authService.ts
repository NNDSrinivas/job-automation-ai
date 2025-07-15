// Professional Authentication Service
import { apiClient, API_ENDPOINTS } from '../config/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  username: string;
  phone?: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  is_verified: boolean;
  created_at: string;
  subscription_tier: 'free' | 'premium' | 'enterprise';
  profile_completed: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
  expires_in: number;
}

export class AuthService {
  // Login user
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.login, credentials);

      // Store tokens
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Invalid email or password.');
    }
  }

  // Register new user
  static async signup(userData: SignupData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.signup, userData);

      // Store tokens
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      return response;
    } catch (error) {
      console.error('Signup failed:', error);
      throw new Error('Failed to create account. Please try again.');
    }
  }

  // Logout user
  static async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.logout);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');

      // Redirect to login
      window.location.href = '/login';
    }
  }

  // Refresh access token
  static async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiClient.post(API_ENDPOINTS.refreshToken, {
        refresh_token: refreshToken
      });

      localStorage.setItem('access_token', response.access_token);
      return response.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      AuthService.logout();
      throw new Error('Session expired. Please login again.');
    }
  }

  // Verify email
  static async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    try {
      return await apiClient.post(API_ENDPOINTS.verifyEmail, { token });
    } catch (error) {
      console.error('Email verification failed:', error);
      throw new Error('Failed to verify email. Please try again.');
    }
  }

  // Request password reset
  static async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      return await apiClient.post(API_ENDPOINTS.requestPasswordReset, { email });
    } catch (error) {
      console.error('Password reset request failed:', error);
      throw new Error('Failed to send password reset email.');
    }
  }

  // Reset password
  static async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      return await apiClient.post(API_ENDPOINTS.resetPassword, {
        token,
        new_password: newPassword
      });
    } catch (error) {
      console.error('Password reset failed:', error);
      throw new Error('Failed to reset password. Please try again.');
    }
  }

  // Get current user
  static getCurrentUser(): User | null {
    const userString = localStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    const user = AuthService.getCurrentUser();
    return !!(token && user);
  }

  // Get access token
  static getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // Update user profile
  static async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put(API_ENDPOINTS.updateProfile, userData);

      // Update stored user data
      localStorage.setItem('user', JSON.stringify(response));

      return response;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw new Error('Failed to update profile.');
    }
  }

  // Get user profile
  static async getProfile(): Promise<User> {
    try {
      return await apiClient.get(API_ENDPOINTS.profile);
    } catch (error) {
      console.error('Failed to get profile:', error);
      throw new Error('Failed to load profile.');
    }
  }
}
