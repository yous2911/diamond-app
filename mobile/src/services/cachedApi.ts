import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './api';

const CACHE_PREFIX = 'api_cache_';
const CACHE_EXPIRATION = 1000 * 60 * 60; // 1 hour

const getCacheKey = (url: string, params?: any) => {
  const paramsString = params ? JSON.stringify(params) : '';
  return `${CACHE_PREFIX}${url}${paramsString}`;
};

const cachedApiClient = {
  get: async (url: string, params?: any) => {
    const cacheKey = getCacheKey(url, params);
    try {
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        const { timestamp, data } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_EXPIRATION) {
          return { data };
        }
      }
    } catch (error) {
      console.error('Failed to read from cache', error);
    }

    const response = await apiClient.get(url, { params });
    try {
      const cacheValue = JSON.stringify({
        timestamp: Date.now(),
        data: response.data,
      });
      await AsyncStorage.setItem(cacheKey, cacheValue);
    } catch (error) {
      console.error('Failed to write to cache', error);
    }

    return response;
  },
};

export default cachedApiClient;
