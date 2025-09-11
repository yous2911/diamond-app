import { useCallback } from 'react';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useAuthStore from '../store/authStore';
import { loginWithStudentIdentifier, loginWithParentEmail, logout as logoutService } from '../services/auth';
import { User } from '../types';
import apiClient from '../services/api';
import { updateUser } from '../services/user';

const USER_STORAGE_KEY = 'user_data';
const TOKEN_SERVICE = 'com.diamondkids.token';

export const useAuth = () => {
  const { user, isAuthenticated, login: loginStore, logout: logoutStore } = useAuthStore();

  const updateUserPushToken = useCallback(async (pushToken: string) => {
    if (user) {
      await updateUser(user.id, { pushToken });
    }
  }, [user]);

  const loginStudent = useCallback(async (identifier: string) => {
    const userData = await loginWithStudentIdentifier(identifier);
    if (userData && userData.token) {
      await Keychain.setGenericPassword(userData.identifiant, userData.token, { service: TOKEN_SERVICE });
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      loginStore(userData);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
    }
  }, [loginStore]);

  const loginParent = useCallback(async (email: string, pass: string) => {
    const userData = await loginWithParentEmail(email, pass);
    if (userData && userData.token) {
      await Keychain.setGenericPassword(email, userData.token, { service: TOKEN_SERVICE });
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      loginStore(userData);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
    }
  }, [loginStore]);

  const logout = useCallback(async () => {
    await logoutService();
    await Keychain.resetGenericPassword({ service: TOKEN_SERVICE });
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    logoutStore();
    delete apiClient.defaults.headers.common['Authorization'];
  }, [logoutStore]);

  const checkAuth = useCallback(async () => {
    try {
      const credentials = await Keychain.getGenericPassword({ service: TOKEN_SERVICE });
      const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);

      if (credentials && storedUser) {
        const userData: User = JSON.parse(storedUser);
        loginStore(userData);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${credentials.password}`;
        return true;
      }
    } catch (error) {
      console.error('Failed to check auth status', error);
    }
    return false;
  }, [loginStore]);

  return {
    user,
    isAuthenticated,
    loginStudent,
    loginParent,
    logout,
    checkAuth,
  };
};
