import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import {
  LazyComponentWrapper,
  SmartMascotSystem,
  SmartWardrobe3D,
  SmartParticleEngine,
  SmartMathGame,
  SmartPhonicsGame,
  SmartMentalMath,
  SmartAchievementBadges,
  SmartProgressTracker,
  useLazyLoadingPerformance
} from '../LazyComponents';

jest.mock('../ui/SkeletonLoader', () => {
  return function MockSkeletonLoader({ type }: { type: string }) {
    return <div data-testid={`skeleton-${type}`}>Loading {type}...</div>;
  };
});

jest.mock('../AdvancedMascotSystem', () => {
  return function MockAdvancedMascotSystem(props: any) {
    return <div data-testid="advanced-mascot-system">Advanced Mascot System {JSON.stringify(props)}</div>;
  };
});

jest.mock('../mascot/MascotWardrobe3D', () => {
  return function MockMascotWardrobe3D(props: any) {
    return <div data-testid="mascot-wardrobe-3d">Mascot Wardrobe 3D {JSON.stringify(props)}</div>;
  };
});

jest.mock('../AdvancedParticleEngine', () => {
  return function MockAdvancedParticleEngine(props: any) {
    return <div data-testid="advanced-particle-engine">Advanced Particle Engine {JSON.stringify(props)}</div>;
  };
});

jest.mock('../games/EnhancedMathGame', () => ({
  EnhancedMathGame: function MockEnhancedMathGame(props: any) {
    return <div data-testid="enhanced-math-game">Enhanced Math Game {JSON.stringify(props)}</div>;
  }
}));

jest.mock('../games/FrenchPhonicsGame', () => ({
  FrenchPhonicsGame: function MockFrenchPhonicsGame(props: any) {
    return <div data-testid="french-phonics-game">French Phonics Game {JSON.stringify(props)}</div>;
  }
}));

jest.mock('../games/MysteryWordGame', () => {
  return function MockMysteryWordGame(props: any) {
    return <div data-testid="mystery-word-game">Mystery Word Game {JSON.stringify(props)}</div>;
  };
});

jest.mock('../exercises/MentalMathExercise', () => {
  return function MockMentalMathExercise(props: any) {
    return <div data-testid="mental-math-exercise">Mental Math Exercise {JSON.stringify(props)}</div>;
  };
});

jest.mock('../dashboard/AchievementBadges', () => {
  return function MockAchievementBadges(props: any) {
    return <div data-testid="achievement-badges">Achievement Badges {JSON.stringify(props)}</div>;
  };
});

jest.mock('../progress/ProgressTracker', () => {
  return function MockProgressTracker(props: any) {
    return <div data-testid="progress-tracker">Progress Tracker {JSON.stringify(props)}</div>;
  };
});

const MockComponent = React.lazy(() =>
  Promise.resolve({
    default: function MockLazyComponent(props: any) {
      return <div data-testid="mock-lazy-component">Mock Lazy Component {JSON.stringify(props)}</div>;
    }
  })
);

describe('LazyComponents', () => {
  describe('LazyComponentWrapper', () => {
    it('renders skeleton loader while component is loading', () => {
      render(
        <LazyComponentWrapper
          component={MockComponent}
          skeletonType="card"
          className="test-class"
        />
      );

      expect(screen.getByTestId('skeleton-card')).toBeInTheDocument();
      expect(screen.getByText('Loading card...')).toBeInTheDocument();
    });

    it('renders the lazy component after loading', async () => {
      render(
        <LazyComponentWrapper
          component={MockComponent}
          skeletonType="card"
          testProp="test-value"
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('mock-lazy-component')).toBeInTheDocument();
      });

      expect(screen.getByText(/Mock Lazy Component.*testProp.*test-value/)).toBeInTheDocument();
    });

    it('renders custom fallback when provided', () => {
      const customFallback = <div data-testid="custom-fallback">Custom Loading...</div>;

      render(
        <LazyComponentWrapper
          component={MockComponent}
          fallback={customFallback}
        />
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
    });

    it('applies className to fallback container', () => {
      render(
        <LazyComponentWrapper
          component={MockComponent}
          className="custom-wrapper-class"
        />
      );

      const container = screen.getByTestId('skeleton-card').closest('div');
      expect(container).toHaveClass('custom-wrapper-class');
    });

    it('passes through additional props to component', async () => {
      render(
        <LazyComponentWrapper
          component={MockComponent}
          customProp="custom-value"
          anotherProp={42}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('mock-lazy-component')).toBeInTheDocument();
      });

      const componentText = screen.getByTestId('mock-lazy-component').textContent;
      expect(componentText).toContain('customProp');
      expect(componentText).toContain('custom-value');
      expect(componentText).toContain('anotherProp');
      expect(componentText).toContain('42');
    });
  });

  describe('Smart Component Wrappers', () => {
    it('renders SmartMascotSystem with correct skeleton', () => {
      render(<SmartMascotSystem testProp="mascot-test" />);

      expect(screen.getByTestId('skeleton-mascot')).toBeInTheDocument();
    });

    it('renders SmartWardrobe3D with correct skeleton', () => {
      render(<SmartWardrobe3D testProp="wardrobe-test" />);

      expect(screen.getByTestId('skeleton-wardrobe')).toBeInTheDocument();
    });

    it('renders SmartParticleEngine with correct skeleton', () => {
      render(<SmartParticleEngine testProp="particle-test" />);

      expect(screen.getByTestId('skeleton-card')).toBeInTheDocument();
    });

    it('renders SmartMathGame with correct skeleton', () => {
      render(<SmartMathGame testProp="math-test" />);

      expect(screen.getByTestId('skeleton-exercise')).toBeInTheDocument();
    });

    it('renders SmartPhonicsGame with correct skeleton', () => {
      render(<SmartPhonicsGame testProp="phonics-test" />);

      expect(screen.getByTestId('skeleton-exercise')).toBeInTheDocument();
    });

    it('renders SmartMentalMath with correct skeleton', () => {
      render(<SmartMentalMath testProp="mental-math-test" />);

      expect(screen.getByTestId('skeleton-exercise')).toBeInTheDocument();
    });

    it('renders SmartAchievementBadges with correct skeleton', () => {
      render(<SmartAchievementBadges testProp="achievement-test" />);

      expect(screen.getByTestId('skeleton-card')).toBeInTheDocument();
    });

    it('renders SmartProgressTracker with correct skeleton', () => {
      render(<SmartProgressTracker testProp="progress-test" />);

      expect(screen.getByTestId('skeleton-xp-bar')).toBeInTheDocument();
    });
  });

  describe('Smart Components Loading', () => {
    it('loads SmartMascotSystem component after skeleton', async () => {
      render(<SmartMascotSystem testProp="mascot-test" />);

      await waitFor(() => {
        expect(screen.getByTestId('advanced-mascot-system')).toBeInTheDocument();
      });

      expect(screen.getByText(/Advanced Mascot System.*testProp.*mascot-test/)).toBeInTheDocument();
    });

    it('loads SmartWardrobe3D component after skeleton', async () => {
      render(<SmartWardrobe3D testProp="wardrobe-test" />);

      await waitFor(() => {
        expect(screen.getByTestId('mascot-wardrobe-3d')).toBeInTheDocument();
      });

      expect(screen.getByText(/Mascot Wardrobe 3D.*testProp.*wardrobe-test/)).toBeInTheDocument();
    });

    it('loads SmartMathGame component after skeleton', async () => {
      render(<SmartMathGame testProp="math-test" />);

      await waitFor(() => {
        expect(screen.getByTestId('enhanced-math-game')).toBeInTheDocument();
      });

      expect(screen.getByText(/Enhanced Math Game.*testProp.*math-test/)).toBeInTheDocument();
    });

    it('loads SmartAchievementBadges component after skeleton', async () => {
      render(<SmartAchievementBadges testProp="achievement-test" />);

      await waitFor(() => {
        expect(screen.getByTestId('achievement-badges')).toBeInTheDocument();
      });

      expect(screen.getByText(/Achievement Badges.*testProp.*achievement-test/)).toBeInTheDocument();
    });
  });

  describe('useLazyLoadingPerformance', () => {
    it('initializes with empty states', () => {
      const { result } = renderHook(() => useLazyLoadingPerformance());

      expect(result.current.loadingStates).toEqual({});
      expect(result.current.loadTimes).toEqual({});
      expect(result.current.isAnyLoading).toBe(false);
      expect(result.current.averageLoadTime).toBe(0);
    });

    it('tracks component loading state', () => {
      const { result } = renderHook(() => useLazyLoadingPerformance());

      act(() => {
        const finishLoading = result.current.trackComponentLoad('TestComponent');
        expect(result.current.loadingStates.TestComponent).toBe(true);
        expect(result.current.isAnyLoading).toBe(true);

        finishLoading();
      });

      expect(result.current.loadingStates.TestComponent).toBe(false);
      expect(result.current.isAnyLoading).toBe(false);
      expect(result.current.loadTimes.TestComponent).toBeGreaterThan(0);
    });

    it('calculates average load time correctly', () => {
      const { result } = renderHook(() => useLazyLoadingPerformance());

      act(() => {
        const finish1 = result.current.trackComponentLoad('Component1');
        setTimeout(finish1, 0);

        const finish2 = result.current.trackComponentLoad('Component2');
        setTimeout(finish2, 0);
      });

      expect(result.current.averageLoadTime).toBeGreaterThan(0);
      expect(Object.keys(result.current.loadTimes)).toHaveLength(2);
    });

    it('handles multiple loading states', () => {
      const { result } = renderHook(() => useLazyLoadingPerformance());

      act(() => {
        result.current.trackComponentLoad('Component1');
        result.current.trackComponentLoad('Component2');
      });

      expect(result.current.loadingStates.Component1).toBe(true);
      expect(result.current.loadingStates.Component2).toBe(true);
      expect(result.current.isAnyLoading).toBe(true);
    });

    it('tracks performance metrics for component loading', () => {
      const { result } = renderHook(() => useLazyLoadingPerformance());
      const startTime = performance.now();

      act(() => {
        const finishLoading = result.current.trackComponentLoad('PerformanceComponent');
        setTimeout(() => {
          finishLoading();
          const loadTime = result.current.loadTimes.PerformanceComponent;
          expect(loadTime).toBeGreaterThan(0);
          expect(loadTime).toBeLessThan(performance.now() - startTime + 100); // Allow some buffer
        }, 10);
      });
    });
  });
});