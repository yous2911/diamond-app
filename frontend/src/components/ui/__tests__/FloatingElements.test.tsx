import React from 'react';
import { render, screen } from '@testing-library/react';
import { SparkleElements, MagicElements, CelebrationElements } from '../FloatingElements';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, initial, animate, transition, ...props }: any) => (
      <div 
        className={className}
        style={style}
        data-testid="motion-div-floating"
        data-initial={JSON.stringify(initial)}
        data-animate={JSON.stringify(animate)}
        data-transition={JSON.stringify(transition)}
        {...props}
      >
        {children}
      </div>
    )
  },
  AnimatePresence: ({ children }: any) => <div data-testid="animate-presence">{children}</div>
}));

// Mock Math.random to get consistent results
const mockRandom = jest.fn();
jest.spyOn(Math, 'random').mockImplementation(mockRandom);

describe('SparkleElements', () => {
  beforeEach(() => {
    mockRandom.mockReturnValue(0.5); // Always return 0.5 for consistent positioning
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders when visible', () => {
    render(<SparkleElements isVisible={true} />);
    
    expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
    
    const motionElements = screen.getAllByTestId('motion-div-floating');
    expect(motionElements).toHaveLength(8); // 8 sparkle elements
  });

  it('does not render when not visible', () => {
    render(<SparkleElements isVisible={false} />);
    
    // Should render AnimatePresence but no content inside
    expect(screen.queryByTestId('motion-div')).not.toBeInTheDocument();
  });

  it('renders by default when isVisible not specified', () => {
    render(<SparkleElements />);
    
    const motionElements = screen.getAllByTestId('motion-div-floating');
    expect(motionElements).toHaveLength(8);
  });

  it('applies custom className', () => {
    render(<SparkleElements className="custom-sparkle-class" />);
    
    const container = screen.getByTestId('animate-presence').firstChild as HTMLElement;
    expect(container).toHaveClass('custom-sparkle-class');
  });

  it('creates sparkle elements with correct styling', () => {
    render(<SparkleElements />);
    
    const sparkles = screen.getAllByTestId('motion-div');
    sparkles.forEach(sparkle => {
      expect(sparkle).toHaveClass('absolute', 'w-2', 'h-2', 'bg-yellow-300', 'rounded-full');
    });
  });

  it('positions sparkles randomly', () => {
    mockRandom
      .mockReturnValueOnce(0.3) // First sparkle left position
      .mockReturnValueOnce(0.7) // First sparkle top position
      .mockReturnValueOnce(0.1) // Second sparkle left position
      .mockReturnValueOnce(0.9); // Second sparkle top position

    render(<SparkleElements />);
    
    const sparkles = screen.getAllByTestId('motion-div');
    
    expect(sparkles[0]).toHaveStyle({
      left: '30%',
      top: '70%'
    });
    
    expect(sparkles[1]).toHaveStyle({
      left: '10%',
      top: '90%'
    });
  });

  it('applies correct animation properties', () => {
    render(<SparkleElements />);
    
    const sparkles = screen.getAllByTestId('motion-div');
    
    sparkles.forEach((sparkle, index) => {
      const initialData = JSON.parse(sparkle.getAttribute('data-initial') || '{}');
      const animateData = JSON.parse(sparkle.getAttribute('data-animate') || '{}');
      const transitionData = JSON.parse(sparkle.getAttribute('data-transition') || '{}');
      
      expect(initialData).toEqual({ scale: 0, opacity: 0 });
      expect(animateData.scale).toEqual([0, 1, 0]);
      expect(animateData.opacity).toEqual([0, 1, 0]);
      expect(animateData.rotate).toEqual([0, 180, 360]);
      
      expect(transitionData.duration).toBe(1.5);
      expect(transitionData.delay).toBe(index * 0.1);
      expect(transitionData.repeat).toBe(Infinity);
      expect(transitionData.ease).toBe('easeInOut');
    });
  });
});

describe('MagicElements', () => {
  beforeEach(() => {
    mockRandom.mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders 6 magic elements when visible', () => {
    render(<MagicElements isVisible={true} />);
    
    const motionElements = screen.getAllByTestId('motion-div-floating');
    expect(motionElements).toHaveLength(6);
  });

  it('does not render when not visible', () => {
    render(<MagicElements isVisible={false} />);
    
    expect(screen.queryByTestId('motion-div')).not.toBeInTheDocument();
  });

  it('creates magic elements with correct styling', () => {
    render(<MagicElements />);
    
    const magicElements = screen.getAllByTestId('motion-div');
    magicElements.forEach(element => {
      expect(element).toHaveClass('absolute', 'w-3', 'h-3', 'bg-purple-400', 'rounded-full');
    });
  });

  it('applies correct animation properties', () => {
    render(<MagicElements />);
    
    const magicElements = screen.getAllByTestId('motion-div');
    
    magicElements.forEach((element, index) => {
      const initialData = JSON.parse(element.getAttribute('data-initial') || '{}');
      const animateData = JSON.parse(element.getAttribute('data-animate') || '{}');
      const transitionData = JSON.parse(element.getAttribute('data-transition') || '{}');
      
      expect(initialData).toEqual({ scale: 0, opacity: 0 });
      expect(animateData.scale).toEqual([0, 1.5, 0]);
      expect(animateData.opacity).toEqual([0, 0.8, 0]);
      expect(animateData.y).toEqual([0, -20, 0]);
      
      expect(transitionData.duration).toBe(2);
      expect(transitionData.delay).toBe(index * 0.2);
      expect(transitionData.repeat).toBe(Infinity);
      expect(transitionData.ease).toBe('easeInOut');
    });
  });

  it('applies custom className', () => {
    render(<MagicElements className="custom-magic-class" />);
    
    const container = screen.getByTestId('animate-presence').firstChild as HTMLElement;
    expect(container).toHaveClass('custom-magic-class');
  });
});

describe('CelebrationElements', () => {
  beforeEach(() => {
    mockRandom.mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders 12 celebration elements when visible', () => {
    render(<CelebrationElements isVisible={true} />);
    
    const motionElements = screen.getAllByTestId('motion-div-floating');
    expect(motionElements).toHaveLength(12);
  });

  it('does not render when not visible', () => {
    render(<CelebrationElements isVisible={false} />);
    
    expect(screen.queryByTestId('motion-div')).not.toBeInTheDocument();
  });

  it('creates celebration elements with correct styling', () => {
    render(<CelebrationElements />);
    
    const celebrationElements = screen.getAllByTestId('motion-div');
    celebrationElements.forEach(element => {
      expect(element).toHaveClass(
        'absolute', 
        'w-2', 
        'h-2', 
        'bg-gradient-to-r', 
        'from-pink-400', 
        'to-yellow-400', 
        'rounded-full'
      );
    });
  });

  it('applies correct animation properties', () => {
    render(<CelebrationElements />);
    
    const celebrationElements = screen.getAllByTestId('motion-div');
    
    celebrationElements.forEach((element, index) => {
      const initialData = JSON.parse(element.getAttribute('data-initial') || '{}');
      const animateData = JSON.parse(element.getAttribute('data-animate') || '{}');
      const transitionData = JSON.parse(element.getAttribute('data-transition') || '{}');
      
      expect(initialData).toEqual({ scale: 0, opacity: 0 });
      expect(animateData.scale).toEqual([0, 1, 0]);
      expect(animateData.opacity).toEqual([0, 1, 0]);
      expect(animateData.y).toEqual([0, -30, -60]);
      
      expect(transitionData.duration).toBe(2.5);
      expect(transitionData.delay).toBe(index * 0.15);
      expect(transitionData.repeat).toBe(Infinity);
      expect(transitionData.ease).toBe('easeOut');
    });
  });

  it('applies custom className', () => {
    render(<CelebrationElements className="custom-celebration-class" />);
    
    const container = screen.getByTestId('animate-presence').firstChild as HTMLElement;
    expect(container).toHaveClass('custom-celebration-class');
  });

  it('positions elements randomly', () => {
    mockRandom
      .mockReturnValueOnce(0.2)
      .mockReturnValueOnce(0.8)
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.6);

    render(<CelebrationElements />);
    
    const celebrationElements = screen.getAllByTestId('motion-div');
    
    expect(celebrationElements[0]).toHaveStyle({
      left: '20%',
      top: '80%'
    });
    
    expect(celebrationElements[1]).toHaveStyle({
      left: '40%',
      top: '60%'
    });
  });
});