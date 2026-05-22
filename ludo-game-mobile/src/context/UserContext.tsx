import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';

interface User {
  id: number;
  username: string;
  email?: string;
  balance: number;
}

interface UserContextType {
  user: User | null;
  setUser: (u: User | null) => void;
  refreshBalance: () => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({ user: null, setUser: () => {}, refreshBalance: async () => {}, logout: async () => {} });

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    try {
      const saved = await AsyncStorage.getItem('user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.id) {
          try {
            const data = await api.getWallet(parsed.id);
            if (data.success && data.user) {
              const updated = { id: parsed.id, username: data.user.username, email: parsed.email, balance: data.user.balance };
              setUser(updated);
              await AsyncStorage.setItem('user', JSON.stringify(updated));
            }
          } catch (e) { setUser(parsed); }
        }
      }
    } catch (e) {}
    setLoading(false);
  };

  const refreshBalance = async () => {
    if (!user?.id) return;
    try {
      const data = await api.getWallet(user.id);
      if (data.success && data.user) {
        const updated = { ...user, balance: data.user.balance };
        setUser(updated);
        await AsyncStorage.setItem('user', JSON.stringify(updated));
      }
    } catch (e) {}
  };

  const logout = async () => { await AsyncStorage.removeItem('user'); setUser(null); };

  if (loading) return null;
  return <UserContext.Provider value={{ user, setUser, refreshBalance, logout }}>{children}</UserContext.Provider>;
}

export function useUser() { return useContext(UserContext); }
