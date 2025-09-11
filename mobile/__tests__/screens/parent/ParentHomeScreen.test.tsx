import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import ParentHomeScreen from '../../../src/screens/parent/ParentHomeScreen';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <NavigationContainer>
      {children}
    </NavigationContainer>
  );
};

const customRender = (ui: React.ReactElement, options?: any) =>
  render(ui, { wrapper: AllTheProviders, ...options });


describe('ParentHomeScreen', () => {
  it('renders the title', () => {
    customRender(<ParentHomeScreen />);
    const title = screen.getByText('Parent Dashboard');
    expect(title).toBeDefined();
  });

  it('renders the learning analytics card', () => {
    customRender(<ParentHomeScreen />);
    const cardTitle = screen.getByText('Learning Analytics');
    expect(cardTitle).toBeDefined();
  });
});
