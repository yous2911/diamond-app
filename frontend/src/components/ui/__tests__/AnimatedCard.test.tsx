import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { 
  AnimatedCard,
  InteractiveCard,
  StaticCard,
  FloatingCard,
  GameCard,
  SuccessCard,
  ErrorCard 
} from '../AnimatedCard';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick, variants, initial, animate, exit, whileHover, whileTap, layout, ...props }: any) => (
      <div 
        className={className} 
        onClick={onClick}
        data-testid="motion-div"
        data-variants={JSON.stringify(variants)}
        data-initial={initial}
        data-animate={animate}
        data-exit={exit}
        data-while-hover={whileHover}
        data-while-tap={whileTap}
        data-layout={layout}
        {...props}
      >
        {children}
      </div>
    )
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>
}));

describe('AnimatedCard', () => {
  it('renders children correctly', () => {
    render(
      <AnimatedCard>
        <div>Test Content</div>
      </AnimatedCard>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies default classes', () => {
    render(<AnimatedCard>Content</AnimatedCard>);
    
    const card = screen.getByTestId('motion-div');
    expect(card).toHaveClass('relative', 'overflow-hidden', 'rounded-xl', 'p-4');
  });

  it('applies custom className', () => {
    render(<AnimatedCard className="custom-class">Content</AnimatedCard>);
    
    const card = screen.getByTestId('motion-div');
    expect(card.className).toContain('custom-class');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<AnimatedCard onClick={handleClick}>Clickable</AnimatedCard>);
    
    const card = screen.getByTestId('motion-div');
    fireEvent.click(card);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('prevents click when disabled', () => {
    const handleClick = jest.fn();
    render(<AnimatedCard onClick={handleClick} disabled>Disabled</AnimatedCard>);
    
    const card = screen.getByTestId('motion-div');
    fireEvent.click(card);
    
    expect(handleClick).not.toHaveBeenCalled();
    expect(card).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('applies shadow when enabled', () => {
    render(<AnimatedCard shadow>Shadowed</AnimatedCard>);
    
    const card = screen.getByTestId('motion-div');
    expect(card).toHaveClass('shadow-lg', 'hover:shadow-xl');
  });

  it('applies border when enabled', () => {
    render(<AnimatedCard border>Bordered</AnimatedCard>);
    
    const card = screen.getByTestId('motion-div');
    expect(card).toHaveClass('border-2');
  });

  it('applies gradient when enabled', () => {
    render(<AnimatedCard gradient>Gradient</AnimatedCard>);
    
    const card = screen.getByTestId('motion-div');
    expect(card).toHaveClass('bg-gradient-to-br');
  });

  describe('variants', () => {
    it('applies sparkle variant classes', () => {
      render(<AnimatedCard variant="sparkle">Sparkle</AnimatedCard>);
      
      const card = screen.getByTestId('motion-div');
      expect(card).toHaveClass('bg-gradient-to-br', 'from-yellow-50', 'to-orange-100', 'border-yellow-300');
    });

    it('applies reward variant classes', () => {
      render(<AnimatedCard variant="reward">Reward</AnimatedCard>);
      
      const card = screen.getByTestId('motion-div');
      expect(card).toHaveClass('bg-gradient-to-br', 'from-green-50', 'to-emerald-100', 'border-green-300');
    });

    it('applies progress variant classes', () => {
      render(<AnimatedCard variant="progress">Progress</AnimatedCard>);
      
      const card = screen.getByTestId('motion-div');
      expect(card).toHaveClass('bg-gradient-to-br', 'from-blue-50', 'to-indigo-100', 'border-blue-300');
    });

    it('applies exercise variant classes', () => {
      render(<AnimatedCard variant="exercise">Exercise</AnimatedCard>);
      
      const card = screen.getByTestId('motion-div');
      expect(card).toHaveClass('bg-gradient-to-br', 'from-purple-50', 'to-violet-100', 'border-purple-300');
    });

    it('applies default variant classes', () => {
      render(<AnimatedCard variant="default">Default</AnimatedCard>);
      
      const card = screen.getByTestId('motion-div');
      expect(card).toHaveClass('bg-white');
    });
  });

  it('shows glow effect when enabled', () => {
    render(<AnimatedCard glow>Glowing</AnimatedCard>);
    
    // Check if glow div is present
    const glowDiv = screen.getByTestId('motion-div').querySelector('.absolute.inset-0.rounded-xl.bg-gradient-to-r');
    expect(glowDiv).toBeInTheDocument();
  });

  it('shows shimmer effect on hover when enabled', () => {
    render(<AnimatedCard hover>Hoverable</AnimatedCard>);
    
    // Check if shimmer div is present
    const shimmerDiv = screen.getByTestId('motion-div').querySelector('.absolute.inset-0.rounded-xl.bg-gradient-to-r');
    expect(shimmerDiv).toBeInTheDocument();
  });

  it('does not show shimmer when disabled', () => {
    render(<AnimatedCard hover disabled>Disabled hover</AnimatedCard>);
    
    const card = screen.getByTestId('motion-div');
    expect(card).toHaveClass('cursor-not-allowed');
  });

  it('configures animation variants correctly', () => {
    render(<AnimatedCard delay={0.5} duration={0.8}>Animated</AnimatedCard>);
    
    const card = screen.getByTestId('motion-div');
    expect(card.getAttribute('data-initial')).toBe('initial');
    expect(card.getAttribute('data-animate')).toBe('animate');
    expect(card.getAttribute('data-exit')).toBe('exit');
  });

  it('sets hover and tap variants when hover is enabled', () => {
    render(<AnimatedCard hover>Hoverable</AnimatedCard>);
    
    const card = screen.getByTestId('motion-div');
    expect(card.getAttribute('data-while-hover')).toBe('hover');
    expect(card.getAttribute('data-while-tap')).toBe('tap');
  });

  it('does not set hover variants when disabled', () => {
    render(<AnimatedCard hover disabled>Disabled</AnimatedCard>);
    
    const card = screen.getByTestId('motion-div');
    expect(card.getAttribute('data-while-hover')).toBe('undefined');
  });
});

describe('Card Variants', () => {
  it('InteractiveCard has correct props', () => {
    render(<InteractiveCard>Interactive</InteractiveCard>);
    
    const card = screen.getByTestId('motion-div');
    expect(card).toHaveClass('shadow-lg', 'hover:shadow-xl');
  });

  it('StaticCard has correct props', () => {
    render(<StaticCard>Static</StaticCard>);
    
    const card = screen.getByTestId('motion-div');
    expect(card).toHaveClass('shadow-lg', 'hover:shadow-xl');
  });

  it('FloatingCard has correct props', () => {
    render(<FloatingCard>Floating</FloatingCard>);
    
    const card = screen.getByTestId('motion-div');
    expect(card).toHaveClass('shadow-lg', 'hover:shadow-xl', 'hover:shadow-2xl');
  });

  it('GameCard has correct props and styling', () => {
    render(<GameCard>Game</GameCard>);
    
    const card = screen.getByTestId('motion-div');
    expect(card).toHaveClass('shadow-lg', 'border-2', 'from-yellow-50', 'to-orange-100', 'border-orange-300');
  });

  it('SuccessCard has correct props and styling', () => {
    render(<SuccessCard>Success</SuccessCard>);
    
    const card = screen.getByTestId('motion-div');
    expect(card).toHaveClass('from-green-50', 'to-emerald-100', 'border-green-300');
  });

  it('ErrorCard has correct props and styling', () => {
    render(<ErrorCard>Error</ErrorCard>);
    
    const card = screen.getByTestId('motion-div');
    expect(card).toHaveClass('from-red-50', 'to-pink-100', 'border-red-300');
  });

  it('variant cards accept additional props', () => {
    const handleClick = jest.fn();
    render(<GameCard onClick={handleClick} className="extra-class">Game with props</GameCard>);
    
    const card = screen.getByTestId('motion-div');
    expect(card.className).toContain('extra-class');
    
    fireEvent.click(card);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});