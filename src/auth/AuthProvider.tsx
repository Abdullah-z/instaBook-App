import React, { useState, ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import API from '../api/axios';

interface Props {
  children: ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    const res = await API.post('/login', { email, password });
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>
  );
};
