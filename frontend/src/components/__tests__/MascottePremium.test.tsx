import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import MascottePremium from '../MascottePremium';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, className, initial, animate, transition, whileHover, whileTap, style, ...props }: any) => (
      <div
        onClick={onClick}
        className={className}
        style={style}
        data-testid="motion-div"
        {...props}
      >
        {children}
      </div>
    )
  },
  AnimatePresence: ({ children }: any) => <div data-testid="animate-presence">{children}</div>
}));

describe('MascottePremium', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders with idle emotion by default', () => {
    render(<MascottePremium emotion="idle" />);

    expect(screen.getByText('👤')).toBeInTheDocument();
  });

  it('renders different emotions correctly', () => {
    const emotions = [
      { emotion: 'happy', emoji: '😊' },
      { emotion: 'excited', emoji: '🤩' },
      { emotion: 'thinking', emoji: '🤔' },
      { emotion: 'celebrating', emoji: '🎉' },
      { emotion: 'sleepy', emoji: '😴' }
    ] as const;

    emotions.forEach(({ emotion, emoji }) => {
      const { rerender } = render(<MascottePremium emotion={emotion} />);
      expect(screen.getByText(emoji)).toBeInTheDocument();
      rerender(<div />);
    });
  });

  it('shows message when provided', () => {
    render(<MascottePremium emotion="happy" message="Test message" />);

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('shows default emotion message when no message provided', () => {
    render(<MascottePremium emotion="happy" />);

    // Should show one of the default happy messages
    const messageElement = screen.getByText(/Super travail !|Tu es fantastique !/);
    expect(messageElement).toBeInTheDocument();
  });

  it('calls onInteraction when clicked', () => {
    const mockOnInteraction = jest.fn();
    render(<MascottePremium emotion="idle" onInteraction={mockOnInteraction} />);

    const mascot = screen.getByText('👤');
    fireEvent.click(mascot);

    expect(mockOnInteraction).toHaveBeenCalledTimes(1);
  });

  it('changes to excited emotion when clicked', () => {
    render(<MascottePremium emotion="idle" />);

    const mascot = screen.getByText('👤');
    fireEvent.click(mascot);

    expect(screen.getByText('🤩')).toBeInTheDocument();
  });

  it('shows interaction effect when clicked', () => {
    render(<MascottePremium emotion="idle" />);

    const mascot = screen.getByText('👤');
    fireEvent.click(mascot);

    // Should show the interaction effect
    const interactionEffect = screen.getByTestId('animate-presence');
    expect(interactionEffect).toBeInTheDocument();
  });

  it('returns to happy emotion after interaction', async () => {
    render(<MascottePremium emotion="idle" />);

    const mascot = screen.getByText('👤');
    fireEvent.click(mascot);

    expect(screen.getByText('🤩')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(screen.getByText('😊')).toBeInTheDocument();
    });
  });

  it('hides message after timeout', async () => {
    render(<MascottePremium emotion="happy" message="Test message" />);

    expect(screen.getByText('Test message')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });
  });

  it('updates emotion when prop changes', () => {
    const { rerender } = render(<MascottePremium emotion="idle" />);
    expect(screen.getByText('👤')).toBeInTheDocument();

    rerender(<MascottePremium emotion="celebrating" />);
    expect(screen.getByText('🎉')).toBeInTheDocument();
  });

  it('shows new message when message prop changes', () => {
    const { rerender } = render(<MascottePremium emotion="idle" message="First message" />);
    expect(screen.getByText('First message')).toBeInTheDocument();

    rerender(<MascottePremium emotion="idle" message="Second message" />);
    expect(screen.getByText('Second message')).toBeInTheDocument();
  });

  it('renders particles around mascot', () => {
    render(<MascottePremium emotion="idle" />);

    // Should render 6 particles
    const particles = screen.getAllByTestId('motion-div').filter(
      div => div.className?.includes('bg-yellow-400')
    );
    expect(particles).toHaveLength(6);
  });

  it('applies correct emotion animation classes', () => {
    const { rerender } = render(<MascottePremium emotion="happy" />);
    let mascotContainer = screen.getByText('😊').closest('.text-6xl');
    expect(mascotContainer).toHaveClass('animate-bounce');

    rerender(<MascottePremium emotion="excited" />);
    mascotContainer = screen.getByText('🤩').closest('.text-6xl');
    expect(mascotContainer).toHaveClass('animate-pulse');

    rerender(<MascottePremium emotion="thinking" />);
    mascotContainer = screen.getByText('🤔').closest('.text-6xl');
    expect(mascotContainer).toHaveClass('animate-pulse');

    rerender(<MascottePremium emotion="celebrating" />);
    mascotContainer = screen.getByText('🎉').closest('.text-6xl');
    expect(mascotContainer).toHaveClass('animate-spin');
  });

  it('handles interaction state correctly', () => {
    render(<MascottePremium emotion="idle" />);

    const mascot = screen.getByText('👤');
    fireEvent.click(mascot);

    // Should be in interacting state
    const mascotContainer = mascot.closest('.text-6xl');
    expect(mascotContainer).toHaveClass('scale-125');

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Should no longer be in interacting state
    expect(mascotContainer).not.toHaveClass('scale-125');
  });

  it('renders message bubble with correct content structure', () => {
    render(<MascottePremium emotion="happy" message="Custom message" />);

    const messageElement = screen.getByText('Custom message');
    const messageContainer = messageElement.closest('.bg-white\\/95');

    expect(messageContainer).toBeInTheDocument();
    expect(messageContainer).toHaveClass('backdrop-blur-sm', 'border-2', 'border-purple-200', 'rounded-2xl');
  });

  it('shows random default message for each emotion', () => {
    // Test multiple renders to potentially get different random messages
    const { unmount } = render(<MascottePremium emotion="thinking" />);

    const messageElement = screen.getByText(/Réfléchissons ensemble...|Prenons notre temps/);
    expect(messageElement).toBeInTheDocument();

    unmount();
  });

  it('handles multiple quick interactions correctly', () => {
    const mockOnInteraction = jest.fn();
    render(<MascottePremium emotion="idle" onInteraction={mockOnInteraction} />);

    const mascot = screen.getByText('👤');

    // Click multiple times quickly
    fireEvent.click(mascot);
    fireEvent.click(mascot);
    fireEvent.click(mascot);

    // Should call interaction handler for each click
    expect(mockOnInteraction).toHaveBeenCalledTimes(3);
  });
});