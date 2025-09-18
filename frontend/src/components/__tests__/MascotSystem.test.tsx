import React from 'react';
import { render, screen, act } from '@testing-library/react';
import MascotSystem from '../MascotSystem';
import * as THREE from 'three';

// Mock the WardrobeData module
const mockCreateItemMesh = jest.fn();
jest.mock('../WardrobeData', () => ({
  WARDROBE_ITEMS: [
    { id: 'wizard_hat', name: 'Wizard Hat' },
    { id: 'superhero_cape', name: 'Superhero Cape' },
  ],
  createItemMesh: mockCreateItemMesh,
}));

// Mock Three.js renderer
jest.mock('three', () => {
  const originalThree = jest.requireActual('three');
  return {
    ...originalThree,
    WebGLRenderer: jest.fn().mockImplementation(() => ({
      setSize: jest.fn(),
      setPixelRatio: jest.fn(),
      render: jest.fn(),
      dispose: jest.fn(),
      domElement: document.createElement('canvas'),
    })),
  };
});

describe('MascotSystem', () => {
  const mockOnMascotInteraction = jest.fn();
  const mockOnEmotionalStateChange = jest.fn();

  const defaultProps = {
    locale: 'en' as 'en' | 'fr',
    mascotType: 'dragon' as 'dragon' | 'fairy' | 'robot' | 'cat' | 'owl',
    studentData: {
      level: 5,
      xp: 150,
      currentStreak: 10,
      timeOfDay: 'afternoon' as 'morning' | 'afternoon' | 'evening',
      recentPerformance: 'average' as 'struggling' | 'average' | 'excellent',
    },
    currentActivity: 'idle' as 'idle' | 'exercise' | 'achievement' | 'mistake' | 'learning',
    equippedItems: [],
    onMascotInteraction: mockOnMascotInteraction,
    onEmotionalStateChange: mockOnEmotionalStateChange,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders without crashing', () => {
    render(<MascotSystem {...defaultProps} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('generates dialogue in English when locale is "en"', () => {
    render(<MascotSystem {...defaultProps} locale="en" />);

    act(() => {
      screen.getByRole('button').click();
      jest.runAllTimers();
    });

    expect(screen.getByText(/Ready for a new challenge?/i)).toBeInTheDocument();
  });

  it('generates dialogue in French when locale is "fr"', () => {
    render(<MascotSystem {...defaultProps} locale="fr" />);

    act(() => {
      screen.getByRole('button').click();
      jest.runAllTimers();
    });

    expect(screen.getByText(/Prêt pour un nouveau défi?/i)).toBeInTheDocument();
  });

  it('changes mood based on student performance', () => {
    const { rerender } = render(
      <MascotSystem
        {...defaultProps}
        studentData={{ ...defaultProps.studentData, recentPerformance: 'excellent' }}
      />
    );

    act(() => {
      jest.advanceTimersByTime(5001);
    });

    // Rerender to see the effect of the mood change in the UI
    rerender(
      <MascotSystem
        {...defaultProps}
        studentData={{ ...defaultProps.studentData, recentPerformance: 'excellent' }}
      />
    );

    act(() => {
      screen.getByRole('button').click();
      jest.runAllTimers();
    });

    // Expect "proud" dialogue
    expect(screen.getByText(/Incredible! You've mastered 5 levels!/i)).toBeInTheDocument();
  });

  it('changes mood based on current activity', () => {
    const { rerender } = render(
      <MascotSystem {...defaultProps} currentActivity="achievement" />
    );

    act(() => {
      jest.advanceTimersByTime(5001);
    });

    rerender(<MascotSystem {...defaultProps} currentActivity="achievement" />);

    act(() => {
      screen.getByRole('button').click();
      jest.runAllTimers();
    });

    // Expect "excited" dialogue
    expect(screen.getByText(/WOW! That was AMAZING!/i)).toBeInTheDocument();
  });

  it('calls onMascotInteraction and onEmotionalStateChange on interaction', () => {
    render(<MascotSystem {...defaultProps} />);

    act(() => {
      screen.getByRole('button').click();
      jest.runAllTimers();
    });

    expect(mockOnMascotInteraction).toHaveBeenCalledWith('click');
    expect(mockOnEmotionalStateChange).toHaveBeenCalled();
  });

  it('renders equipped wardrobe items', () => {
    // Set up the mock to return a THREE.Object3D
    mockCreateItemMesh.mockReturnValue(new THREE.Object3D());

    render(<MascotSystem {...defaultProps} equippedItems={['wizard_hat']} />);

    // Check if the factory function was called for the equipped item
    expect(mockCreateItemMesh).toHaveBeenCalledWith(expect.objectContaining({ id: 'wizard_hat' }));
  });

  it('does not render 3D scene in test environment', () => {
    // Our mock setup already prevents the real renderer from running.
    // We can check that the renderer was not instantiated.
    const THREE = require('three');
    render(<MascotSystem {...defaultProps} />);
    expect(THREE.WebGLRenderer).not.toHaveBeenCalled();
  });

  it('changes mood to encouraging when student is struggling', () => {
    render(
      <MascotSystem
        {...defaultProps}
        studentData={{ ...defaultProps.studentData, recentPerformance: 'struggling' }}
      />
    );

    act(() => {
      jest.advanceTimersByTime(5001);
    });

    act(() => {
      screen.getByRole('button').click();
      jest.runAllTimers();
    });

    expect(mockOnEmotionalStateChange).toHaveBeenCalledWith(
      expect.objectContaining({ mood: 'encouraging' })
    );

    // Check for encouraging dialogue
    expect(screen.getByText(/Everyone learns differently - you're doing great!/i)).toBeInTheDocument();
  });

  it('updates energy based on time of day', () => {
    const { rerender } = render(
        <MascotSystem {...defaultProps} studentData={{...defaultProps.studentData, timeOfDay: 'evening'}} />
    );

    act(() => {
        jest.advanceTimersByTime(5001);
    });

    rerender(<MascotSystem {...defaultProps} studentData={{...defaultProps.studentData, timeOfDay: 'evening'}} />);

    act(() => {
        screen.getByRole('button').click();
        jest.runAllTimers();
    });

    const lastCall = mockOnEmotionalStateChange.mock.calls[mockOnEmotionalStateChange.mock.calls.length - 1][0];
    expect(lastCall.energy).toBeLessThan(80);
  });

  it('shows supportive dialogue when relationship is high and student is struggling', () => {
    const { rerender } = render(
      <MascotSystem
        {...defaultProps}
        studentData={{ ...defaultProps.studentData, recentPerformance: 'struggling' }}
      />
    );

    // Simulate multiple interactions to build relationship
    for (let i = 0; i < 25; i++) {
        act(() => {
            screen.getByRole('button').click();
            jest.runAllTimers();
        });
    }

    rerender(
        <MascotSystem
          {...defaultProps}
          studentData={{ ...defaultProps.studentData, recentPerformance: 'struggling' }}
        />
    );

    act(() => {
        jest.advanceTimersByTime(5001);
    });

    act(() => {
      screen.getByRole('button').click();
      jest.runAllTimers();
    });

    const lastCall = mockOnEmotionalStateChange.mock.calls[mockOnEmotionalStateChange.mock.calls.length - 1][0];
    expect(lastCall.relationship).toBeGreaterThanOrEqual(70);
    expect(screen.getByText(/Remember when you solved that hard problem\? You can do this too!/i)).toBeInTheDocument();
  });

  it('modifies dialogue when energy is low', () => {
    render(
      <MascotSystem
        {...defaultProps}
        currentActivity="exercise"
        studentData={{ ...defaultProps.studentData, timeOfDay: 'evening' }}
      />
    );

    // Run mood shift multiple times to drain energy
    for (let i = 0; i < 5; i++) {
        act(() => {
            jest.advanceTimersByTime(5001);
        });
    }

    act(() => {
      screen.getByRole('button').click();
      jest.runAllTimers();
    });

    const lastCall = mockOnEmotionalStateChange.mock.calls[mockOnEmotionalStateChange.mock.calls.length - 1][0];
    expect(lastCall.energy).toBeLessThan(30);

    const dialogue = screen.getByText(/ready for a new challenge/i);
    expect(dialogue.textContent).not.toContain('!');
    expect(dialogue.textContent).toContain('.');
  });

  it('displays the correct mood color indicator', () => {
    const { rerender } = render(
      <MascotSystem {...defaultProps} currentActivity="achievement" />
    );

    act(() => {
      jest.advanceTimersByTime(5001);
    });

    rerender(<MascotSystem {...defaultProps} currentActivity="achievement" />);

    const moodIndicatorContainer = screen.getByRole('button').nextElementSibling;
    const moodIndicator = moodIndicatorContainer.querySelector('div:first-child');
    expect(moodIndicator).toHaveClass('bg-yellow-400');
  });

  it('displays the correct energy bar height', () => {
    render(<MascotSystem {...defaultProps} />);
    const energyBarContainer = screen.getByRole('button').nextElementSibling;
    const energyBar = energyBarContainer.querySelector('div:last-child > div');
    // Initial energy is 80
    expect(energyBar).toHaveStyle('height: 80%');
  });
});
