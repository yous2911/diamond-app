import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import StudentLogin from '../../../src/screens/auth/StudentLogin';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <NavigationContainer>
      {children}
    </NavigationContainer>
  );
};

const customRender = (ui: React.ReactElement, options?: any) =>
  render(ui, { wrapper: AllTheProviders, ...options });


describe('StudentLogin', () => {
  it('renders the title', () => {
    customRender(<StudentLogin />);
    const title = screen.getByText('Welcome, Kiddo!');
    expect(title).toBeDefined();
  });

  it('renders the name input', () => {
    customRender(<StudentLogin />);
    const input = screen.getByPlaceholderText('Enter your name');
    expect(input).toBeDefined();
  });
});
