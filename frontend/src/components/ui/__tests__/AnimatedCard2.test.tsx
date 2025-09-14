import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    div: ({ children, className, variants, initial, animate, exit, whileHover, whileTap, layout, onClick, ...props }: any) => {
      // Only add testid to the main card, not shimmer effects
      const isMainCard = className && className.includes('relative overflow-hidden rounded-xl p-4');
      return (
        <div 
          className={className}
          onClick={onClick}
          data-testid={isMainCard ? "animated-card" : undefined}
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
      );
    }
  },
  AnimatePresence: ({ children }: any) => <div data-testid="animate-presence">{children}</div>
}));

describe('AnimatedCard', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<AnimatedCard>Test content</AnimatedCard>);
      
      const card = screen.getByTestId('animated-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent('Test content');
    });

    it('renders children correctly', () => {
      render(
        <AnimatedCard>
          <h1>Title</h1>
          <p>Description</p>
        </AnimatedCard>
      );
      
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('applies default classes correctly', () => {
      render(<AnimatedCard>Content</AnimatedCard>);
      
      const card = screen.getByTestId('animated-card');
      expect(card).toHaveClass(
        'relative', 'overflow-hidden', 'rounded-xl', 'p-4',
        'transition-all', 'duration-300', 'shadow-lg',
        'bg-white', 'cursor-pointer'
      );
    });
  });

  describe('Click Handling', () => {
    it('calls onClick when clicked and not disabled', async () => {
      const user = userEvent.setup();
      render(<AnimatedCard onClick={mockOnClick}>Clickable</AnimatedCard>);
      
      await user.click(screen.getByTestId('animated-card'));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup();
      render(<AnimatedCard onClick={mockOnClick} disabled>Disabled</AnimatedCard>);
      
      await user.click(screen.getByTestId('animated-card'));
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Variants', () => {
    it('applies default variant styling', () => {
      render(<AnimatedCard variant="default">Default</AnimatedCard>);
      
      const card = screen.getByTestId('animated-card');
      expect(card).toHaveClass('bg-white');
    });

    it('applies sparkle variant styling', () => {
      render(<AnimatedCard variant="sparkle">Sparkle</AnimatedCard>);
      
      const card = screen.getByTestId('animated-card');
      expect(card).toHaveClass(
        'bg-gradient-to-br', 'from-yellow-50', 'to-orange-100',
        'border-yellow-300', 'border-2'
      );
    });

    it('applies reward variant styling', () => {
      render(<AnimatedCard variant="reward">Reward</AnimatedCard>);
      
      const card = screen.getByTestId('animated-card');
      expect(card).toHaveClass(
        'bg-gradient-to-br', 'from-green-50', 'to-emerald-100',
        'border-green-300', 'border-2'
      );
    });

    it('applies progress variant styling', () => {
      render(<AnimatedCard variant="progress">Progress</AnimatedCard>);
      
      const card = screen.getByTestId('animated-card');
      expect(card).toHaveClass(
        'bg-gradient-to-br', 'from-blue-50', 'to-indigo-100',
        'border-blue-300', 'border-2'
      );
    });

    it('applies exercise variant styling', () => {
      render(<AnimatedCard variant="exercise">Exercise</AnimatedCard>);
      
      const card = screen.getByTestId('animated-card');
      expect(card).toHaveClass(
        'bg-gradient-to-br', 'from-purple-50', 'to-violet-100',
        'border-purple-300', 'border-2'
      );
    });
  });

  describe('Visual Effects', () => {
    it('applies shadow by default', () => {
      render(<AnimatedCard>With Shadow</AnimatedCard>);
      
      const card = screen.getByTestId('animated-card');
      expect(card).toHaveClass('shadow-lg');
    });

    it('removes shadow when shadow is false', () => {
      render(<AnimatedCard shadow={false}>No Shadow</AnimatedCard>);
      
      const card = screen.getByTestId('animated-card');
      expect(card).not.toHaveClass('shadow-lg');
    });

    it('applies border when border is true', () => {
      render(<AnimatedCard border>With Border</AnimatedCard>);
      
      const card = screen.getByTestId('animated-card');
      expect(card).toHaveClass('border-2');
    });

    it('applies gradient when gradient is true', () => {
      render(<AnimatedCard gradient>With Gradient</AnimatedCard>);
      
      const card = screen.getByTestId('animated-card');
      expect(card).toHaveClass('bg-gradient-to-br', 'from-blue-50', 'to-indigo-100');
    });

    it('applies disabled styling when disabled', () => {
      render(<AnimatedCard disabled>Disabled</AnimatedCard>);
      
      const card = screen.getByTestId('animated-card');
      expect(card).toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });

  describe('Glow Effect', () => {
    it('renders glow effect when glow is true', () => {
      render(<AnimatedCard glow>Glowing</AnimatedCard>);
      
      const card = screen.getByTestId('animated-card');
      const glowEffect = card.querySelector('.absolute.inset-0.rounded-xl.bg-gradient-to-r');
      expect(glowEffect).toBeInTheDocument();
    });

    it('does not render glow effect when glow is false', () => {
      render(<AnimatedCard glow={false}>No Glow</AnimatedCard>);
      
      const card = screen.getByTestId('animated-card');
      // The shimmer effect is always rendered for hover, but glow effect should not be
      const children = card.children;
      const hasGlowEffect = Array.from(children).some(child => 
        child.className && child.className.includes('from-blue-400/20')
      );
      expect(hasGlowEffect).toBe(false);
    });
  });
});

describe('Variant Components', () => {
  describe('InteractiveCard', () => {
    it('renders with interactive properties enabled', () => {
      render(<InteractiveCard>Interactive</InteractiveCard>);
      
      const card = screen.getByTestId('animated-card');
      expect(card).toHaveClass('shadow-lg');
      expect(card).toHaveAttribute('data-while-hover', 'hover');
    });

    it('includes glow effect', () => {
      render(<InteractiveCard>Interactive</InteractiveCard>);
      
      const card = screen.getByTestId('animated-card');
      const glowEffect = card.querySelector('.absolute.inset-0.rounded-xl.bg-gradient-to-r');
      expect(glowEffect).toBeInTheDocument();
    });
  });

  describe('StaticCard', () => {
    it('renders without hover effects', () => {
      render(<StaticCard>Static</StaticCard>);
      
      const card = screen.getByTestId('animated-card');
      // StaticCard should not have hover effects, so whileHover should be undefined
      expect(card).not.toHaveAttribute('data-while-hover');
      expect(card).toHaveClass('shadow-lg');
    });

    it('does not include glow effect', () => {
      render(<StaticCard>Static</StaticCard>);
      
      const card = screen.getByTestId('animated-card');
      const glowEffect = card.querySelector('.absolute.inset-0.rounded-xl.bg-gradient-to-r');
      expect(glowEffect).not.toBeInTheDocument();
    });
  });

  describe('GameCard', () => {
    it('renders with game-specific styling', () => {
      render(<GameCard>Game</GameCard>);
      
      const card = screen.getByTestId('animated-card');
      expect(card).toHaveClass(
        'bg-gradient-to-br', 'from-yellow-50', 'to-orange-100',
        'border-orange-300', 'border-2'
      );
    });

    it('includes all interactive effects', () => {
      render(<GameCard>Game</GameCard>);
      
      const card = screen.getByTestId('animated-card');
      expect(card).toHaveClass('shadow-lg');
      const glowEffect = card.querySelector('.absolute.inset-0.rounded-xl.bg-gradient-to-r');
      expect(glowEffect).toBeInTheDocument();
    });
  });

  describe('SuccessCard', () => {
    it('renders with success styling', () => {
      render(<SuccessCard>Success</SuccessCard>);
      
      const card = screen.getByTestId('animated-card');
      expect(card).toHaveClass(
        'bg-gradient-to-br', 'from-green-50', 'to-emerald-100',
        'border-green-300'
      );
    });
  });

  describe('ErrorCard', () => {
    it('renders with error styling', () => {
      render(<ErrorCard>Error</ErrorCard>);
      
      const card = screen.getByTestId('animated-card');
      expect(card).toHaveClass(
        'bg-gradient-to-br', 'from-red-50', 'to-pink-100',
        'border-red-300'
      );
    });
  });
});