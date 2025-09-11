import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import ParentLogin from '../../../src/screens/auth/ParentLogin';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <NavigationContainer>
      {children}
    </NavigationContainer>
  );
};

const customRender = (ui: React.ReactElement, options?: any) =>
  render(ui, { wrapper: AllTheProviders, ...options });


describe('ParentLogin', () => {
  it('renders the title', () => {
    customRender(<ParentLogin />);
    const title = screen.getByText('Parent Zone');
    expect(title).toBeDefined();
  });

  it('renders the email and password inputs', () => {
    customRender(<ParentLogin />);
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    expect(emailInput).toBeDefined();
    expect(passwordInput).toBeDefined();
  });
});
