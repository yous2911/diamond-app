/**
 * XPCrystal Component Tests
 * Tests the display of XP crystals.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import XPCrystal from '../XPCrystal'; // Adjust path

// Mock Lucide icons, assuming it uses one for the crystal
jest.mock('lucide-react', () => ({
  Gem: () => <div data-testid="gem-icon" />,
}));


describe('XPCrystal', () => {
  it('should render the correct amount of XP', () => {
    render(<XPCrystal amount={100} />);
    expect(screen.getByText('+100')).toBeInTheDocument();
  });

  it('should render the crystal icon', () => {
    render(<XPCrystal amount={50} />);
    expect(screen.getByTestId('gem-icon')).toBeInTheDocument();
  });

  it('should apply different styles for different sizes', () => {
    const { rerender } = render(<XPCrystal amount={10} size="small" />);
    const container = screen.getByText('+10').parentElement;
    expect(container).toHaveClass('size-small'); // Assuming a class-based size system

    rerender(<XPCrystal amount={10} size="large" />);
    expect(container).toHaveClass('size-large');
  });

  it('should handle zero amount gracefully', () => {
    render(<XPCrystal amount={0} />);
    expect(screen.getByText('+0')).toBeInTheDocument();
  });
});
