/**
 * MicroInteractions Component Tests
 * Tests the wrapper component for small UI animations.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import MicroInteractions from '../MicroInteractions'; // Adjust path

// Mock Framer Motion as we can't test animations directly
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileHover, whileTap, ...props }: any) => (
      <div {...props} data-while-hover={whileHover ? 'true' : 'false'} data-while-tap={whileTap ? 'true' : 'false'}>
        {children}
      </div>
    ),
  },
}));

describe('MicroInteractions', () => {
  it('should render its children', () => {
    render(
      <MicroInteractions type="hover-grow">
        <button>Click Me</button>
      </MicroInteractions>
    );
    expect(screen.getByRole('button', { name: /Click Me/i })).toBeInTheDocument();
  });

  it('should apply hover-grow effect props', () => {
    render(
      <MicroInteractions type="hover-grow">
        <button>Click Me</button>
      </MicroInteractions>
    );
    const wrapper = screen.getByRole('button', { name: /Click Me/i }).parentElement;
    expect(wrapper).toHaveAttribute('data-while-hover', 'true');
    expect(wrapper).toHaveAttribute('data-while-tap', 'false');
  });

  it('should apply click-shake effect props', () => {
    render(
      <MicroInteractions type="click-shake">
        <button>Click Me</button>
      </MicroInteractions>
    );
    const wrapper = screen.getByRole('button', { name: /Click Me/i }).parentElement;
    expect(wrapper).toHaveAttribute('data-while-hover', 'false');
    expect(wrapper).toHaveAttribute('data-while-tap', 'true');
  });

  it('should apply both hover and tap effects if specified', () => {
    render(
      <MicroInteractions type="all">
        <button>Click Me</button>
      </MicroInteractions>
    );
    const wrapper = screen.getByRole('button', { name: /Click Me/i }).parentElement;
    expect(wrapper).toHaveAttribute('data-while-hover', 'true');
    expect(wrapper).toHaveAttribute('data-while-tap', 'true');
  });
});
