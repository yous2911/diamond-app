/**
 * XPProgressWidget Component Tests
 * Tests the display of XP, level, and progress bar.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import XPProgressWidget from '../XPProgressWidget'; // Adjust the import path as needed

// =============================================================================
// TEST SETUP & MOCKS
// =============================================================================

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Star: () => <div data-testid="star-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
}));

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));


// =============================================================================
// COMPONENT TESTS
// =============================================================================

describe('XPProgressWidget', () => {
  const defaultProps = {
    currentXp: 750,
    levelXp: 1000,
    level: 5,
  };

  const renderComponent = (props = defaultProps) => {
    return render(<XPProgressWidget {...props} />);
  };

  describe('Rendering', () => {
    it('should display the current level', () => {
      renderComponent();
      expect(screen.getByText(`Level ${defaultProps.level}`)).toBeInTheDocument();
    });

    it('should display the current and total XP for the level', () => {
      renderComponent();
      expect(screen.getByText(`${defaultProps.currentXp} / ${defaultProps.levelXp} XP`)).toBeInTheDocument();
    });

    it('should render a progress bar', () => {
      renderComponent();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should set the progress bar ARIA attributes correctly', () => {
      renderComponent();
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', defaultProps.currentXp.toString());
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', defaultProps.levelXp.toString());
    });

    it('should calculate and display the correct percentage', () => {
        renderComponent();
        const percentage = Math.floor((defaultProps.currentXp / defaultProps.levelXp) * 100);
        expect(screen.getByText(`${percentage}%`)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle the case where XP is zero', () => {
      renderComponent({ ...defaultProps, currentXp: 0 });
      expect(screen.getByText(`0 / ${defaultProps.levelXp} XP`)).toBeInTheDocument();
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle the case where XP is at 100% (level up)', () => {
      renderComponent({ ...defaultProps, currentXp: 1000 });
      expect(screen.getByText(`1000 / ${defaultProps.levelXp} XP`)).toBeInTheDocument();
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '1000');
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should handle large numbers for XP and level', () => {
        renderComponent({ currentXp: 123456, levelXp: 200000, level: 99 });
        expect(screen.getByText('Level 99')).toBeInTheDocument();
        expect(screen.getByText('123456 / 200000 XP')).toBeInTheDocument();
    });
  });
});
