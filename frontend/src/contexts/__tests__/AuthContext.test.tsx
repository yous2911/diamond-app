import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { apiService, Student } from '../../services/api';

// Mock the apiService
jest.mock('../../services/api', () => ({
  apiService: {
    login: jest.fn(),
    logout: jest.fn(),
    checkAuthStatus: jest.fn().mockResolvedValue(false), // Default to not authenticated
    getStudentProfile: jest.fn(),
  },
}));

const mockApiService = apiService as jest.Mocked<typeof apiService>;

const mockStudent: Student = {
  id: 1,
  nom: 'Doe',
  prenom: 'John',
  email: 'john.doe@example.com',
  classe: 'CP',
  estConnecte: true,
};

// A simple component to consume and display the context values
const AuthConsumerComponent = () => {
  const {
    isAuthenticated, isLoading, student, error,
    login, logout, clearError, refreshStudentData
  } = useAuth();

  return (
    <div>
      <div data-testid="isAuthenticated">{isAuthenticated.toString()}</div>
      <div data-testid="isLoading">{isLoading.toString()}</div>
      <div data-testid="student">{student ? student.prenom : 'null'}</div>
      <div data-testid="error">{error || 'null'}</div>
      <button onClick={() => login({ email: 'test@test.com', password: 'password' })}>Login</button>
      <button onClick={() => logout()}>Logout</button>
      <button onClick={() => clearError()}>Clear Error</button>
      <button onClick={() => refreshStudentData()}>Refresh Data</button>
    </div>
  );
};

const renderWithProvider = () => {
  return render(
    <AuthProvider>
      <AuthConsumerComponent />
    </AuthProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Since checkAuthStatus is called on mount, we need to handle its resolution
    mockApiService.checkAuthStatus.mockResolvedValue(false);
  });

  it('provides the initial state correctly', async () => {
    renderWithProvider();
    // checkAuthStatus is called on mount, so we wait for loading to be false
    await waitFor(() => expect(screen.getByTestId('isLoading')).toHaveTextContent('false'));
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('student')).toHaveTextContent('null');
    expect(screen.getByTestId('error')).toHaveTextContent('null');
  });

  it('handles successful login', async () => {
    mockApiService.login.mockResolvedValue({
      success: true,
      data: { student: mockStudent, expiresIn: 3600 }
    });

    renderWithProvider();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    });

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('student')).toHaveTextContent('John');
      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });

    expect(mockApiService.login).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password' });
  });

  it('handles failed login', async () => {
    const error = { message: 'Invalid credentials', code: 'AUTH_ERROR' };
    mockApiService.login.mockResolvedValue({ success: false, error });

    renderWithProvider();
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    });

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('student')).toHaveTextContent('null');
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
    });
  });

  it('handles logout', async () => {
    // First login to get into authenticated state
    mockApiService.login.mockResolvedValue({
      success: true,
      data: { student: mockStudent, expiresIn: 3600 }
    });

    renderWithProvider();

    // Login first
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    });

    await waitFor(() => expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true'));
    expect(screen.getByTestId('student')).toHaveTextContent('John');

    // Now test logout
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Logout/i }));
    });

    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('student')).toHaveTextContent('null');
    });
    expect(mockApiService.logout).toHaveBeenCalled();
  });

  it('clears an error message', async () => {
    const error = { message: 'An error occurred', code: 'GENERIC_ERROR' };
    mockApiService.login.mockResolvedValue({ success: false, error });

    renderWithProvider();

    // Create an error
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    });
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('An error occurred'));

    // Clear the error
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Clear Error/i }));
    });

    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('null'));
  });

  it('refreshes student data when authenticated', async () => {
    const updatedStudent = { ...mockStudent, prenom: 'Johnny' };
    
    // First login to get into authenticated state
    mockApiService.login.mockResolvedValue({
      success: true,
      data: { student: mockStudent, expiresIn: 3600 }
    });
    
    // Mock the refresh call
    mockApiService.getStudentProfile.mockResolvedValue({ success: true, data: { student: updatedStudent } });

    renderWithProvider();

    // Login first
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    });

    await waitFor(() => expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true'));
    expect(screen.getByTestId('student')).toHaveTextContent('John');

    // Trigger refresh
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Refresh Data/i }));
    });

    await waitFor(() => expect(screen.getByTestId('student')).toHaveTextContent('Johnny'));
    expect(mockApiService.getStudentProfile).toHaveBeenCalled();
  });
});
