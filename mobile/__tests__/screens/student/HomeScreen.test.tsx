import React from 'react';
import { render, screen } from '@testing-library/react-native';
import StudentHomeScreen from '../../../src/screens/student/HomeScreen';

describe('StudentHomeScreen', () => {
  it('renders the welcome message', () => {
    render(<StudentHomeScreen />);
    const title = screen.getByText('Welcome back, Alex!');
    expect(title).toBeDefined();
  });

  it('renders the daily goals card', () => {
    render(<StudentHomeScreen />);
    const cardTitle = screen.getByText('Daily Goals');
    expect(cardTitle).toBeDefined();
  });
});
