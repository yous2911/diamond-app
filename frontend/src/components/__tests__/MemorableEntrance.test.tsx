import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import MemorableEntrance from '../MemorableEntrance';
import { useGPUPerformance } from '../../hooks/useGPUPerformance';

// Mock dependencies
jest.mock('../../hooks/useGPUPerformance');
jest.mock('../MicroInteractions', () => ({ children, ...props }: any) => <div {...props}>{children}</div>);

// Mock framer-motion
jest.mock('framer-motion', () => {
  const original = jest.requireActual('framer-motion');
  return {
    ...original,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      ...original.motion,
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
      h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
      p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    },
    useAnimation: () => ({
      start: jest.fn(() => Promise.resolve()),
    }),
  };
});

const mockUseGPUPerformance = useGPUPerformance as jest.Mock;

describe('MemorableEntrance', () => {
  const onCompleteMock = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    onCompleteMock.mockClear();
    mockUseGPUPerformance.mockReturnValue({
      getOptimalDuration: (d: number) => d,
      shouldUseComplexAnimation: () => true,
      performanceTier: 'high',
      getOptimalParticleCount: (c: number) => c,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render the initial logo phase', () => {
    render(
      <MemorableEntrance
        studentName="Test"
        level="CP"
        onComplete={onCompleteMock}
      />
    );
    expect(screen.getByText('DIAMOND APP')).toBeInTheDocument();
  });

  it('should transition to the greeting phase', async () => {
    render(
      <MemorableEntrance
        studentName="Alice"
        level="CE1"
        onComplete={onCompleteMock}
      />
    );

    await act(async () => {
      jest.advanceTimersByTime(500); // Wait for greeting phase
    });

    await waitFor(() => {
      expect(screen.getByText('Salut Alice !')).toBeInTheDocument();
    });
  });

  it('should show achievements if provided', async () => {
    const achievements = ['Premier exercice !'];
    render(
      <MemorableEntrance
        studentName="Alice"
        level="CE1"
        onComplete={onCompleteMock}
        achievements={achievements}
      />
    );

    await act(async () => {
      jest.advanceTimersByTime(1000); // Wait for achievements phase
    });

    await waitFor(() => {
      expect(screen.getByText('Tes derniers succès !')).toBeInTheDocument();
      expect(screen.getByText('⭐ Premier exercice !')).toBeInTheDocument();
    });
  });

  it('should transition to the ready phase', async () => {
    render(
      <MemorableEntrance
        studentName="Alice"
        level="CE1"
        onComplete={onCompleteMock}
      />
    );

    await act(async () => {
      jest.advanceTimersByTime(1800); // Wait for ready phase
    });

    await waitFor(() => {
      expect(screen.getByText("C'est parti !")).toBeInTheDocument();
    });
  });

  it('should call onComplete and disappear after the sequence', async () => {
    const { container } = render(
      <MemorableEntrance
        studentName="Alice"
        level="CE1"
        onComplete={onCompleteMock}
      />
    );

    await act(async () => {
      jest.advanceTimersByTime(3000); // Fast-forward past the entire sequence
    });

    await waitFor(() => {
      expect(onCompleteMock).toHaveBeenCalledTimes(1);
      expect(container.firstChild).toBeNull();
    });
  });
});
