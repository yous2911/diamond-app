import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '../../../src/contexts/AuthContext';
import { PremiumFeaturesProvider } from '../../../src/contexts/PremiumFeaturesContext';
import StudentHomeScreen from '../../../src/screens/student/StudentHomeScreen';

jest.mock('../../../src/hooks/useApiData', () => ({
  useExercises: () => ({ data: [], loading: false, error: null }),
  useStudentStats: () => ({ data: { totalXp: 100, level: 1, exercisesCompleted: 10 }, loading: false, error: null }),
  useMascot: () => ({ data: { emotion: 'happy' }, updateEmotion: jest.fn() }),
}));

jest.mock('../../../src/contexts/AuthContext', () => ({
  ...jest.requireActual('../../../src/contexts/AuthContext'),
  useAuth: () => ({
    user: { name: 'Alex', type: 'student', niveau: 'CP', id: 'student-123' },
    isLoggedIn: true,
    logout: jest.fn(),
  }),
}));

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));


const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <PremiumFeaturesProvider>
        <NavigationContainer>{children}</NavigationContainer>
      </PremiumFeaturesProvider>
    </AuthProvider>
  );
};

const customRender = (ui: React.ReactElement, options?: any) =>
  render(ui, { wrapper: AllTheProviders, ...options });


describe('StudentHomeScreen', () => {
  it('renders the welcome message', () => {
    customRender(<StudentHomeScreen />);
    const title = screen.getByText('Bonjour Alex ! 👋');
    expect(title).toBeDefined();
  });

  it('renders the subjects grid', () => {
    customRender(<StudentHomeScreen />);
    const cardTitle = screen.getByText('Mathématiques');
    expect(cardTitle).toBeDefined();
  });
});
