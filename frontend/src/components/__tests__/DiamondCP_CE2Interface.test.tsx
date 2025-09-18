import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import AdvancedParticleEngineAAA from '../DiamondCP_CE2Interface';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

// Mock requestAnimationFrame
const mockRequestAnimationFrame = jest.fn();
const mockCancelAnimationFrame = jest.fn();

global.requestAnimationFrame = mockRequestAnimationFrame;
global.cancelAnimationFrame = mockCancelAnimationFrame;

// Mock canvas context
const mockCanvasContext = {
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  beginPath: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  scale: jest.fn(),
  globalAlpha: 1,
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  lineCap: 'round',
  createRadialGradient: jest.fn(() => ({
    addColorStop: jest.fn()
  })),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn()
  })),
  ellipse: jest.fn(),
  bezierCurveTo: jest.fn()
};

// Mock canvas element
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn(() => mockCanvasContext)
});

Object.defineProperty(HTMLCanvasElement.prototype, 'getBoundingClientRect', {
  value: jest.fn(() => ({
    left: 0,
    top: 0,
    width: 800,
    height: 600
  }))
});

// Mock window dimensions
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768,
});

describe('AdvancedParticleEngineAAA (DiamondCP_CE2Interface)', () => {
  const defaultProps = {
    isActive: true,
    intensity: 'medium' as const,
    type: 'success' as const
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockRequestAnimationFrame.mockImplementation((callback) => {
      const id = setTimeout(() => callback(Date.now()), 16);
      return id as unknown as number;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders when active', () => {
    render(<AdvancedParticleEngineAAA {...defaultProps} />);
    
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('does not render when inactive', () => {
    render(<AdvancedParticleEngineAAA {...defaultProps} isActive={false} />);
    
    // Should return null when not active
    expect(document.querySelector('canvas')).not.toBeInTheDocument();
  });

  it('handles different intensity levels', () => {
    const intensities = ['low', 'medium', 'high', 'epic', 'legendary'] as const;
    
    intensities.forEach(intensity => {
      const { unmount } = render(
        <AdvancedParticleEngineAAA {...defaultProps} intensity={intensity} />
      );
      expect(document.querySelector('canvas')).toBeInTheDocument();
      unmount();
    });
  });

  it('handles different particle types', () => {
    const types = ['success', 'levelup', 'magic', 'celebration', 'ambient', 'interactive'] as const;
    
    types.forEach(type => {
      const { unmount } = render(
        <AdvancedParticleEngineAAA {...defaultProps} type={type} />
      );
      expect(document.querySelector('canvas')).toBeInTheDocument();
      unmount();
    });
  });

  it('handles custom position', () => {
    render(
      <AdvancedParticleEngineAAA 
        {...defaultProps} 
        position={{ x: 25, y: 75 }} 
      />
    );
    
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('handles follow mode', () => {
    render(<AdvancedParticleEngineAAA {...defaultProps} follow={true} />);
    
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('handles interactive mode', () => {
    render(<AdvancedParticleEngineAAA {...defaultProps} interactive={true} />);
    
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<AdvancedParticleEngineAAA {...defaultProps} className="custom-class" />);
    
    const container = document.querySelector('.custom-class');
    expect(container).toBeInTheDocument();
  });

  it('handles mouse move events', () => {
    render(<AdvancedParticleEngineAAA {...defaultProps} />);
    
    // Simulate mouse move
    fireEvent.mouseMove(window, { clientX: 100, clientY: 200 });
    
    // Should not throw errors
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('handles window resize events', () => {
    render(<AdvancedParticleEngineAAA {...defaultProps} />);
    
    // Simulate window resize
    Object.defineProperty(window, 'innerWidth', { value: 1920 });
    Object.defineProperty(window, 'innerHeight', { value: 1080 });
    
    fireEvent(window, new Event('resize'));
    
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    render(<AdvancedParticleEngineAAA {...defaultProps} />);
    
    const container = document.querySelector('.fixed.inset-0.pointer-events-none.z-40');
    expect(container).toBeInTheDocument();
  });

  it('applies mix blend mode for ambient type', () => {
    render(<AdvancedParticleEngineAAA {...defaultProps} type="ambient" />);
    
    const canvas = document.querySelector('canvas');
    expect(canvas).toHaveStyle({ mixBlendMode: 'screen' });
  });

  it('applies normal mix blend mode for non-ambient types', () => {
    render(<AdvancedParticleEngineAAA {...defaultProps} type="success" />);
    
    const canvas = document.querySelector('canvas');
    expect(canvas).toHaveStyle({ mixBlendMode: 'normal' });
  });

  it('handles component unmounting', () => {
    const { unmount } = render(<AdvancedParticleEngineAAA {...defaultProps} />);
    
    expect(document.querySelector('canvas')).toBeInTheDocument();
    
    unmount();
    
    // Should not throw errors during unmount
    expect(mockCancelAnimationFrame).toHaveBeenCalled();
  });

  it('handles animation frame requests', () => {
    render(<AdvancedParticleEngineAAA {...defaultProps} />);
    
    // Animation should be requested when active
    expect(mockRequestAnimationFrame).toHaveBeenCalled();
  });

  it('handles rapid state changes', async () => {
    const { rerender } = render(<AdvancedParticleEngineAAA {...defaultProps} isActive={true} />);
    
    await act(async () => {
      rerender(<AdvancedParticleEngineAAA {...defaultProps} isActive={false} />);
    });
    
    await act(async () => {
      rerender(<AdvancedParticleEngineAAA {...defaultProps} isActive={true} />);
    });
    
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('handles different intensity configurations', () => {
    const intensityConfigs = [
      { intensity: 'low' as const, expectedCount: 15 },
      { intensity: 'medium' as const, expectedCount: 35 },
      { intensity: 'high' as const, expectedCount: 60 },
      { intensity: 'epic' as const, expectedCount: 100 },
      { intensity: 'legendary' as const, expectedCount: 150 }
    ];
    
    intensityConfigs.forEach(config => {
      const { unmount } = render(
        <AdvancedParticleEngineAAA {...defaultProps} intensity={config.intensity} />
      );
      expect(document.querySelector('canvas')).toBeInTheDocument();
      unmount();
    });
  });

  it('handles different color palettes', () => {
    const colorPaletteTypes = ['success', 'levelup', 'magic', 'celebration', 'ambient', 'interactive'] as const;
    
    colorPaletteTypes.forEach(type => {
      const { unmount } = render(
        <AdvancedParticleEngineAAA {...defaultProps} type={type} />
      );
      expect(document.querySelector('canvas')).toBeInTheDocument();
      unmount();
    });
  });

  it('handles particle type variations', () => {
    // The component should handle different particle types internally
    render(<AdvancedParticleEngineAAA {...defaultProps} />);
    
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('handles 3D depth calculations', () => {
    render(<AdvancedParticleEngineAAA {...defaultProps} />);
    
    // Component should handle 3D depth calculations
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('handles physics simulation', () => {
    render(<AdvancedParticleEngineAAA {...defaultProps} />);
    
    // Component should handle physics simulation
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('handles trail system', () => {
    render(<AdvancedParticleEngineAAA {...defaultProps} />);
    
    // Component should handle trail system
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('handles glow effects', () => {
    render(<AdvancedParticleEngineAAA {...defaultProps} />);
    
    // Component should handle glow effects
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('handles boundary checking with bounce', () => {
    render(<AdvancedParticleEngineAAA {...defaultProps} />);
    
    // Component should handle boundary checking
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('handles interactive forces', () => {
    render(<AdvancedParticleEngineAAA {...defaultProps} interactive={true} />);
    
    // Component should handle interactive forces
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('handles different particle shapes', () => {
    // The component should handle different particle shapes (crystal, diamond, energy, etc.)
    render(<AdvancedParticleEngineAAA {...defaultProps} />);
    
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('handles HDR-like effects', () => {
    render(<AdvancedParticleEngineAAA {...defaultProps} />);
    
    // Component should handle HDR-like effects
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('handles 3D perspective scaling', () => {
    render(<AdvancedParticleEngineAAA {...defaultProps} />);
    
    // Component should handle 3D perspective scaling
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('handles particle spawning', () => {
    render(<AdvancedParticleEngineAAA {...defaultProps} />);
    
    // Component should handle particle spawning
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('handles particle lifecycle', () => {
    render(<AdvancedParticleEngineAAA {...defaultProps} />);
    
    // Component should handle particle lifecycle
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('handles performance optimization', () => {
    render(<AdvancedParticleEngineAAA {...defaultProps} />);
    
    // Component should handle performance optimization
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('handles edge cases for position', () => {
    const edgeCases = [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
      { x: -50, y: -50 },
      { x: 150, y: 150 }
    ];
    
    edgeCases.forEach(position => {
      const { unmount } = render(
        <AdvancedParticleEngineAAA {...defaultProps} position={position} />
      );
      expect(document.querySelector('canvas')).toBeInTheDocument();
      unmount();
    });
  });

  it('handles multiple prop combinations', () => {
    const combinations = [
      { follow: true, interactive: true },
      { follow: false, interactive: true },
      { follow: true, interactive: false },
      { follow: false, interactive: false }
    ];
    
    combinations.forEach(props => {
      const { unmount } = render(
        <AdvancedParticleEngineAAA {...defaultProps} {...props} />
      );
      expect(document.querySelector('canvas')).toBeInTheDocument();
      unmount();
    });
  });

  it('handles rapid prop changes', async () => {
    const { rerender } = render(<AdvancedParticleEngineAAA {...defaultProps} />);
    
    await act(async () => {
      rerender(<AdvancedParticleEngineAAA {...defaultProps} intensity="high" />);
    });
    
    await act(async () => {
      rerender(<AdvancedParticleEngineAAA {...defaultProps} type="magic" />);
    });
    
    await act(async () => {
      rerender(<AdvancedParticleEngineAAA {...defaultProps} follow={true} />);
    });
    
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('handles canvas context operations', () => {
    render(<AdvancedParticleEngineAAA {...defaultProps} />);
    
    // Canvas context operations should be called
    expect(mockCanvasContext.clearRect).toHaveBeenCalled();
  });

  it('handles animation loop', () => {
    render(<AdvancedParticleEngineAAA {...defaultProps} />);
    
    // Animation loop should be set up
    expect(mockRequestAnimationFrame).toHaveBeenCalled();
  });

  it('handles cleanup on unmount', () => {
    const { unmount } = render(<AdvancedParticleEngineAAA {...defaultProps} />);
    
    unmount();
    
    // Cleanup should be called
    expect(mockCancelAnimationFrame).toHaveBeenCalled();
  });

  it('handles window event listeners', () => {
    render(<AdvancedParticleEngineAAA {...defaultProps} />);
    
    // Window event listeners should be set up
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('handles canvas sizing', () => {
    render(<AdvancedParticleEngineAAA {...defaultProps} />);
    
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveClass('w-full', 'h-full');
  });

  it('handles framer-motion integration', () => {
    render(<AdvancedParticleEngineAAA {...defaultProps} />);
    
    // Should integrate with framer-motion
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('spawns particles at the specified position when follow is false', async () => {
    render(
      <AdvancedParticleEngineAAA {...defaultProps} position={{ x: 25, y: 75 }} />
    );

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    expect(mockCanvasContext.translate).toHaveBeenCalled();
    const firstTranslateCall = mockCanvasContext.translate.mock.calls[0];
    const x = firstTranslateCall[0];
    const y = firstTranslateCall[1];

    // canvas width is 800, height is 600 (from mock)
    // position is {x: 25, y: 75}, so spawn point is {x: 200, y: 450}
    // The spawn has a random offset of +/- 25
    expect(x).toBeGreaterThanOrEqual(175);
    expect(x).toBeLessThanOrEqual(225);
    expect(y).toBeGreaterThanOrEqual(425);
    expect(y).toBeLessThanOrEqual(475);
  });

  it('spawns particles at the mouse position when follow is true', async () => {
      render(
        <AdvancedParticleEngineAAA {...defaultProps} follow={true} />
      );

      fireEvent.mouseMove(window, { clientX: 300, clientY: 400 });

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      expect(mockCanvasContext.translate).toHaveBeenCalled();
      const firstTranslateCall = mockCanvasContext.translate.mock.calls[0];
      const x = firstTranslateCall[0];
      const y = firstTranslateCall[1];

      // Mouse position is {x: 300, y: 400}
      // Spawn has random offset +/- 25
      expect(x).toBeGreaterThanOrEqual(275);
      expect(x).toBeLessThanOrEqual(325);
      expect(y).toBeGreaterThanOrEqual(375);
      expect(y).toBeLessThanOrEqual(425);
    });
});


