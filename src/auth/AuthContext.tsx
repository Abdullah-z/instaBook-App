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
  isAmbientEnabled: boolean;
  toggleAmbientMode: (value: boolean) => Promise<void>;
  isGridViewEnabled: boolean;
  toggleGridView: (value: boolean) => Promise<void>;
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
  isAmbientEnabled: true,
  toggleAmbientMode: async () => {},
  isGridViewEnabled: true,
  toggleGridView: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [userType, setUserType] = useState<'user' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [isAmbientEnabled, setIsAmbientEnabled] = useState<boolean>(true);
  const [isGridViewEnabled, setIsGridViewEnabled] = useState<boolean>(true);

  useEffect(() => {
    checkOnboarding();
    loadAmbientPref();
    loadGridViewPref();
    loadCachedUser(); // Restore session instantly before network
    refreshToken();  // Then try to get a fresh token in background
  }, []);

  // Load previously cached user so app works offline immediately
  const loadCachedUser = async () => {
    try {
      const cached = await AsyncStorage.getItem('cached_user');
      const cachedType = await AsyncStorage.getItem('cached_user_type');
      if (cached) {
        const parsedUser = JSON.parse(cached);
        setUser(parsedUser);
        setUserType((cachedType as 'user' | 'admin' | null) || 'user');
      }
    } catch (e) {
      console.log('Failed to load cached user', e);
    }
  };

  const loadGridViewPref = async () => {
    try {
      const val = await AsyncStorage.getItem('IS_GRID_VIEW_ENABLED');
      if (val !== null) {
        setIsGridViewEnabled(val === 'true');
      }
    } catch (e) {
      console.log('Failed to load grid view pref', e);
    }
  };

  const toggleGridView = async (value: boolean) => {
    try {
      setIsGridViewEnabled(value);
      await AsyncStorage.setItem('IS_GRID_VIEW_ENABLED', value.toString());
    } catch (e) {
      console.log('Failed to save grid view pref', e);
    }
  };

  const loadAmbientPref = async () => {
    try {
      const val = await AsyncStorage.getItem('IS_AMBIENT_ENABLED');
      if (val !== null) {
        setIsAmbientEnabled(val === 'true');
      }
    } catch (e) {
      console.log('Failed to load ambient pref', e);
    }
  };

  const toggleAmbientMode = async (value: boolean) => {
    try {
      setIsAmbientEnabled(value);
      await AsyncStorage.setItem('IS_AMBIENT_ENABLED', value.toString());
    } catch (e) {
      console.log('Failed to save ambient pref', e);
    }
  };

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
        // Update the cache with fresh data
        await AsyncStorage.setItem('cached_user', JSON.stringify(res.data.user));
        await AsyncStorage.setItem('cached_user_type', res.data.userType || 'user');
      } else {
        throw new Error('No access token returned');
      }
    } catch (err: any) {
      const isNetworkError =
        err?.message === 'Network Error' ||
        err?.code === 'ECONNABORTED' ||
        !err?.response;

      if (isNetworkError) {
        // OFFLINE: keep cached session alive — don't log the user out
        console.log('[AuthContext] Offline — keeping cached session active');
        // token stays null (no server calls work) but user stays set from loadCachedUser
      } else {
        // Real auth error (expired/invalid refresh token) — clear session
        console.log('[AuthContext] Auth error — clearing session:', err?.response?.status);
        setToken(null);
        setGlobalToken(null);
        setUser(null);
        setUserType(null);
        await AsyncStorage.multiRemove(['refresh_token', 'cached_user', 'cached_user_type']);
      }
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
    // Cache user for offline use
    await AsyncStorage.setItem('cached_user', JSON.stringify(res.data.user));
    await AsyncStorage.setItem('cached_user_type', res.data.userType || 'user');
  };

  const register = async (data: any) => {
    const res = await API.post('/register', data);
    setToken(res.data.access_token);
    setGlobalToken(res.data.access_token);
    setUser(res.data.user);
    setUserType('user');
    if (res.data.refresh_token) {
      await AsyncStorage.setItem('refresh_token', res.data.refresh_token);
    }
    // Cache for offline use
    await AsyncStorage.setItem('cached_user', JSON.stringify(res.data.user));
    await AsyncStorage.setItem('cached_user_type', 'user');
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
      await AsyncStorage.multiRemove(['refresh_token', 'cached_user', 'cached_user_type']);
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
        isAmbientEnabled,
        toggleAmbientMode,
        isGridViewEnabled,
        toggleGridView,
      }}>
      {children}
    </AuthContext.Provider>
  );
};
