import apiClient from './api';
import { User } from '../types';

export const loginWithStudentIdentifier = async (identifier: string): Promise<User> => {
  const { data } = await apiClient.post('/auth/login/student', { identifier });
  return data.user;
};

export const loginWithParentEmail = async (email: string, pass: string): Promise<User> => {
  const { data } = await apiClient.post('/auth/login/parent', { email, pass });
  return data.user;
};

export const logout = async (): Promise<void> => {
    await apiClient.post('/auth/logout');
};
