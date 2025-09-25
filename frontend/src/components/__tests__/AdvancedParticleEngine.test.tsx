import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import AdvancedParticleEngine from '../AdvancedParticleEngine';

// Mock requestAnimationFrame
const mockRequestAnimationFrame = jest.fn((callback) => {
  // Simulate animation frame by calling the callback after a microtask
  if (callback) {
    Promise.resolve().then(() => callback(performance.now()));
  }
  return 1; // Return a frame ID
});
const mockCancelAnimationFrame = jest.fn();

global.requestAnimationFrame = mockRequestAnimationFrame;
global.cancelAnimationFrame = mockCancelAnimationFrame;

// Mock performance.now
global.performance = {
  now: jest.fn(() => Date.now())
};

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
  bezierCurveTo: jest.fn(),
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
  ellipse: jest.fn()
};

// Mock canvas element
const mockCanvas = {
  getContext: jest.fn(() => mockCanvasContext),
  getBoundingClientRect: jest.fn(() => ({
    left: 0,
    top: 0,
    width: 800,
    height: 600
  })),
  width: 800,
  height: 600,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Mock HTMLCanvasElement
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

describe('AdvancedParticleEngine', () => {
  const defaultProps = {
    particleType: 'sparkle' as const,
    intensity: 3 as const,
    isActive: true
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    // Reset the animation frame mocks
    mockRequestAnimationFrame.mockClear();
    mockCancelAnimationFrame.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders canvas element', () => {
    render(<AdvancedParticleEngine {...defaultProps} />);
    
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('applies correct width and height', () => {
    render(<AdvancedParticleEngine {...defaultProps} width={1024} height={768} />);
    
    const canvas = document.querySelector('canvas');
    expect(canvas).toHaveAttribute('width', '1024');
    expect(canvas).toHaveAttribute('height', '768');
  });

  it('applies custom className', () => {
    render(<AdvancedParticleEngine {...defaultProps} className="custom-class" />);
    
    const canvas = document.querySelector('canvas');
    expect(canvas).toHaveClass('custom-class');
  });

  it('does not render when isActive is false', () => {
    render(<AdvancedParticleEngine {...defaultProps} isActive={false} />);
    
    // Canvas should still be rendered but animation should not start
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('handles different particle types', () => {
    const particleTypes = ['fire', 'water', 'magic', 'crystal', 'lightning', 'smoke', 'sparkle', 'heart', 'star'] as const;
    
    particleTypes.forEach(type => {
      const { unmount } = render(<AdvancedParticleEngine {...defaultProps} particleType={type} />);
      expect(document.querySelector('canvas')).toBeInTheDocument();
      unmount();
    });
  });

  it('handles different intensity levels', () => {
    const intensities = [0, 1, 2, 3, 4, 5] as const;
    
    intensities.forEach(intensity => {
      const { unmount } = render(<AdvancedParticleEngine {...defaultProps} intensity={intensity} />);
      expect(document.querySelector('canvas')).toBeInTheDocument();
      unmount();
    });
  });

  it('handles different behaviors', () => {
    const behaviors = ['normal', 'spiral', 'orbit', 'explosion', 'attract', 'repel'] as const;
    
    behaviors.forEach(behavior => {
      const { unmount } = render(<AdvancedParticleEngine {...defaultProps} behavior={behavior} />);
      expect(document.querySelector('canvas')).toBeInTheDocument();
      unmount();
    });
  });

  it('handles mouse move events', () => {
    render(<AdvancedParticleEngine {...defaultProps} />);
    
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    
    // Simulate mouse move
    fireEvent.mouseMove(canvas!, { clientX: 100, clientY: 200 });
    
    // Should not throw errors
    expect(canvas).toBeInTheDocument();
  });

  it('handles custom emitter position', () => {
    render(
      <AdvancedParticleEngine 
        {...defaultProps} 
        emitterPosition={{ x: 100, y: 200 }} 
      />
    );
    
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('handles attractor position for orbit behavior', () => {
    render(
      <AdvancedParticleEngine 
        {...defaultProps} 
        behavior="orbit"
        attractorPosition={{ x: 400, y: 300 }} 
      />
    );
    
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('handles wind force', () => {
    render(
      <AdvancedParticleEngine 
        {...defaultProps} 
        windForce={{ x: 0.5, y: -0.2 }} 
      />
    );
    
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('handles physics settings', () => {
    render(
      <AdvancedParticleEngine 
        {...defaultProps} 
        enablePhysics={true}
        enableTrails={true}
        enableCollisions={true}
      />
    );
    
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('handles physics disabled', () => {
    render(
      <AdvancedParticleEngine 
        {...defaultProps} 
        enablePhysics={false}
        enableTrails={false}
        enableCollisions={false}
      />
    );
    
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('handles custom particle count', () => {
    render(<AdvancedParticleEngine {...defaultProps} particleCount={200} />);
    
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('applies correct styling', () => {
    render(<AdvancedParticleEngine {...defaultProps} />);
    
    const canvas = document.querySelector('canvas');
    expect(canvas).toHaveStyle({
      imageRendering: 'crisp-edges',
      background: 'transparent'
    });
  });

  it('has pointer events enabled by default', () => {
    render(<AdvancedParticleEngine {...defaultProps} />);
    
    const canvas = document.querySelector('canvas');
    expect(canvas).toHaveClass('pointer-events-auto');
  });

  it('handles component unmounting', async () => {
    const { unmount } = render(<AdvancedParticleEngine {...defaultProps} isActive={true} />);

    expect(document.querySelector('canvas')).toBeInTheDocument();

    // Wait for the animation frame to be requested
    await act(async () => {
      await waitFor(() => {
        expect(mockRequestAnimationFrame).toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    unmount();

    // Should not throw errors during unmount
    expect(mockCancelAnimationFrame).toHaveBeenCalled();
  });

  it('handles animation frame requests', async () => {
    await act(async () => {
      render(<AdvancedParticleEngine {...defaultProps} isActive={true} />);

      // Wait for the animation frame to be requested
      await waitFor(() => {
        expect(mockRequestAnimationFrame).toHaveBeenCalled();
      }, { timeout: 1000 });
    });
  });

  it('handles different particle configurations', () => {
    const configs = [
      { particleType: 'fire' as const, behavior: 'explosion' as const },
      { particleType: 'water' as const, behavior: 'normal' as const },
      { particleType: 'magic' as const, behavior: 'spiral' as const },
      { particleType: 'crystal' as const, behavior: 'orbit' as const },
      { particleType: 'lightning' as const, behavior: 'explosion' as const },
      { particleType: 'heart' as const, behavior: 'orbit' as const },
      { particleType: 'star' as const, behavior: 'normal' as const }
    ];
    
    configs.forEach(config => {
      const { unmount } = render(<AdvancedParticleEngine {...defaultProps} {...config} />);
      expect(document.querySelector('canvas')).toBeInTheDocument();
      unmount();
    });
  });

  it('handles edge cases for intensity', () => {
    // Test edge cases
    render(<AdvancedParticleEngine {...defaultProps} intensity={0} />);
    expect(document.querySelector('canvas')).toBeInTheDocument();
    
    render(<AdvancedParticleEngine {...defaultProps} intensity={5} />);
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('handles large particle counts', () => {
    render(<AdvancedParticleEngine {...defaultProps} particleCount={1000} />);
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('handles zero particle count', () => {
    render(<AdvancedParticleEngine {...defaultProps} particleCount={0} />);
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('handles negative coordinates', () => {
    render(
      <AdvancedParticleEngine 
        {...defaultProps} 
        emitterPosition={{ x: -100, y: -200 }} 
      />
    );
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('handles large coordinates', () => {
    render(
      <AdvancedParticleEngine 
        {...defaultProps} 
        emitterPosition={{ x: 2000, y: 2000 }} 
      />
    );
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('handles rapid state changes', async () => {
    const { rerender } = render(<AdvancedParticleEngine {...defaultProps} isActive={true} />);
    
    await act(async () => {
      rerender(<AdvancedParticleEngine {...defaultProps} isActive={false} />);
    });
    
    await act(async () => {
      rerender(<AdvancedParticleEngine {...defaultProps} isActive={true} />);
    });
    
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('calls drawing functions in a loop when active', async () => {
    await act(async () => {
      render(<AdvancedParticleEngine {...defaultProps} isActive={true} />);

      // Wait for the animation frame to be requested
      await waitFor(() => {
        expect(mockRequestAnimationFrame).toHaveBeenCalled();
      }, { timeout: 1000 });

      // Wait for the animation callback to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // The animation callback should have been called, which should call clearRect
    expect(mockCanvasContext.clearRect).toHaveBeenCalled();
  });

  it('stops the animation loop when isActive becomes false', async () => {
    let rerender: any;

    await act(async () => {
      const result = render(<AdvancedParticleEngine {...defaultProps} isActive={true} />);
      rerender = result.rerender;

      // Wait for the animation frame to be requested
      await waitFor(() => {
        expect(mockRequestAnimationFrame).toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    await act(async () => {
      rerender(<AdvancedParticleEngine {...defaultProps} isActive={false} />);
    });

    // The component should call cancelAnimationFrame when isActive becomes false
    expect(mockCancelAnimationFrame).toHaveBeenCalled();
  });

  it('draws a heart shape when particleType is "heart"', async () => {
    await act(async () => {
      render(<AdvancedParticleEngine {...defaultProps} particleType="heart" isActive={true} />);

      // Wait for the animation frame to be requested
      await waitFor(() => {
        expect(mockRequestAnimationFrame).toHaveBeenCalled();
      }, { timeout: 1000 });

      // Wait for the animation callback to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // The heart drawing code should have been called
    expect(mockCanvasContext.bezierCurveTo).toHaveBeenCalled();
  });

  it('draws trails when enableTrails is true', async () => {
    await act(async () => {
      render(<AdvancedParticleEngine {...defaultProps} enableTrails={true} isActive={true} />);

      // Wait for the animation frame to be requested
      await waitFor(() => {
        expect(mockRequestAnimationFrame).toHaveBeenCalled();
      }, { timeout: 1000 });

      // Wait for the animation callback to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // The trail drawing code should have been called
    expect(mockCanvasContext.stroke).toHaveBeenCalled();
  });
});