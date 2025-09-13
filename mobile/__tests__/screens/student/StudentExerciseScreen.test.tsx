import React from 'react';
import { render, screen, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '../../../src/contexts/AuthContext';
import { PremiumFeaturesProvider } from '../../../src/contexts/PremiumFeaturesContext';
import StudentExerciseScreen from '../../../src/screens/student/StudentExerciseScreen';
import * as exerciseService from '../../../src/services/exerciseService';
import { MathExercise } from '../../../src/types/exercise';

jest.mock('../../../src/services/exerciseService');

const mockExercises: MathExercise[] = [{
  id: '1',
  type: 'math',
  question: '10 + 5 = ?',
  answer: 15,
}];

const mockRoute = {
  params: {
    exercise: mockExercises[0],
  },
};

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useRoute: () => (mockRoute),
    useNavigation: () => ({
      navigate: jest.fn(),
    }),
  };
});


describe('StudentExerciseScreen', () => {
  it('fetches and displays an exercise', async () => {
    (exerciseService.getExercises as jest.Mock).mockResolvedValue(mockExercises);

    render(
      <AuthProvider>
        <PremiumFeaturesProvider>
          <NavigationContainer>
            <StudentExerciseScreen />
          </NavigationContainer>
        </PremiumFeaturesProvider>
      </AuthProvider>
    );

    // The component shows a loader initially, then fetches the exercise.
    // We need to wait for the exercise to be displayed.
    await act(async () => {
      // Let the useEffect run
    });

    const question = await screen.findByText('10 + 5 = ?');
    expect(question).toBeDefined();
  });
});
