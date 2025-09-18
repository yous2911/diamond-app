import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import EnhancedLevelUpSystem from '../EnhancedLevelUpSystem';
import { useMagicalSounds } from '../../hooks/useMagicalSounds';

// Mock dependencies
jest.mock('../../hooks/useMagicalSounds');

const mockPlayLevelUpFanfare = jest.fn();
const mockPlaySparkleSound = jest.fn();

(useMagicalSounds as jest.Mock).mockReturnValue({
  playLevelUpFanfare: mockPlayLevelUpFanfare,
  playSparkleSound: mockPlaySparkleSound,
});

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
      p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    },
  };
});


describe('EnhancedLevelUpSystem', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPlayLevelUpFanfare.mockClear();
    mockPlaySparkleSound.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should not render when isLevelingUp is false', () => {
    const { container } = render(
      <EnhancedLevelUpSystem isLevelingUp={false} newLevel={2} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render the level up modal when isLevelingUp is true', () => {
    render(<EnhancedLevelUpSystem isLevelingUp={true} newLevel={5} />);

    expect(screen.getByText('NIVEAU SUPÉRIEUR !')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should call sound effects on level up', () => {
    render(<EnhancedLevelUpSystem isLevelingUp={true} newLevel={5} />);

    expect(mockPlayLevelUpFanfare).toHaveBeenCalledTimes(1);
  });

  it('should display achievements if provided', () => {
    const achievements = ['Premier niveau !', 'Bienvenue !'];
    render(
      <EnhancedLevelUpSystem
        isLevelingUp={true}
        newLevel={5}
        achievements={achievements}
      />
    );

    expect(screen.getByText('Nouveaux accomplissements :')).toBeInTheDocument();
    expect(screen.getByText('🏆 Premier niveau !')).toBeInTheDocument();
    expect(screen.getByText('🏆 Bienvenue !')).toBeInTheDocument();
  });

  it('should call onLevelUpComplete after the animation', async () => {
    const onLevelUpComplete = jest.fn();
    render(
      <EnhancedLevelUpSystem
        isLevelingUp={true}
        newLevel={5}
        onLevelUpComplete={onLevelUpComplete}
      />
    );

    expect(onLevelUpComplete).not.toHaveBeenCalled();

    // Fast-forward timers to the end of the celebration
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(onLevelUpComplete).toHaveBeenCalledTimes(1);
    });
  });
});
