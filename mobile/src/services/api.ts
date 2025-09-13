import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/auth';

const apiClient = axios.create({
  baseURL: 'http://localhost:3003/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const userString = await AsyncStorage.getItem('user');
    if (userString) {
      const user: User = JSON.parse(userString);
      if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
