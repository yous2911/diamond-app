import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DragDropExercise from '../DragDropExercise';

import { fireEvent } from '@testing-library/react';

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

describe('DragDropExercise', () => {
  const defaultProps = {
    question: 'Classe les nombres par ordre croissant',
    items: [
      { id: '1', content: '5', category: 'GOOD' },
      { id: '2', content: '3', category: 'GOOD' },
      { id: '3', content: '8', category: 'GOOD' },
      { id: '4', content: '1', category: 'GOOD' },
    ],
    zones: [
      { id: 'zone1', label: 'Premier', accepts: ['GOOD'], items: [] },
      { id: 'zone2', label: 'Deuxième', accepts: ['GOOD'], items: [] },
      { id: 'zone3', label: 'Troisième', accepts: ['GOOD'], items: [] },
      { id: 'zone4', label: 'Quatrième', accepts: ['GOOD'], items: [] },
    ],
    onComplete: jest.fn(),
  };

  it('se rend sans erreur', () => {
    expect(() => {
      render(<DragDropExercise {...defaultProps} />);
    }).not.toThrow();
  });

  it('affiche la question', () => {
    render(<DragDropExercise {...defaultProps} />);
    expect(screen.getByText(/Classe les nombres/i)).toBeInTheDocument();
  });

  it('affiche les éléments à glisser', () => {
    render(<DragDropExercise {...defaultProps} />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('affiche les zones de dépôt', () => {
    render(<DragDropExercise {...defaultProps} />);
    
    expect(screen.getByText('Premier')).toBeInTheDocument();
    expect(screen.getByText('Deuxième')).toBeInTheDocument();
    expect(screen.getByText('Troisième')).toBeInTheDocument();
    expect(screen.getByText('Quatrième')).toBeInTheDocument();
  });

  it('accepte différentes questions', () => {
    const { rerender } = render(<DragDropExercise {...defaultProps} />);
    
    rerender(<DragDropExercise {...defaultProps} question="Nouvelle question" />);
    expect(screen.getByText(/Nouvelle question/i)).toBeInTheDocument();
  });

  it('accepte différents éléments', () => {
    const newItems = [
      { id: '1', content: 'A', category: 'GOOD' },
      { id: '2', content: 'B', category: 'GOOD' },
    ];
    const newZones = [
      { id: 'zone1', label: 'First', accepts: ['GOOD'], items: [] },
      { id: 'zone2', label: 'Second', accepts: ['GOOD'], items: [] },
    ];
    
    render(<DragDropExercise {...defaultProps} items={newItems} zones={newZones} />);
    
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });
});

describe('DragDropExercise Interactions', () => {
  const onCompleteMock = jest.fn();

  const setup = (props = {}) => {
    const defaultProps = {
      question: 'Categorize fruits and vegetables',
      items: [
        { id: 'item-1', content: 'Apple', category: 'fruit' },
        { id: 'item-2', content: 'Carrot', category: 'vegetable' },
      ],
      zones: [
        { id: 'zone-fruit', label: 'Fruits', accepts: ['fruit'], items: [] },
        { id: 'zone-veg', label: 'Vegetables', accepts: ['vegetable'], items: [] },
      ],
      onComplete: onCompleteMock,
    };
    return render(<DragDropExercise {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    onCompleteMock.mockClear();
  });

  it('allows a correct item to be dropped into a zone', () => {
    setup();
    const itemToDrag = screen.getByText('Apple');
    const dropZoneContainer = screen.getByText('Fruits').parentElement;

    expect(screen.getByText('Glisse les éléments :').parentElement).toHaveTextContent('Apple');
    expect(dropZoneContainer).not.toHaveTextContent('Apple');

    fireEvent.dragStart(itemToDrag);
    fireEvent.drop(dropZoneContainer);

    expect(screen.getByText('Glisse les éléments :').parentElement).not.toHaveTextContent('Apple');
    expect(dropZoneContainer).toHaveTextContent('Apple');
  });

  it('prevents an incorrect item from being dropped into a zone', () => {
    setup();
    const itemToDrag = screen.getByText('Apple'); // fruit
    const dropZoneContainer = screen.getByText('Vegetables').parentElement; // accepts vegetable

    fireEvent.dragStart(itemToDrag);
    fireEvent.drop(dropZoneContainer);

    // State should not have changed
    expect(screen.getByText('Glisse les éléments :').parentElement).toHaveTextContent('Apple');
    expect(dropZoneContainer).not.toHaveTextContent('Apple');
  });

  it('calls onComplete with true when all items are placed correctly', () => {
    setup();
    const apple = screen.getByText('Apple');
    const carrot = screen.getByText('Carrot');
    const fruitZone = screen.getByText('Fruits').parentElement;
    const vegZone = screen.getByText('Vegetables').parentElement;

    // Drop apple in fruit zone
    fireEvent.dragStart(apple);
    fireEvent.drop(fruitZone);

    // Drop carrot in vegetable zone
    fireEvent.dragStart(carrot);
    fireEvent.drop(vegZone);

    expect(onCompleteMock).toHaveBeenCalledWith(true);
  });


  it('resets the exercise when the reset button is clicked', () => {
    setup();
    const itemToDrag = screen.getByText('Apple');
    const dropZoneContainer = screen.getByText('Fruits').parentElement;
    const resetButton = screen.getByText('🔄 Recommencer');

    // Drop an item
    fireEvent.dragStart(itemToDrag);
    fireEvent.drop(dropZoneContainer);
    expect(screen.getByText('Glisse les éléments :').parentElement).not.toHaveTextContent('Apple');

    // Click reset
    fireEvent.click(resetButton);

    // Item should be back in the available list
    expect(screen.getByText('Glisse les éléments :').parentElement).toHaveTextContent('Apple');
    // Drop zone should be empty
    expect(dropZoneContainer).not.toHaveTextContent('Apple');
  });

  it('shows visual feedback on drag over', () => {
    setup();
    const dropZoneContainer = screen.getByText('Fruits').parentElement;

    expect(dropZoneContainer).toHaveClass('border-gray-300');

    fireEvent.dragOver(dropZoneContainer);

    expect(dropZoneContainer).toHaveClass('border-purple-500');

    fireEvent.dragLeave(dropZoneContainer);

    expect(dropZoneContainer).toHaveClass('border-gray-300');
  });
});