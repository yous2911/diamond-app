import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ParentLogin from '../../../src/screens/auth/ParentLogin';

describe('ParentLogin', () => {
  it('renders the title', () => {
    render(<ParentLogin />);
    const title = screen.getByText('Parent Zone');
    expect(title).toBeDefined();
  });

  it('renders the email and password inputs', () => {
    render(<ParentLogin />);
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    expect(emailInput).toBeDefined();
    expect(passwordInput).toBeDefined();
  });
});
