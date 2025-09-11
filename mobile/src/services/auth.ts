import apiClient from './api';
import { User } from '../types/auth';

// This is a mock login function. In a real app, this would make an API call.
export const loginWithStudentName = async (name: string): Promise<User> => {
  console.log(`Logging in with name: ${name}`);
  // Simulate an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockUser: User = {
        id: 'student-123',
        name: name,
        type: 'student',
        token: 'mock-student-token',
      };
      resolve(mockUser);
    }, 1000);
  });
};

export const loginWithEmailPassword = async (email: string, pass: string): Promise<User> => {
  console.log(`Logging in with email: ${email}`);
  // Simulate an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockUser: User = {
        id: 'parent-456',
        name: 'Parent User',
        email: email,
        type: 'parent',
        token: 'mock-parent-token',
      };
      resolve(mockUser);
    }, 1000);
  });
};
