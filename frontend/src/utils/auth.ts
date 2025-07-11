// src/utils/auth.ts
import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'token';
const USER_INFO_KEY = 'userInfo';

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const getUserInfo = (): any => {
  const data = localStorage.getItem(USER_INFO_KEY);
  return data ? JSON.parse(data) : null;
};

export const setUserInfo = (info: any) => {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(info));
};

export const clearUserInfo = () => {
  localStorage.removeItem(USER_INFO_KEY);
};

export const logout = () => {
  clearToken();
  clearUserInfo();
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded: any = jwtDecode(token);
    if (!decoded.exp) return true;

    const expiry = decoded.exp * 1000; // Convert to milliseconds
    return Date.now() > expiry;
  } catch (e) {
    console.error('Invalid token format', e);
    return true;
  }
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) return false;
  return !isTokenExpired(token);
};
