import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ParentHomeScreen from '../../../src/screens/parent/ParentHomeScreen';

describe('ParentHomeScreen', () => {
  it('renders the title', () => {
    render(<ParentHomeScreen />);
    const title = screen.getByText('Parent Dashboard');
    expect(title).toBeDefined();
  });

  it('renders the learning analytics card', () => {
    render(<ParentHomeScreen />);
    const cardTitle = screen.getByText('Learning Analytics');
    expect(cardTitle).toBeDefined();
  });
});
