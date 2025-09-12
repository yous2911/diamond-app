import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import AppNavigator from '../../src/navigation/AppNavigator';
import { useAuth } from '../../src/contexts/AuthContext';

jest.mock('../../src/contexts/AuthContext');

jest.mock('../../src/navigation/AuthNavigator', () => () => <View><Text testID="auth-navigator">Auth Navigator</Text></View>);
jest.mock('../../src/navigation/StudentNavigator', () => () => <View><Text testID="student-navigator">Student Navigator</Text></View>);
jest.mock('../../src/navigation/ParentNavigator', () => () => <View><Text testID="parent-navigator">Parent Navigator</Text></View>);

const renderWithProviders = (authValue: any) => {
  (useAuth as jest.Mock).mockReturnValue(authValue);
  return render(<AppNavigator />);
};

describe('AppNavigator', () => {
  it('renders AuthNavigator when not authenticated', () => {
    renderWithProviders({ isLoggedIn: false, user: null });
    expect(screen.getByTestId('auth-navigator')).toBeDefined();
  });

  it('renders StudentNavigator when authenticated as a student', () => {
    renderWithProviders({
      isLoggedIn: true,
      user: { type: 'student' },
    });
    expect(screen.getByTestId('student-navigator')).toBeDefined();
  });

  it('renders ParentNavigator when authenticated as a parent', () => {
    renderWithProviders({
      isLoggedIn: true,
      user: { type: 'parent' },
    });
    expect(screen.getByTestId('parent-navigator')).toBeDefined();
  });
});
