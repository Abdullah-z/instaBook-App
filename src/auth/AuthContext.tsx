import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  saved?: string[];
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
  showOnboarding: boolean | null;
  completeOnboarding: () => Promise<void>;
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
  showOnboarding: null,
  completeOnboarding: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [userType, setUserType] = useState<'user' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    checkOnboarding();
    refreshToken();
  }, []);

  const checkOnboarding = async () => {
    try {
      const value = await AsyncStorage.getItem('HAS_SEEN_ONBOARDING');
      setShowOnboarding(value !== 'true');
    } catch (e) {
      setShowOnboarding(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('HAS_SEEN_ONBOARDING', 'true');
      setShowOnboarding(false);
    } catch (e) {
      console.error('Failed to complete onboarding', e);
    }
  };

  const refreshToken = async () => {
    try {
      const rf_token = await AsyncStorage.getItem('refresh_token');
      if (!rf_token) throw new Error('No refresh token found');

      const res = await API.post('/refresh_token', { refresh_token: rf_token });

      if (res.data.access_token) {
        setToken(res.data.access_token);
        setGlobalToken(res.data.access_token);
        setUser(res.data.user);
        setUserType(res.data.userType);
      } else {
        throw new Error('No access token returned');
      }
    } catch (err) {
      console.log('Refresh token failed', err);
      setToken(null);
      setGlobalToken(null);
      setUser(null);
      setUserType(null);
      await AsyncStorage.removeItem('refresh_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await API.post('/login', { email, password });
    console.log('LOGIN RESPONSE:', res.data);

    if (res.data.status === 0) {
      const error = new Error(res.data.msg || 'Login failed');
      (error as any).response = { data: res.data };
      throw error;
    }

    setToken(res.data.access_token);
    setGlobalToken(res.data.access_token);
    setUser(res.data.user);
    setUserType(res.data.userType);
    if (res.data.refresh_token) {
      await AsyncStorage.setItem('refresh_token', res.data.refresh_token);
    }
  };

  const register = async (data: any) => {
    const res = await API.post('/register', data);
    setToken(res.data.access_token);
    setGlobalToken(res.data.access_token);
    setUser(res.data.user);
    setUserType('user'); // Default to user
    if (res.data.refresh_token) {
      await AsyncStorage.setItem('refresh_token', res.data.refresh_token);
    }
  };
  const logout = async () => {
    try {
      await API.post('/logout');
    } catch (err) {
      console.log('Logout error', err);
    } finally {
      setToken(null);
      setGlobalToken(null);
      setUser(null);
      setUserType(null);
      await AsyncStorage.removeItem('refresh_token');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        userType,
        login,
        register,
        logout,
        loading,
        setUser,
        showOnboarding,
        completeOnboarding,
      }}>
      {children}
    </AuthContext.Provider>
  );
};
