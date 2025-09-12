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
  const response = await apiClient.post('/auth/login', { email, password: pass });
  // The backend should return the user object and a token
  // The user object from the backend might have a different shape,
  // so in a real app, you might need to map it to the frontend User type.
  // For now, we assume the backend returns a User object compatible with our type.
  return response.data;
};
