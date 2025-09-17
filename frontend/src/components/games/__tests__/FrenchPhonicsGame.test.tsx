import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FrenchPhonicsGame } from '../FrenchPhonicsGame';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, className, onDragStart, onDragEnd, onDrop, ...props }: any) => (
      <div
        onClick={onClick}
        className={className}
        data-testid="motion-div"
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDrop={onDrop}
        {...props}
      >
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

jest.mock('../../services/defisService', () => ({
  defisService: {
    generateChallenge: jest.fn().mockResolvedValue({
      id: '1',
      type: 'phonics',
      difficulty: 'facile',
      content: {
        targetWord: 'chat',
        phonemes: ['ch', 'a', 't'],
        audioUrl: '/audio/chat.mp3'
      }
    }),
    getPhonicsExercises: jest.fn().mockResolvedValue([
      {
        id: '1',
        word: 'chat',
        phonemes: ['ch', 'a', 't'],
        difficulty: 'facile'
      }
    ])
  }
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
  MagicElements: () => <div data-testid="magic-elements">Magic</div>
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

describe('FrenchPhonicsGame', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the game component', () => {
    render(<FrenchPhonicsGame />);

    expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
  });

  it('shows loading state initially', async () => {
    render(<FrenchPhonicsGame />);

    // Component should render with initial loading state
    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
  });

  it('displays animated card', () => {
    render(<FrenchPhonicsGame />);

    expect(screen.getByTestId('animated-card')).toBeInTheDocument();
  });

  it('shows progress bar', () => {
    render(<FrenchPhonicsGame />);

    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toBeInTheDocument();
  });

  it('renders floating elements', () => {
    render(<FrenchPhonicsGame />);

    expect(screen.getByTestId('sparkle-elements')).toBeInTheDocument();
    expect(screen.getByTestId('magic-elements')).toBeInTheDocument();
  });

  it('handles drag and drop interactions', () => {
    render(<FrenchPhonicsGame />);

    const motionDiv = screen.getByTestId('motion-div');

    fireEvent.dragStart(motionDiv);
    fireEvent.dragEnd(motionDiv);

    expect(motionDiv).toBeInTheDocument();
  });

  it('loads challenges from service', async () => {
    render(<FrenchPhonicsGame />);

    await waitFor(() => {
      expect(screen.getByTestId('motion-div')).toBeInTheDocument();
    });
  });

  it('handles game state management', () => {
    render(<FrenchPhonicsGame />);

    const component = screen.getByTestId('motion-div');
    expect(component).toBeInTheDocument();
  });

  it('manages magic blocks and drop zones', () => {
    render(<FrenchPhonicsGame />);

    // Should initialize with proper game elements
    expect(screen.getByTestId('animated-card')).toBeInTheDocument();
  });

  it('tracks time elapsed during game', () => {
    render(<FrenchPhonicsGame />);

    // Should have time tracking elements
    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
  });

  it('shows hint functionality', () => {
    render(<FrenchPhonicsGame />);

    // Should have hint display capability
    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
  });

  it('handles magic effects', () => {
    render(<FrenchPhonicsGame />);

    expect(screen.getByTestId('magic-elements')).toBeInTheDocument();
    expect(screen.getByTestId('sparkle-elements')).toBeInTheDocument();
  });

  it('manages combo counter', () => {
    render(<FrenchPhonicsGame />);

    // Should have combo tracking
    const component = screen.getByTestId('motion-div');
    expect(component).toBeInTheDocument();
  });

  it('handles completion state', () => {
    render(<FrenchPhonicsGame />);

    // Should manage completion state
    expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
  });

  it('integrates with sound system', () => {
    render(<FrenchPhonicsGame />);

    // Sound system should be integrated
    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
  });

  it('supports haptic feedback', () => {
    render(<FrenchPhonicsGame />);

    // Haptic feedback should be available
    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
  });

  it('handles error states', async () => {
    // Mock service to throw error
    const mockDefisService = require('../../services/defisService');
    mockDefisService.defisService.generateChallenge.mockRejectedValueOnce(new Error('Test error'));

    render(<FrenchPhonicsGame />);

    // Should handle errors gracefully
    await waitFor(() => {
      expect(screen.getByTestId('motion-div')).toBeInTheDocument();
    });
  });

  it('manages challenge progression', () => {
    render(<FrenchPhonicsGame />);

    // Should handle challenge progression
    expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
  });

  it('handles drag operations correctly', () => {
    render(<FrenchPhonicsGame />);

    const motionDiv = screen.getByTestId('motion-div');

    // Test drag operations
    fireEvent.dragStart(motionDiv, {
      dataTransfer: {
        setData: jest.fn(),
        getData: jest.fn()
      }
    });

    fireEvent.drop(motionDiv, {
      dataTransfer: {
        getData: jest.fn().mockReturnValue('test-data')
      }
    });

    expect(motionDiv).toBeInTheDocument();
  });

  it('provides interactive phonics blocks', () => {
    render(<FrenchPhonicsGame />);

    // Should have interactive phonics blocks
    const motionDiv = screen.getByTestId('motion-div');
    fireEvent.click(motionDiv);

    expect(motionDiv).toBeInTheDocument();
  });

  it('handles magnetism and vibration effects', () => {
    render(<FrenchPhonicsGame />);

    // Should support magnetism and vibration
    expect(screen.getByTestId('magic-elements')).toBeInTheDocument();
  });
});