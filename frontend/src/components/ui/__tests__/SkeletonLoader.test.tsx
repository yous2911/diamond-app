import React from 'react';
import { render, screen } from '@testing-library/react';
import SkeletonLoader from '../SkeletonLoader';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => {
      const { animate, transition, ...domProps } = props;
      return (
        <div className={className} {...domProps}>
          {children}
        </div>
      );
    }
  }
}));

describe('SkeletonLoader', () => {
  it('renders mascot skeleton correctly', () => {
    render(<SkeletonLoader type="mascot" />);
    
    const skeletonDiv = screen.getByTestId('skeleton-mascot');
    expect(skeletonDiv).toBeInTheDocument();
    expect(skeletonDiv).toHaveClass('w-64', 'h-64', 'rounded-full');
  });

  it('renders xp-bar skeleton correctly', () => {
    render(<SkeletonLoader type="xp-bar" />);
    
    const skeletonDiv = screen.getByTestId('skeleton-xp-bar');
    expect(skeletonDiv).toBeInTheDocument();
    expect(skeletonDiv).toHaveClass('h-8', 'rounded-full');
  });

  it('renders wardrobe skeleton correctly', () => {
    const { container } = render(<SkeletonLoader type="wardrobe" />);
    
    const wardrobeContainer = container.querySelector('.grid.grid-cols-3.gap-4');
    expect(wardrobeContainer).toBeInTheDocument();
  });

  it('renders exercise skeleton correctly', () => {
    const { container } = render(<SkeletonLoader type="exercise" />);
    
    const exerciseContainer = container.querySelector('.p-6');
    expect(exerciseContainer).toBeInTheDocument();
  });

  it('renders card skeleton correctly', () => {
    const { container } = render(<SkeletonLoader type="card" />);
    
    const cardContainer = container.querySelector('.rounded-xl');
    expect(cardContainer).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<SkeletonLoader type="mascot" className="custom-class" />);
    
    const skeletonDiv = screen.getByTestId('skeleton-mascot');
    expect(skeletonDiv).toHaveClass('custom-class');
  });

  it('has default empty className', () => {
    render(<SkeletonLoader type="xp-bar" />);
    
    const skeletonDiv = screen.getByTestId('skeleton-xp-bar');
    expect(skeletonDiv.className).toContain('h-8');
  });
});