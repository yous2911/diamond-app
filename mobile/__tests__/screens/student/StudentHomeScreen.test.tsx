import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import StudentHomeScreen from '../../../src/screens/student/StudentHomeScreen';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <NavigationContainer>
      {children}
    </NavigationContainer>
  );
};

const customRender = (ui: React.ReactElement, options?: any) =>
  render(ui, { wrapper: AllTheProviders, ...options });


describe('StudentHomeScreen', () => {
  it('renders the welcome message', () => {
    customRender(<StudentHomeScreen />);
    const title = screen.getByText('Welcome back, Alex!');
    expect(title).toBeDefined();
  });

  it('renders the daily goals card', () => {
    customRender(<StudentHomeScreen />);
    const cardTitle = screen.getByText('Daily Goals');
    expect(cardTitle).toBeDefined();
  });
});
