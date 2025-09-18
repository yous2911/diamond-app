import React from 'react';
import { render, screen, act } from '@testing-library/react';
import {
  CelebrationProvider,
  useCelebrations,
} from '../CelebrationContext';
import { useAuth } from '../AuthContext';

// Mock dependencies
jest.mock('../AuthContext');
jest.mock('../../components/CelebrationSystem', () => (props: any) => {
  // Mock the celebration system to immediately call onComplete
  React.useEffect(() => {
    if (props.onComplete) {
      setTimeout(props.onComplete, 100);
    }
  }, [props.onComplete]);
  return <div data-testid="celebration-system">{props.type}</div>;
});

const mockUseAuth = useAuth as jest.Mock;

describe('CelebrationContext', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      student: { prenom: 'Test' },
    });
  });

  const TestConsumer = () => {
    const { celebrate, queueCelebration, iscelebrating, currentCelebration, checkForCelebrations } = useCelebrations();
    return (
      <div>
        <button onClick={() => celebrate('level_up', { newLevel: 2 })}>
          Celebrate
        </button>
        <button onClick={() => queueCelebration('streak', { streakCount: 3 })}>
          Queue Celebration
        </button>
        <button onClick={() => checkForCelebrations({ score: 100, isCorrect: true, streakBefore: 2, streakAfter: 3 }, { currentLevel: 2, previousLevel: 1 })}>
          Check For Celebrations
        </button>
        <div data-testid="iscelebrating">{iscelebrating.toString()}</div>
        <div data-testid="current-type">{currentCelebration.type}</div>
      </div>
    );
  };

  it('should provide celebration context values', () => {
    render(
      <CelebrationProvider>
        <TestConsumer />
      </CelebrationProvider>
    );
    expect(screen.getByTestId('iscelebrating').textContent).toBe('false');
  });

  it('should trigger a celebration when celebrate is called', () => {
    render(
      <CelebrationProvider>
        <TestConsumer />
      </CelebrationProvider>
    );

    act(() => {
      screen.getByText('Celebrate').click();
    });

    expect(screen.getByTestId('iscelebrating').textContent).toBe('true');
    expect(screen.getByTestId('celebration-system').textContent).toBe('level_up');
  });

  it('should queue celebrations if one is already active', async () => {
    render(
      <CelebrationProvider>
        <TestConsumer />
      </CelebrationProvider>
    );

    // Start first celebration
    act(() => {
      screen.getByText('Celebrate').click();
    });

    expect(screen.getByTestId('iscelebrating').textContent).toBe('true');
    expect(screen.getByTestId('celebration-system').textContent).toBe('level_up');

    // Queue a second one while the first is "active"
    act(() => {
      screen.getByText('Queue Celebration').click();
    });

    // The component should still show the first celebration
    expect(screen.getByTestId('celebration-system').textContent).toBe('level_up');

    // Wait for the first celebration to complete and the queue to be processed
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 600)); // wait for onComplete + queue processing
    });

    // Now the second celebration from the queue should be active
    expect(screen.getByTestId('iscelebrating').textContent).toBe('true');
    expect(screen.getByTestId('celebration-system').textContent).toBe('streak');
  });

  it('should correctly identify a level up via checkForCelebrations', () => {
    render(
      <CelebrationProvider>
        <TestConsumer />
      </CelebrationProvider>
    );

    act(() => {
      screen.getByText('Check For Celebrations').click();
    });

    expect(screen.getByTestId('iscelebrating').textContent).toBe('true');
    // It should prioritize level_up over other celebrations
    expect(screen.getByTestId('celebration-system').textContent).toBe('level_up');
  });
});
