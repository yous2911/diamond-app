/**
 * Basic Test - Minimal setup to verify testing works
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple component
const SimpleComponent: React.FC = () => {
  return <div data-testid="simple-component">Hello World</div>;
};

describe('Basic Test', () => {
  it('renders a simple component', () => {
    render(<SimpleComponent />);
    expect(screen.getByTestId('simple-component')).toHaveTextContent('Hello World');
  });

  it('renders multiple elements', () => {
    render(
      <div>
        <SimpleComponent />
        <div data-testid="another-element">Another Element</div>
      </div>
    );
    
    expect(screen.getByTestId('simple-component')).toBeInTheDocument();
    expect(screen.getByTestId('another-element')).toBeInTheDocument();
  });

  it('handles basic interactions', () => {
    const TestComponent: React.FC = () => {
      const [count, setCount] = React.useState(0);
      return (
        <div>
          <div data-testid="count">{count}</div>
          <button onClick={() => setCount(count + 1)}>Increment</button>
        </div>
      );
    };

    render(<TestComponent />);
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });
});









