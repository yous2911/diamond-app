import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccessibleButton from '../AccessibleButton';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, className, ...props }: any) => {
      const { whileHover, whileTap, transition, ...domProps } = props;
      return <button className={className} {...domProps}>{children}</button>;
    }
  }
}));

describe('AccessibleButton', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<AccessibleButton>Click me</AccessibleButton>);
      
      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
    });

    it('renders without children (icon-only button)', () => {
      const icon = <span data-testid="icon">🎯</span>;
      render(<AccessibleButton icon={icon} ariaLabel="Target" />);
      
      const button = screen.getByRole('button', { name: 'Target' });
      expect(button).toBeInTheDocument();
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });

  describe('Click Handling', () => {
    it('calls onClick when clicked', async () => {
      const user = userEvent.setup();
      render(<AccessibleButton onClick={mockOnClick}>Click me</AccessibleButton>);
      
      await user.click(screen.getByRole('button'));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('passes event object to onClick handler', async () => {
      const user = userEvent.setup();
      render(<AccessibleButton onClick={mockOnClick}>Click me</AccessibleButton>);
      
      await user.click(screen.getByRole('button'));
      expect(mockOnClick).toHaveBeenCalledWith(expect.any(Object));
    });

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup();
      render(<AccessibleButton onClick={mockOnClick} disabled>Disabled</AccessibleButton>);
      
      await user.click(screen.getByRole('button'));
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', async () => {
      const user = userEvent.setup();
      render(<AccessibleButton onClick={mockOnClick} loading>Loading</AccessibleButton>);
      
      await user.click(screen.getByRole('button'));
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Variants', () => {
    it('renders primary variant by default', () => {
      render(<AccessibleButton>Primary</AccessibleButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-blue-600', 'text-white', 'border-blue-600');
    });

    it('renders secondary variant', () => {
      render(<AccessibleButton variant="secondary">Secondary</AccessibleButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white', 'text-blue-600', 'border-blue-600');
    });

    it('renders ghost variant', () => {
      render(<AccessibleButton variant="ghost">Ghost</AccessibleButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent', 'text-gray-600', 'border-transparent');
    });

    it('renders danger variant', () => {
      render(<AccessibleButton variant="danger">Danger</AccessibleButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600', 'text-white', 'border-red-600');
    });
  });

  describe('Sizes', () => {
    it('renders medium size by default', () => {
      render(<AccessibleButton>Medium</AccessibleButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4', 'py-2', 'text-base');
    });

    it('renders small size', () => {
      render(<AccessibleButton size="sm">Small</AccessibleButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
    });

    it('renders large size', () => {
      render(<AccessibleButton size="lg">Large</AccessibleButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
    });
  });

  describe('States', () => {
    it('applies disabled state correctly', () => {
      render(<AccessibleButton disabled>Disabled</AccessibleButton>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-60', 'disabled:cursor-not-allowed');
    });

    it('applies loading state correctly', () => {
      render(<AccessibleButton loading>Loading</AccessibleButton>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('shows loading spinner when loading', () => {
      render(<AccessibleButton loading>Loading</AccessibleButton>);
      
      const spinner = screen.getByRole('img', { name: 'Loading' });
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });

    it('hides icon when loading', () => {
      const icon = <span data-testid="icon">🎯</span>;
      render(<AccessibleButton icon={icon} loading>Loading</AccessibleButton>);
      
      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'Loading' })).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    const icon = <span data-testid="icon">🎯</span>;

    it('renders icon on the left by default', () => {
      render(<AccessibleButton icon={icon}>With Icon</AccessibleButton>);
      
      const button = screen.getByRole('button');
      const iconElement = screen.getByTestId('icon');
      const textElement = screen.getByText('With Icon');
      
      expect(button).toContainElement(iconElement);
      expect(button).toContainElement(textElement);
      expect(iconElement.parentElement).toHaveClass('mr-2');
    });

    it('renders icon on the right when specified', () => {
      render(<AccessibleButton icon={icon} iconPosition="right">With Icon</AccessibleButton>);
      
      const iconElement = screen.getByTestId('icon');
      expect(iconElement.parentElement).toHaveClass('ml-2');
    });

    it('renders icon without margin when no children', () => {
      render(<AccessibleButton icon={icon} ariaLabel="Icon only" />);
      
      const iconElement = screen.getByTestId('icon');
      expect(iconElement.parentElement).not.toHaveClass('mr-2', 'ml-2');
    });

    it('applies correct icon size classes', () => {
      render(<AccessibleButton icon={icon} size="sm">Small Icon</AccessibleButton>);
      
      const iconElement = screen.getByTestId('icon');
      expect(iconElement.parentElement).toHaveClass('w-4', 'h-4');
    });

    it('applies medium icon size by default', () => {
      render(<AccessibleButton icon={icon}>Medium Icon</AccessibleButton>);
      
      const iconElement = screen.getByTestId('icon');
      expect(iconElement.parentElement).toHaveClass('w-5', 'h-5');
    });

    it('applies large icon size', () => {
      render(<AccessibleButton icon={icon} size="lg">Large Icon</AccessibleButton>);
      
      const iconElement = screen.getByTestId('icon');
      expect(iconElement.parentElement).toHaveClass('w-6', 'h-6');
    });
  });

  describe('Button Types', () => {
    it('renders as button type by default', () => {
      render(<AccessibleButton>Button</AccessibleButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('renders as submit type', () => {
      render(<AccessibleButton type="submit">Submit</AccessibleButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('renders as reset type', () => {
      render(<AccessibleButton type="reset">Reset</AccessibleButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'reset');
    });
  });

  describe('Layout', () => {
    it('applies full width when specified', () => {
      render(<AccessibleButton fullWidth>Full Width</AccessibleButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });

    it('does not apply full width by default', () => {
      render(<AccessibleButton>Normal Width</AccessibleButton>);
      
      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('w-full');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(<AccessibleButton className="custom-class">Custom</AccessibleButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('preserves default classes when adding custom className', () => {
      render(<AccessibleButton className="custom-class">Custom</AccessibleButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class', 'inline-flex', 'items-center', 'justify-center');
    });
  });

  describe('Accessibility', () => {
    it('applies aria-label when provided', () => {
      render(<AccessibleButton ariaLabel="Custom aria label">Button</AccessibleButton>);
      
      const button = screen.getByRole('button', { name: 'Custom aria label' });
      expect(button).toBeInTheDocument();
    });

    it('applies aria-describedby when provided', () => {
      render(<AccessibleButton ariaDescribedBy="description-id">Button</AccessibleButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'description-id');
    });

    it('sets aria-busy to true when loading', () => {
      render(<AccessibleButton loading>Loading</AccessibleButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('does not set aria-busy when not loading', () => {
      render(<AccessibleButton>Not Loading</AccessibleButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'false');
    });

    it('has proper focus styles', () => {
      render(<AccessibleButton>Focusable</AccessibleButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2');
    });

    it('is keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<AccessibleButton onClick={mockOnClick}>Keyboard</AccessibleButton>);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('is keyboard accessible with Space key', async () => {
      const user = userEvent.setup();
      render(<AccessibleButton onClick={mockOnClick}>Keyboard</AccessibleButton>);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{ }');
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading Spinner Accessibility', () => {
    it('loading spinner has proper ARIA attributes', () => {
      render(<AccessibleButton loading>Loading</AccessibleButton>);
      
      const spinner = screen.getByRole('img', { name: 'Loading' });
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
      expect(spinner).toHaveAttribute('role', 'img');
    });

    it('loading spinner has correct size based on button size', () => {
      render(<AccessibleButton loading size="lg">Loading Large</AccessibleButton>);
      
      const spinner = screen.getByRole('img', { name: 'Loading' });
      expect(spinner).toHaveClass('w-6', 'h-6');
    });
  });

  describe('Complex Scenarios', () => {
    it('handles all props together correctly', () => {
      const icon = <span data-testid="icon">🎯</span>;
      render(
        <AccessibleButton
          variant="danger"
          size="lg"
          fullWidth
          icon={icon}
          iconPosition="right"
          ariaLabel="Complex button"
          ariaDescribedBy="description"
          className="extra-class"
          onClick={mockOnClick}
        >
          Complex Button
        </AccessibleButton>
      );
      
      const button = screen.getByRole('button', { name: 'Complex button' });
      expect(button).toHaveClass(
        'bg-red-600', 'text-white', 'border-red-600',
        'px-6', 'py-3', 'text-lg',
        'w-full',
        'extra-class'
      );
      expect(button).toHaveAttribute('aria-describedby', 'description');
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('prioritizes loading state over disabled when both are true', () => {
      render(<AccessibleButton loading disabled>Loading and Disabled</AccessibleButton>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByRole('img', { name: 'Loading' })).toBeInTheDocument();
    });

    it('handles rapid state changes correctly', () => {
      const { rerender } = render(<AccessibleButton>Initial</AccessibleButton>);
      
      rerender(<AccessibleButton loading>Loading</AccessibleButton>);
      expect(screen.getByRole('img', { name: 'Loading' })).toBeInTheDocument();
      
      rerender(<AccessibleButton disabled>Disabled</AccessibleButton>);
      expect(screen.queryByRole('img', { name: 'Loading' })).not.toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('handles missing onClick gracefully', () => {
      expect(() => {
        render(<AccessibleButton>No onClick</AccessibleButton>);
      }).not.toThrow();
    });

    it('handles empty children gracefully', () => {
      expect(() => {
        render(<AccessibleButton>{null}</AccessibleButton>);
      }).not.toThrow();
    });

    it('handles undefined icon gracefully', () => {
      expect(() => {
        render(<AccessibleButton icon={undefined}>Undefined Icon</AccessibleButton>);
      }).not.toThrow();
    });
  });
});