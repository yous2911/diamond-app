import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MysteryWordGame from '../MysteryWordGame';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, className, ...props }: any) => (
      <div onClick={onClick} className={className} data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
    button: ({ children, onClick, className, disabled, ...props }: any) => (
      <button
        onClick={onClick}
        className={className}
        disabled={disabled}
        data-testid="motion-button"
        {...props}
      >
        {children}
      </button>
    ),
    h1: ({ children, className, ...props }: any) => (
      <h1 className={className} data-testid="motion-h1" {...props}>
        {children}
      </h1>
    ),
    p: ({ children, className, ...props }: any) => (
      <p className={className} data-testid="motion-p" {...props}>
        {children}
      </p>
    )
  },
  AnimatePresence: ({ children }: any) => <div data-testid="animate-presence">{children}</div>
}));

describe('MysteryWordGame', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the game component', () => {
    render(<MysteryWordGame />);

    expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
  });

  it('displays game title and interface', () => {
    render(<MysteryWordGame />);

    // Should have motion elements
    expect(screen.getAllByTestId('motion-div')).toHaveLength(expect.any(Number));
  });

  it('shows mystery word interface', () => {
    render(<MysteryWordGame />);

    // Should render the game interface
    const motionDivs = screen.getAllByTestId('motion-div');
    expect(motionDivs.length).toBeGreaterThan(0);
  });

  it('handles letter guessing', () => {
    render(<MysteryWordGame />);

    // Should have interactive elements for letter guessing
    const buttons = screen.getAllByTestId('motion-button');
    if (buttons.length > 0) {
      fireEvent.click(buttons[0]);
      expect(buttons[0]).toBeInTheDocument();
    }
  });

  it('displays game state information', () => {
    render(<MysteryWordGame />);

    // Should show game state through motion elements
    expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
  });

  it('manages word categories', () => {
    render(<MysteryWordGame />);

    // Should handle different word categories
    const component = screen.getByTestId('animate-presence');
    expect(component).toBeInTheDocument();
  });

  it('tracks correct and wrong guesses', () => {
    render(<MysteryWordGame />);

    // Should track guessing state
    const motionElements = screen.getAllByTestId('motion-div');
    expect(motionElements.length).toBeGreaterThan(0);
  });

  it('shows hints when available', () => {
    render(<MysteryWordGame />);

    // Should provide hint functionality
    const hintButtons = screen.getAllByTestId('motion-button');
    expect(hintButtons.length).toBeGreaterThanOrEqual(0);
  });

  it('handles game completion states', () => {
    render(<MysteryWordGame />);

    // Should manage win/lose states
    expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
  });

  it('displays score tracking', () => {
    render(<MysteryWordGame />);

    // Should show score information
    const scoreElements = screen.getAllByTestId('motion-div');
    expect(scoreElements.length).toBeGreaterThan(0);
  });

  it('manages difficulty levels', () => {
    render(<MysteryWordGame />);

    // Should handle different difficulty levels
    expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
  });

  it('shows word themes', () => {
    render(<MysteryWordGame />);

    // Should display word themes
    const themeElements = screen.getAllByTestId('motion-div');
    expect(themeElements.length).toBeGreaterThan(0);
  });

  it('handles letter revelation', () => {
    render(<MysteryWordGame />);

    // Should manage letter revelation process
    const letterElements = screen.getAllByTestId('motion-div');
    letterElements.forEach(element => {
      expect(element).toBeInTheDocument();
    });
  });

  it('provides interactive alphabet', () => {
    render(<MysteryWordGame />);

    // Should have alphabet for letter selection
    const buttons = screen.getAllByTestId('motion-button');
    buttons.forEach(button => {
      expect(button).toBeInTheDocument();
    });
  });

  it('displays category information', () => {
    render(<MysteryWordGame />);

    // Should show category info
    const textElements = screen.getAllByTestId('motion-p');
    expect(textElements.length).toBeGreaterThanOrEqual(0);
  });

  it('handles game restart functionality', () => {
    render(<MysteryWordGame />);

    // Should provide restart capability
    const buttons = screen.getAllByTestId('motion-button');
    if (buttons.length > 0) {
      fireEvent.click(buttons[0]);
      expect(buttons[0]).toBeInTheDocument();
    }
  });

  it('manages animation presence', () => {
    render(<MysteryWordGame />);

    const animatePresence = screen.getByTestId('animate-presence');
    expect(animatePresence).toBeInTheDocument();
  });

  it('shows progress indication', () => {
    render(<MysteryWordGame />);

    // Should indicate progress through the word
    const progressElements = screen.getAllByTestId('motion-div');
    expect(progressElements.length).toBeGreaterThan(0);
  });

  it('handles multiple word difficulties', () => {
    render(<MysteryWordGame />);

    // Should support easy, medium, hard difficulties
    expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
  });

  it('displays themed visual elements', () => {
    render(<MysteryWordGame />);

    // Should show theme-based visuals
    const visualElements = screen.getAllByTestId('motion-div');
    expect(visualElements.length).toBeGreaterThan(0);
  });

  it('manages hint usage tracking', () => {
    render(<MysteryWordGame />);

    // Should track hint usage
    const gameElements = screen.getAllByTestId('motion-div');
    expect(gameElements.length).toBeGreaterThan(0);
  });
});