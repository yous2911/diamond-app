import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MagicalButton } from '../MagicalButton';

// Mock framer-motion
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      button: React.forwardRef(({ children, className, onClick, onMouseEnter, onMouseLeave, onMouseDown, onMouseUp, disabled, whileHover, whileTap, title, ...props }: any, ref: any) => (
        <button 
          ref={ref}
          className={className} 
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          disabled={disabled}
          title={title}
          data-testid="motion-button"
          {...props}
        >
          {children}
        </button>
      )),
      div: ({ children, className, initial, animate, transition, style, ...props }: any) => (
        <div 
          className={className} 
          style={style} 
          data-testid="motion-div"
          data-initial={JSON.stringify(initial)}
          data-animate={JSON.stringify(animate)}
          data-transition={JSON.stringify(transition)}
          {...props}
        >
          {children}
        </div>
      )
    },
    AnimatePresence: ({ children }: any) => <div>{children}</div>
  };
});

describe('MagicalButton', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders with default props', () => {
    render(<MagicalButton>Click me</MagicalButton>);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
  });

  it('applies primary variant classes by default', () => {
    render(<MagicalButton>Button</MagicalButton>);
    
    const button = screen.getByRole('button');
    expect(button.className).toContain('from-purple-600');
    expect(button.className).toContain('to-blue-600');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<MagicalButton onClick={handleClick}>Click me</MagicalButton>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('prevents click when disabled', () => {
    const handleClick = jest.fn();
    render(<MagicalButton onClick={handleClick} disabled>Disabled</MagicalButton>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
    expect(button).toHaveAttribute('disabled');
    expect(button.className).toContain('opacity-50');
  });

  it('prevents click when loading', () => {
    const handleClick = jest.fn();
    render(<MagicalButton onClick={handleClick} loading>Loading</MagicalButton>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
    expect(button).toHaveAttribute('disabled');
    expect(button.className).toContain('cursor-wait');
  });

  it('applies full width when specified', () => {
    render(<MagicalButton fullWidth>Full Width</MagicalButton>);
    
    const button = screen.getByRole('button');
    expect(button.className).toContain('w-full');
  });

  it('handles mouse events', () => {
    const handleMouseEnter = jest.fn();
    const handleMouseLeave = jest.fn();
    
    render(
      <MagicalButton 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        Hover me
      </MagicalButton>
    );
    
    const button = screen.getByRole('button');
    
    fireEvent.mouseEnter(button);
    expect(handleMouseEnter).toHaveBeenCalledTimes(1);
    
    fireEvent.mouseLeave(button);
    expect(handleMouseLeave).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    render(<MagicalButton className="custom-class">Custom</MagicalButton>);
    
    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-class');
  });

  it('sets tooltip when provided', () => {
    render(<MagicalButton tooltip="Click to continue">Tooltip</MagicalButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Click to continue');
  });

  it('applies data-testid when provided', () => {
    render(<MagicalButton data-testid="my-button">Test ID</MagicalButton>);
    
    expect(screen.getByTestId('my-button')).toBeInTheDocument();
  });
});