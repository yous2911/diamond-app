import React from 'react';
import { render, screen } from '@testing-library/react-native';
import AppNavigator from '../../src/navigation/AppNavigator';
import useAuthStore from '../../src/store/authStore';

jest.mock('../../src/store/authStore');

describe('AppNavigator', () => {
  it('renders AuthNavigator when not authenticated', () => {
    (useAuthStore as jest.Mock).mockReturnValue({ isAuthenticated: false });
    render(<AppNavigator />);
    const title = screen.getByText('Welcome, Kiddo!');
    expect(title).toBeDefined();
  });

  it('renders StudentNavigator when authenticated as a student', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { type: 'student' }
    });
    render(<AppNavigator />);
    const title = screen.getByText('Welcome back, Alex!');
    expect(title).toBeDefined();
  });

  it('renders ParentNavigator when authenticated as a parent', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { type: 'parent' }
    });
    render(<AppNavigator />);
    const title = screen.getByText('Parent Dashboard');
    expect(title).toBeDefined();
  });
});
