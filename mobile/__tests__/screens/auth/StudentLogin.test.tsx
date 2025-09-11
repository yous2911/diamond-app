import React from 'react';
import { render, screen } from '@testing-library/react-native';
import StudentLogin from '../../../src/screens/auth/StudentLogin';

describe('StudentLogin', () => {
  it('renders the title', () => {
    render(<StudentLogin />);
    const title = screen.getByText('Welcome, Kiddo!');
    expect(title).toBeDefined();
  });

  it('renders the name input', () => {
    render(<StudentLogin />);
    const input = screen.getByPlaceholderText('Enter your name');
    expect(input).toBeDefined();
  });
});
