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
});
