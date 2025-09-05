import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdvancedMascotSystem from '../AdvancedMascotSystem';

// Mock Framer Motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { whileHover, whileTap, initial, animate, transition, ...domProps } = props;
      return <div {...domProps}>{children}</div>;
    },
    button: ({ children, ...props }: any) => {
      const { whileHover, whileTap, initial, animate, transition, ...domProps } = props;
      return <button {...domProps}>{children}</button>;
    },
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

describe('AdvancedMascotSystem', () => {
  const defaultProps = {
    mascotType: 'dragon' as const,
    studentData: {
      level: 3,
      xp: 150,
      currentStreak: 5,
      timeOfDay: 'morning' as const,
      recentPerformance: 'excellent' as const,
    },
    currentActivity: 'idle' as const,
    equippedItems: [],
    onMascotInteraction: jest.fn(),
    onEmotionalStateChange: jest.fn(),
  };

  it('se rend sans erreur', () => {
    expect(() => {
      render(<AdvancedMascotSystem {...defaultProps} />);
    }).not.toThrow();
  });

  it('affiche le système de mascotte 3D', () => {
    render(<AdvancedMascotSystem {...defaultProps} />);
    // The component should render without errors and create a container
    const container = document.querySelector('.relative');
    expect(container).toBeTruthy();
  });

  it('réagit aux différents types de mascotte', () => {
    const { rerender } = render(<AdvancedMascotSystem {...defaultProps} />);
    
    rerender(<AdvancedMascotSystem {...defaultProps} mascotType="fairy" />);
    expect(() => {
      render(<AdvancedMascotSystem {...defaultProps} mascotType="fairy" />);
    }).not.toThrow();
    
    rerender(<AdvancedMascotSystem {...defaultProps} mascotType="robot" />);
    expect(() => {
      render(<AdvancedMascotSystem {...defaultProps} mascotType="robot" />);
    }).not.toThrow();
  });

  it('accepte différents niveaux d\'élève', () => {
    const { rerender } = render(<AdvancedMascotSystem {...defaultProps} />);
    
    rerender(<AdvancedMascotSystem {...defaultProps} studentData={{
      ...defaultProps.studentData,
      level: 1,
    }} />);
    expect(() => {
      render(<AdvancedMascotSystem {...defaultProps} studentData={{
        ...defaultProps.studentData,
        level: 1,
      }} />);
    }).not.toThrow();
  });

  it('gère les éléments équipés', () => {
    const equippedItems = [
      'Chapeau magique',
      'Cape brillante',
    ];

    expect(() => {
      render(<AdvancedMascotSystem {...defaultProps} equippedItems={equippedItems} />);
    }).not.toThrow();
  });
});