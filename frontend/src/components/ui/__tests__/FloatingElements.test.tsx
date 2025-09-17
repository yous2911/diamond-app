import React from 'react';
import { render, screen } from '@testing-library/react';
import { SparkleElements, MagicElements, CelebrationElements } from '../FloatingElements';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...props }: any) => (
      <div className={className} style={style} data-testid="motion-div" {...props}>
        {children}
      </div>
    )
  },
  AnimatePresence: ({ children }: any) => <div data-testid="animate-presence">{children}</div>
}));

describe('FloatingElements', () => {
  describe('SparkleElements', () => {
    it('renders sparkle elements when visible', () => {
      render(<SparkleElements isVisible={true} />);

      expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
      const sparkleElements = screen.getAllByTestId('motion-div');
      expect(sparkleElements.length).toBeGreaterThan(0);
    });

    it('does not render when invisible', () => {
      render(<SparkleElements isVisible={false} />);

      expect(screen.queryByTestId('animate-presence')).not.toBeInTheDocument();
    });

    it('renders with default visibility when prop not provided', () => {
      render(<SparkleElements />);

      expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<SparkleElements isVisible={true} className="custom-sparkle-class" />);

      const container = screen.getByTestId('animate-presence').firstChild as HTMLElement;
      expect(container).toHaveClass('custom-sparkle-class');
    });

    it('creates multiple sparkle particles', () => {
      render(<SparkleElements isVisible={true} />);

      const sparkleParticles = screen.getAllByTestId('motion-div').filter(
        el => el.className?.includes('bg-yellow-300')
      );
      expect(sparkleParticles.length).toBe(8);
    });

    it('positions sparkles randomly', () => {
      render(<SparkleElements isVisible={true} />);

      const sparkleParticles = screen.getAllByTestId('motion-div').filter(
        el => el.className?.includes('bg-yellow-300')
      );

      sparkleParticles.forEach(sparkle => {
        expect(sparkle.style.left).toMatch(/\d+(\.\d+)?%/);
        expect(sparkle.style.top).toMatch(/\d+(\.\d+)?%/);
      });
    });

    it('applies proper styling to sparkle particles', () => {
      render(<SparkleElements isVisible={true} />);

      const sparkleParticles = screen.getAllByTestId('motion-div').filter(
        el => el.className?.includes('bg-yellow-300')
      );

      sparkleParticles.forEach(sparkle => {
        expect(sparkle).toHaveClass('absolute', 'w-2', 'h-2', 'bg-yellow-300', 'rounded-full');
      });
    });
  });

  describe('MagicElements', () => {
    it('renders magic elements when visible', () => {
      render(<MagicElements isVisible={true} />);

      expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
    });

    it('does not render when invisible', () => {
      render(<MagicElements isVisible={false} />);

      expect(screen.queryByTestId('animate-presence')).not.toBeInTheDocument();
    });

    it('renders with default visibility when prop not provided', () => {
      render(<MagicElements />);

      expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<MagicElements isVisible={true} className="custom-magic-class" />);

      const container = screen.getByTestId('animate-presence').firstChild as HTMLElement;
      expect(container).toHaveClass('custom-magic-class');
    });

    it('creates magic particle effects', () => {
      render(<MagicElements isVisible={true} />);

      const magicParticles = screen.getAllByTestId('motion-div').filter(
        el => el.className?.includes('bg-purple-400')
      );
      expect(magicParticles.length).toBe(6);
    });

    it('applies proper styling to magic particles', () => {
      render(<MagicElements isVisible={true} />);

      const magicParticles = screen.getAllByTestId('motion-div').filter(
        el => el.className?.includes('bg-purple-400')
      );

      magicParticles.forEach(particle => {
        expect(particle).toHaveClass('absolute', 'w-3', 'h-3', 'bg-purple-400', 'rounded-full');
      });
    });
  });

  describe('CelebrationElements', () => {
    it('renders celebration elements when visible', () => {
      render(<CelebrationElements isVisible={true} />);

      expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
    });

    it('does not render when invisible', () => {
      render(<CelebrationElements isVisible={false} />);

      expect(screen.queryByTestId('animate-presence')).not.toBeInTheDocument();
    });

    it('renders with default visibility when prop not provided', () => {
      render(<CelebrationElements />);

      expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<CelebrationElements isVisible={true} className="custom-celebration-class" />);

      const container = screen.getByTestId('animate-presence').firstChild as HTMLElement;
      expect(container).toHaveClass('custom-celebration-class');
    });

    it('creates celebration confetti effects', () => {
      render(<CelebrationElements isVisible={true} />);

      const confettiParticles = screen.getAllByTestId('motion-div').filter(
        el => el.className?.includes('bg-gradient-to-r')
      );
      expect(confettiParticles.length).toBe(12);
    });

    it('uses gradient colors for confetti', () => {
      render(<CelebrationElements isVisible={true} />);

      const confettiParticles = screen.getAllByTestId('motion-div').filter(
        el => el.className?.includes('from-pink-400') && el.className?.includes('to-yellow-400')
      );
      expect(confettiParticles.length).toBe(12);
    });
  });

  describe('Accessibility', () => {
    it('applies pointer-events-none to prevent interaction interference', () => {
      render(<SparkleElements isVisible={true} />);

      const container = screen.getByTestId('animate-presence').firstChild as HTMLElement;
      expect(container).toHaveClass('pointer-events-none');
    });

    it('uses absolute positioning to overlay content', () => {
      render(<MagicElements isVisible={true} />);

      const container = screen.getByTestId('animate-presence').firstChild as HTMLElement;
      expect(container).toHaveClass('absolute', 'inset-0');
    });

    it('does not interfere with screen readers when hidden', () => {
      render(<CelebrationElements isVisible={false} />);

      expect(screen.queryByTestId('animate-presence')).not.toBeInTheDocument();
    });
  });

  describe('Performance Considerations', () => {
    it('does not render DOM elements when not visible', () => {
      const { container } = render(<SparkleElements isVisible={false} />);

      expect(container.firstChild).toBeNull();
    });

    it('uses efficient rendering with arrays', () => {
      render(<SparkleElements isVisible={true} />);

      const sparkleParticles = screen.getAllByTestId('motion-div').filter(
        el => el.className?.includes('bg-yellow-300')
      );
      expect(sparkleParticles.length).toBe(8);
    });

    it('maintains consistent particle count across renders', () => {
      const { rerender } = render(<SparkleElements isVisible={true} />);

      const initialCount = screen.getAllByTestId('motion-div').filter(
        el => el.className?.includes('bg-yellow-300')
      ).length;

      rerender(<SparkleElements isVisible={true} />);

      const secondCount = screen.getAllByTestId('motion-div').filter(
        el => el.className?.includes('bg-yellow-300')
      ).length;

      expect(initialCount).toBe(secondCount);
    });

    it('handles visibility toggle efficiently', () => {
      const { rerender } = render(<SparkleElements isVisible={true} />);

      expect(screen.getByTestId('animate-presence')).toBeInTheDocument();

      rerender(<SparkleElements isVisible={false} />);

      expect(screen.queryByTestId('animate-presence')).not.toBeInTheDocument();

      rerender(<SparkleElements isVisible={true} />);

      expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
    });
  });
});