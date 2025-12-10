import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authService from '../services/auth';
import { User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  student: User | null; // Alias for user when it is a student
  isLoggedIn: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error("Failed to load user from storage", e);
      } finally {
        setLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      const loggedInUser = await authService.loginWithEmailPassword(email, pass);
      setUser(loggedInUser);
      await AsyncStorage.setItem('user', JSON.stringify(loggedInUser));
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
      throw err; // Re-throw error to be caught by the UI
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setUser(null);
    try {
      await AsyncStorage.removeItem('user');
    } catch (e) {
      console.error("Failed to remove user from storage", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      student: user, // Alias user to student for compatibility
      isLoggedIn: !!user,
      login,
      logout,
      loading,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
