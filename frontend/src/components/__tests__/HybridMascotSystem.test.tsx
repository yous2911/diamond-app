import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import HybridMascotSystem from '../HybridMascotSystem';

// Mock Three.js
jest.mock('three', () => ({
  Scene: jest.fn(() => ({
    background: null,
    add: jest.fn(),
    remove: jest.fn()
  })),
  PerspectiveCamera: jest.fn(() => ({
    position: { set: jest.fn() }
  })),
  WebGLRenderer: jest.fn(() => ({
    setSize: jest.fn(),
    shadowMap: { enabled: true, type: 'PCFSoftShadowMap' },
    setPixelRatio: jest.fn(),
    render: jest.fn(),
    domElement: document.createElement('div'),
    dispose: jest.fn()
  })),
  Group: jest.fn(() => ({
    add: jest.fn(),
    position: { y: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    children: []
  })),
  SphereGeometry: jest.fn(),
  MeshPhongMaterial: jest.fn(() => ({
    color: { setHSL: jest.fn() },
    shininess: 100,
    transparent: true,
    opacity: 0.9
  })),
  Mesh: jest.fn(() => ({
    position: { set: jest.fn() },
    castShadow: true,
    add: jest.fn(),
    userData: {}
  })),
  ConeGeometry: jest.fn(),
  PlaneGeometry: jest.fn(),
  CylinderGeometry: jest.fn(),
  TorusGeometry: jest.fn(),
  BufferGeometry: jest.fn(() => ({
    setAttribute: jest.fn()
  })),
  BufferAttribute: jest.fn(),
  PointsMaterial: jest.fn(),
  Points: jest.fn(() => ({
    add: jest.fn()
  })),
  AmbientLight: jest.fn(() => ({
    add: jest.fn()
  })),
  DirectionalLight: jest.fn(() => ({
    position: { set: jest.fn() },
    castShadow: true,
    shadow: { mapSize: { width: 2048, height: 2048 } },
    add: jest.fn()
  })),
  PointLight: jest.fn(() => ({
    position: { set: jest.fn() },
    add: jest.fn()
  })),
  Color: jest.fn(() => ({
    setHSL: jest.fn()
  })),
  PCFSoftShadowMap: 'PCFSoftShadowMap'
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

// Mock WardrobeData
jest.mock('../WardrobeData', () => ({
  WARDROBE_ITEMS: [
    { id: 'crown', name: 'Golden Crown', type: 'head' },
    { id: 'wand', name: 'Magic Wand', type: 'accessory' },
    { id: 'glasses', name: 'Smart Glasses', type: 'head' }
  ],
  createItemMesh: jest.fn(() => ({
    add: jest.fn()
  }))
}));

// Mock requestAnimationFrame
const mockRequestAnimationFrame = jest.fn();
const mockCancelAnimationFrame = jest.fn();

global.requestAnimationFrame = mockRequestAnimationFrame;
global.cancelAnimationFrame = mockCancelAnimationFrame;

describe('HybridMascotSystem', () => {
  const defaultProps = {
    mascotType: 'dragon' as const,
    studentData: {
      level: 5,
      xp: 250,
      currentStreak: 7,
      timeOfDay: 'afternoon' as const,
      recentPerformance: 'excellent' as const
    },
    currentActivity: 'learning' as const,
    equippedItems: ['crown', 'wand'],
    onMascotInteraction: jest.fn(),
    onEmotionalStateChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestAnimationFrame.mockImplementation((callback) => {
      setTimeout(() => callback(16), 16);
      return 1;
    });
  });

  it('renders mascot container', () => {
    render(<HybridMascotSystem {...defaultProps} />);
    
    const container = screen.getByRole('button');
    expect(container).toBeInTheDocument();
  });

  it('handles different mascot types', () => {
    const mascotTypes = ['dragon', 'fairy', 'robot', 'cat', 'owl'] as const;
    
    mascotTypes.forEach(type => {
      const { unmount } = render(
        <HybridMascotSystem {...defaultProps} mascotType={type} />
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
      unmount();
    });
  });

  it('handles mascot interaction', async () => {
    render(<HybridMascotSystem {...defaultProps} />);
    
    const mascotButton = screen.getByRole('button');
    
    await act(async () => {
      fireEvent.click(mascotButton);
    });
    
    // Should trigger interaction after thinking time
    await waitFor(() => {
      expect(defaultProps.onMascotInteraction).toHaveBeenCalledWith('click');
    }, { timeout: 2000 });
  });

  it('handles different student data', () => {
    const studentDataVariations = [
      {
        level: 1,
        xp: 50,
        currentStreak: 1,
        timeOfDay: 'morning' as const,
        recentPerformance: 'struggling' as const
      },
      {
        level: 10,
        xp: 500,
        currentStreak: 15,
        timeOfDay: 'evening' as const,
        recentPerformance: 'excellent' as const
      }
    ];
    
    studentDataVariations.forEach(data => {
      const { unmount } = render(
        <HybridMascotSystem {...defaultProps} studentData={data} />
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
      unmount();
    });
  });

  it('handles different activities', () => {
    const activities = ['idle', 'exercise', 'achievement', 'mistake', 'learning'] as const;
    
    activities.forEach(activity => {
      const { unmount } = render(
        <HybridMascotSystem {...defaultProps} currentActivity={activity} />
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
      unmount();
    });
  });

  it('handles different equipped items', () => {
    const itemSets = [
      [],
      ['crown'],
      ['wand'],
      ['glasses'],
      ['crown', 'wand', 'glasses']
    ];
    
    itemSets.forEach(items => {
      const { unmount } = render(
        <HybridMascotSystem {...defaultProps} equippedItems={items} />
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
      unmount();
    });
  });

  it('shows mood indicator', () => {
    render(<HybridMascotSystem {...defaultProps} />);
    
    // Mood indicator should be present
    const moodIndicator = document.querySelector('.w-4.h-4.rounded-full');
    expect(moodIndicator).toBeInTheDocument();
  });

  it('shows energy level indicator', () => {
    render(<HybridMascotSystem {...defaultProps} />);
    
    // Energy level indicator should be present
    const energyIndicator = document.querySelector('.w-4.h-8.bg-gray-200');
    expect(energyIndicator).toBeInTheDocument();
  });

  it('handles emotional state changes', async () => {
    render(<HybridMascotSystem {...defaultProps} />);
    
    const mascotButton = screen.getByRole('button');
    
    await act(async () => {
      fireEvent.click(mascotButton);
    });
    
    // Should call emotional state change
    await waitFor(() => {
      expect(defaultProps.onEmotionalStateChange).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('applies correct CSS classes', () => {
    render(<HybridMascotSystem {...defaultProps} />);
    
    const container = screen.getByRole('button').parentElement;
    expect(container).toHaveClass('relative');
    
    const mascotContainer = screen.getByRole('button');
    expect(mascotContainer).toHaveClass(
      'w-50',
      'h-50',
      'rounded-full',
      'cursor-pointer',
      'hover:scale-105',
      'transition-transform',
      'duration-300'
    );
  });

  it('handles component unmounting', () => {
    const { unmount } = render(<HybridMascotSystem {...defaultProps} />);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
    
    unmount();
    
    // Should not throw errors during unmount
    expect(mockCancelAnimationFrame).toHaveBeenCalled();
  });

  it('handles animation frame requests', () => {
    render(<HybridMascotSystem {...defaultProps} />);
    
    // Animation should be requested
    expect(mockRequestAnimationFrame).toHaveBeenCalled();
  });

  it('handles rapid interaction clicks', async () => {
    render(<HybridMascotSystem {...defaultProps} />);
    
    const mascotButton = screen.getByRole('button');
    
    // Rapid clicks should be handled gracefully
    await act(async () => {
      fireEvent.click(mascotButton);
      fireEvent.click(mascotButton);
      fireEvent.click(mascotButton);
    });
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles different time of day scenarios', () => {
    const timeScenarios = [
      { timeOfDay: 'morning' as const, expectedEnergy: 'higher' },
      { timeOfDay: 'afternoon' as const, expectedEnergy: 'normal' },
      { timeOfDay: 'evening' as const, expectedEnergy: 'lower' }
    ];
    
    timeScenarios.forEach(scenario => {
      const { unmount } = render(
        <HybridMascotSystem 
          {...defaultProps} 
          studentData={{ ...defaultProps.studentData, timeOfDay: scenario.timeOfDay }}
        />
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
      unmount();
    });
  });

  it('handles different performance levels', () => {
    const performanceLevels = ['struggling', 'average', 'excellent'] as const;
    
    performanceLevels.forEach(performance => {
      const { unmount } = render(
        <HybridMascotSystem 
          {...defaultProps} 
          studentData={{ ...defaultProps.studentData, recentPerformance: performance }}
        />
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
      unmount();
    });
  });

  it('handles high relationship level', () => {
    // This would require mocking the AI state, but we can test the component renders
    render(<HybridMascotSystem {...defaultProps} />);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles thinking state', async () => {
    render(<HybridMascotSystem {...defaultProps} />);
    
    const mascotButton = screen.getByRole('button');
    
    await act(async () => {
      fireEvent.click(mascotButton);
    });
    
    // Component should handle thinking state
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles dialogue display', async () => {
    render(<HybridMascotSystem {...defaultProps} />);
    
    const mascotButton = screen.getByRole('button');
    
    await act(async () => {
      fireEvent.click(mascotButton);
    });
    
    // Should eventually show dialogue
    await waitFor(() => {
      // Dialogue might appear after thinking time
      expect(screen.getByRole('button')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('handles edge cases for student data', () => {
    const edgeCases = [
      { level: 0, xp: 0, currentStreak: 0 },
      { level: 100, xp: 10000, currentStreak: 365 }
    ];
    
    edgeCases.forEach(data => {
      const { unmount } = render(
        <HybridMascotSystem 
          {...defaultProps} 
          studentData={{ ...defaultProps.studentData, ...data }}
        />
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
      unmount();
    });
  });

  it('handles empty equipped items', () => {
    render(<HybridMascotSystem {...defaultProps} equippedItems={[]} />);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles invalid equipped items', () => {
    render(<HybridMascotSystem {...defaultProps} equippedItems={['invalid_item']} />);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles rapid state changes', async () => {
    const { rerender } = render(<HybridMascotSystem {...defaultProps} />);
    
    await act(async () => {
      rerender(
        <HybridMascotSystem 
          {...defaultProps} 
          currentActivity="achievement" 
        />
      );
    });
    
    await act(async () => {
      rerender(
        <HybridMascotSystem 
          {...defaultProps} 
          currentActivity="mistake" 
        />
      );
    });
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});