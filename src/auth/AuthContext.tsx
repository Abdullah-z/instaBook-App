import React, { createContext, useState, useEffect, ReactNode } from 'react';
import API from '../api/axios';
import { setToken as setGlobalToken } from './tokenManager';

interface UserType {
  _id: string;
  username: string;
  avatar: string;
  cover?: string;
  fullname?: string;
  mobile?: string;
  address?: string;
  website?: string;
  story?: string;
  gender?: string;
}

interface AuthContextType {
  token: string | null;
  user: UserType | null;
  userType: 'user' | 'admin' | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
  setUser: (user: UserType | null) => void;
}

export const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  userType: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  loading: true,
  setUser: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [userType, setUserType] = useState<'user' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshToken();
  }, []);

  const refreshToken = async () => {
    try {
      const res = await API.post('/refresh_token');

      if (res.data.access_token) {
        setToken(res.data.access_token);
        setGlobalToken(res.data.access_token); // ✅ here
        setUser(res.data.user);
        setUserType(res.data.userType);
      } else {
        throw new Error('No access token returned');
      }
    } catch (err) {
      console.log('Refresh token failed', err);
      setToken(null);
      setGlobalToken(null); // ✅ here
      setUser(null);
      setUserType(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await API.post('/login', { email, password });
    console.log('LOGIN RESPONSE:', res.data); // 👈 Check this
    setToken(res.data.access_token);
    setGlobalToken(res.data.access_token);
    setUser(res.data.user);
    setUserType(res.data.userType);
  };

  const register = async (data: any) => {
    const res = await API.post('/register', data);
    setToken(res.data.access_token);
    setGlobalToken(res.data.access_token);
    setUser(res.data.user);
    setUserType('user'); // Default to user
  };
  const logout = async () => {
    try {
      await API.post('/logout');
    } catch (err) {
      console.log('Logout error', err);
    } finally {
      setToken(null);
      setGlobalToken(null); // ✅ here
      setUser(null);
      setUserType(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ token, user, userType, login, register, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
