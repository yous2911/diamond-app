import apiClient from './api';

export const updateUser = async (userId: number, updates: any): Promise<void> => {
  await apiClient.put(`/users/${userId}`, updates);
};
