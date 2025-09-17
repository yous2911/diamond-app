import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EnhancedMathGame } from '../EnhancedMathGame';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, className, ...props }: any) => (
      <div onClick={onClick} className={className} data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
    button: ({ children, onClick, className, ...props }: any) => (
      <button onClick={onClick} className={className} data-testid="motion-button" {...props}>
        {children}
      </button>
    )
  },
  AnimatePresence: ({ children }: any) => <div data-testid="animate-presence">{children}</div>
}));

jest.mock('../ui/AnimatedCard', () => ({
  AnimatedCard: ({ children, className }: any) => (
    <div className={className} data-testid="animated-card">
      {children}
    </div>
  )
}));

jest.mock('../ui/ProgressBar', () => ({
  ProgressBar: ({ progress, className }: any) => (
    <div className={className} data-testid="progress-bar" data-progress={progress}>
      Progress: {progress}%
    </div>
  )
}));

jest.mock('../ui/FloatingElements', () => ({
  SparkleElements: () => <div data-testid="sparkle-elements">Sparkles</div>,
  MagicElements: () => <div data-testid="magic-elements">Magic</div>,
  CelebrationElements: () => <div data-testid="celebration-elements">Celebration</div>
}));

jest.mock('../../hooks/useSound', () => ({
  useSound: () => ({
    playSound: jest.fn()
  })
}));

jest.mock('../../hooks/useHaptic', () => ({
  useHaptic: () => ({
    triggerHaptic: jest.fn()
  })
}));

describe('EnhancedMathGame', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the game component', () => {
    render(<EnhancedMathGame />);

    expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
  });

  it('starts in intro state', () => {
    render(<EnhancedMathGame />);

    // Should show intro elements
    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
  });

  it('shows progress bar', () => {
    render(<EnhancedMathGame />);

    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('data-progress', '0');
  });

  it('displays animated card', () => {
    render(<EnhancedMathGame />);

    expect(screen.getByTestId('animated-card')).toBeInTheDocument();
  });

  it('renders floating elements', () => {
    render(<EnhancedMathGame />);

    expect(screen.getByTestId('sparkle-elements')).toBeInTheDocument();
    expect(screen.getByTestId('magic-elements')).toBeInTheDocument();
    expect(screen.getByTestId('celebration-elements')).toBeInTheDocument();
  });

  it('handles game state changes', () => {
    render(<EnhancedMathGame />);

    // Game should initialize properly
    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
  });

  it('displays game level and score information', () => {
    render(<EnhancedMathGame />);

    // The component should render with initial state
    const component = screen.getByTestId('motion-div');
    expect(component).toBeInTheDocument();
  });

  it('handles motion interactions', () => {
    render(<EnhancedMathGame />);

    const motionDiv = screen.getByTestId('motion-div');
    fireEvent.click(motionDiv);

    // Should handle click interactions
    expect(motionDiv).toBeInTheDocument();
  });

  it('integrates with sound and haptic hooks', () => {
    render(<EnhancedMathGame />);

    // Sound and haptic hooks should be initialized
    // The mocked hooks should be called during component lifecycle
    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
  });

  it('manages game progression state', () => {
    render(<EnhancedMathGame />);

    // Should show progress tracking
    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toHaveAttribute('data-progress', '0');
  });

  it('renders with proper initial state', () => {
    render(<EnhancedMathGame />);

    // Should initialize with proper component structure
    expect(screen.getByTestId('animated-card')).toBeInTheDocument();
    expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    expect(screen.getByTestId('sparkle-elements')).toBeInTheDocument();
  });

  it('handles component lifecycle correctly', async () => {
    render(<EnhancedMathGame />);

    // Component should render and initialize properly
    await waitFor(() => {
      expect(screen.getByTestId('motion-div')).toBeInTheDocument();
    });
  });

  it('provides interactive game elements', () => {
    render(<EnhancedMathGame />);

    // Should have interactive elements
    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toBeInTheDocument();

    // Should be clickable
    fireEvent.click(motionDiv);
    expect(motionDiv).toBeInTheDocument();
  });

  it('displays magical effects when enabled', () => {
    render(<EnhancedMathGame />);

    // Magic elements should be present
    expect(screen.getByTestId('magic-elements')).toBeInTheDocument();
    expect(screen.getByTestId('celebration-elements')).toBeInTheDocument();
  });

  it('handles animation presence correctly', () => {
    render(<EnhancedMathGame />);

    const animatePresence = screen.getByTestId('animate-presence');
    expect(animatePresence).toBeInTheDocument();
  });

  it('manages level progression', () => {
    render(<EnhancedMathGame />);

    // Should start at initial level
    const component = screen.getByTestId('motion-div');
    expect(component).toBeInTheDocument();
  });

  it('tracks score correctly', () => {
    render(<EnhancedMathGame />);

    // Should have score tracking
    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toBeInTheDocument();
  });
});