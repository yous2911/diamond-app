import React from 'react';
import { render, screen } from '@testing-library/react';
import SkeletonLoader from '../SkeletonLoader';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} data-testid="motion-div" {...props}>
        {children}
      </div>
    )
  }
}));

describe('SkeletonLoader', () => {
  it('renders mascot skeleton correctly', () => {
    render(<SkeletonLoader type="mascot" />);
    
    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toBeInTheDocument();
    expect(motionDiv).toHaveClass('w-64', 'h-64', 'rounded-full');
  });

  it('renders xp-bar skeleton correctly', () => {
    render(<SkeletonLoader type="xp-bar" />);
    
    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toBeInTheDocument();
    expect(motionDiv).toHaveClass('h-8', 'rounded-full');
  });

  it('renders wardrobe skeleton correctly', () => {
    const { container } = render(<SkeletonLoader type="wardrobe" />);
    
    const wardrobeContainer = container.querySelector('.grid.grid-cols-3.gap-4');
    expect(wardrobeContainer).toBeInTheDocument();
  });

  it('renders exercise skeleton correctly', () => {
    const { container } = render(<SkeletonLoader type="exercise" />);
    
    const exerciseContainer = container.querySelector('.space-y-4');
    expect(exerciseContainer).toBeInTheDocument();
  });

  it('renders card skeleton correctly', () => {
    const { container } = render(<SkeletonLoader type="card" />);
    
    const cardContainer = container.querySelector('.rounded-xl');
    expect(cardContainer).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<SkeletonLoader type="mascot" className="custom-class" />);
    
    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toHaveClass('custom-class');
  });

  it('has default empty className', () => {
    render(<SkeletonLoader type="xp-bar" />);
    
    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv.className).toContain('h-8');
  });
});