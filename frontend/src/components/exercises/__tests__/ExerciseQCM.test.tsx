import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ExerciseQCM } from '../ExerciseQCM';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, transition, ...domProps } = props;
      return <div {...domProps}>{children}</div>;
    },
  },
}));

describe('ExerciseQCM', () => {
  const mockExercise = {
    configuration: {
      question: 'Quelle est la capitale de la France ?',
      choix: ['Paris', 'Lyon', 'Marseille', 'Toulouse'],
      bonneReponse: 'Paris'
    }
  };

  const defaultProps = {
    exercise: mockExercise,
    onAnswerChange: jest.fn(),
    disabled: false,
    currentAnswer: null,
    showValidation: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendu initial', () => {
    it('affiche la question de l\'exercice', () => {
      render(<ExerciseQCM {...defaultProps} />);
      
      expect(screen.getByText('Quelle est la capitale de la France ?')).toBeInTheDocument();
    });

    it('affiche toutes les options de choix', () => {
      render(<ExerciseQCM {...defaultProps} />);
      
      expect(screen.getByText('Paris')).toBeInTheDocument();
      expect(screen.getByText('Lyon')).toBeInTheDocument();
      expect(screen.getByText('Marseille')).toBeInTheDocument();
      expect(screen.getByText('Toulouse')).toBeInTheDocument();
    });

    it('affiche les boutons de choix comme des boutons cliquables', () => {
      render(<ExerciseQCM {...defaultProps} />);
      
      const choiceButtons = screen.getAllByRole('button');
      expect(choiceButtons).toHaveLength(4);
      
      choiceButtons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });

    it('affiche les indicateurs de sélection (cercles) pour chaque choix', () => {
      render(<ExerciseQCM {...defaultProps} />);
      
      // Chaque choix a un cercle indicateur
      const circles = screen.getAllByRole('button').map(button => 
        button.querySelector('.w-6.h-6.rounded-full')
      );
      
      expect(circles).toHaveLength(4);
      circles.forEach(circle => {
        expect(circle).toBeInTheDocument();
      });
    });
  });

  describe('Sélection de choix', () => {
    it('permet de sélectionner un choix', async () => {
      const user = userEvent.setup();
      render(<ExerciseQCM {...defaultProps} />);
      
      const parisButton = screen.getByText('Paris').closest('button');
      await user.click(parisButton!);
      
      expect(defaultProps.onAnswerChange).toHaveBeenCalledWith('Paris');
    });

    it('permet de changer de choix', async () => {
      const user = userEvent.setup();
      render(<ExerciseQCM {...defaultProps} currentAnswer="Lyon" />);
      
      const parisButton = screen.getByText('Paris').closest('button');
      await user.click(parisButton!);
      
      expect(defaultProps.onAnswerChange).toHaveBeenCalledWith('Paris');
    });

    it('affiche visuellement le choix sélectionné', () => {
      render(<ExerciseQCM {...defaultProps} currentAnswer="Paris" />);
      
      const parisButton = screen.getByText('Paris').closest('button');
      expect(parisButton).toHaveClass('bg-blue-500', 'border-blue-500', 'text-white');
    });

    it('affiche le point de sélection dans le cercle indicateur', () => {
      render(<ExerciseQCM {...defaultProps} currentAnswer="Paris" />);
      
      const parisButton = screen.getByText('Paris').closest('button');
      const selectedDot = parisButton?.querySelector('.w-3.h-3.rounded-full');
      expect(selectedDot).toBeInTheDocument();
    });
  });

  describe('Validation et feedback', () => {
    it('affiche le feedback de succès pour une bonne réponse', () => {
      render(<ExerciseQCM {...defaultProps} currentAnswer="Paris" showValidation={true} />);
      
      expect(screen.getByText('🎉')).toBeInTheDocument();
      expect(screen.getByText('Excellente réponse !')).toBeInTheDocument();
    });

    it('affiche le feedback d\'erreur pour une mauvaise réponse', () => {
      render(<ExerciseQCM {...defaultProps} currentAnswer="Lyon" showValidation={true} />);
      
      expect(screen.getByText('🤔')).toBeInTheDocument();
      expect(screen.getByText('Pas tout à fait...')).toBeInTheDocument();
      expect(screen.getByText('La bonne réponse était : Paris')).toBeInTheDocument();
    });

    it('colore la bonne réponse en vert lors de la validation', () => {
      render(<ExerciseQCM {...defaultProps} currentAnswer="Lyon" showValidation={true} />);
      
      const parisButton = screen.getByText('Paris').closest('button');
      expect(parisButton).toHaveClass('bg-green-500', 'border-green-500', 'text-white');
    });

    it('colore la mauvaise réponse sélectionnée en rouge lors de la validation', () => {
      render(<ExerciseQCM {...defaultProps} currentAnswer="Lyon" showValidation={true} />);
      
      const lyonButton = screen.getByText('Lyon').closest('button');
      expect(lyonButton).toHaveClass('bg-red-500', 'border-red-500', 'text-white');
    });

    it('affiche l\'icône ✅ pour la bonne réponse', () => {
      render(<ExerciseQCM {...defaultProps} currentAnswer="Lyon" showValidation={true} />);
      
      const parisButton = screen.getByText('Paris').closest('button');
      expect(parisButton).toHaveTextContent('✅');
    });

    it('affiche l\'icône ❌ pour la mauvaise réponse sélectionnée', () => {
      render(<ExerciseQCM {...defaultProps} currentAnswer="Lyon" showValidation={true} />);
      
      const lyonButton = screen.getByText('Lyon').closest('button');
      expect(lyonButton).toHaveTextContent('❌');
    });
  });

  describe('État désactivé', () => {
    it('désactive tous les boutons quand disabled est true', () => {
      render(<ExerciseQCM {...defaultProps} disabled={true} />);
      
      const choiceButtons = screen.getAllByRole('button');
      choiceButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('empêche la sélection quand désactivé', async () => {
      const user = userEvent.setup();
      render(<ExerciseQCM {...defaultProps} disabled={true} />);
      
      const parisButton = screen.getByText('Paris').closest('button');
      await user.click(parisButton!);
      
      expect(defaultProps.onAnswerChange).not.toHaveBeenCalled();
    });
  });

  describe('Animations et transitions', () => {
    it('applique les classes de transition sur les boutons', () => {
      render(<ExerciseQCM {...defaultProps} />);
      
      const choiceButtons = screen.getAllByRole('button');
      choiceButtons.forEach(button => {
        expect(button).toHaveClass('transition-all', 'duration-200');
      });
    });

    it('applique l\'effet hover sur les choix non sélectionnés', () => {
      render(<ExerciseQCM {...defaultProps} />);
      
      const parisButton = screen.getByText('Paris').closest('button');
      expect(parisButton).toHaveClass('hover:border-blue-300', 'hover:bg-blue-50');
    });
  });

  describe('Cas limites', () => {
    it('gère un exercice sans configuration', () => {
      const exerciseWithoutConfig = { configuration: null };
      render(<ExerciseQCM {...defaultProps} exercise={exerciseWithoutConfig} />);
      
      expect(screen.queryByText('Quelle est la capitale de la France ?')).not.toBeInTheDocument();
    });

    it('gère un exercice sans choix', () => {
      const exerciseWithoutChoices = {
        configuration: {
          question: 'Question sans choix',
          choix: []
        }
      };
      render(<ExerciseQCM {...defaultProps} exercise={exerciseWithoutChoices} />);
      
      expect(screen.getByText('Question sans choix')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('gère un exercice avec un seul choix', () => {
      const exerciseWithOneChoice = {
        configuration: {
          question: 'Question avec un choix',
          choix: ['Seul choix'],
          bonneReponse: 'Seul choix'
        }
      };
      render(<ExerciseQCM {...defaultProps} exercise={exerciseWithOneChoice} />);
      
      expect(screen.getByText('Question avec un choix')).toBeInTheDocument();
      expect(screen.getByText('Seul choix')).toBeInTheDocument();
      expect(screen.getAllByRole('button')).toHaveLength(1);
    });

    it('gère la validation sans réponse sélectionnée', () => {
      render(<ExerciseQCM {...defaultProps} currentAnswer={null} showValidation={true} />);
      
      // La bonne réponse doit être en vert
      const parisButton = screen.getByText('Paris').closest('button');
      expect(parisButton).toHaveClass('bg-green-500', 'border-green-500', 'text-white');
      
      // Aucune mauvaise réponse ne doit être en rouge
      const lyonButton = screen.getByText('Lyon').closest('button');
      expect(lyonButton).toHaveClass('bg-white', 'border-gray-200');
    });
  });

  describe('Accessibilité', () => {
    it('utilise des boutons pour les choix (accessibilité clavier)', () => {
      render(<ExerciseQCM {...defaultProps} />);
      
      const choiceButtons = screen.getAllByRole('button');
      expect(choiceButtons).toHaveLength(4);
      
      choiceButtons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
        expect(button).toBeEnabled();
      });
    });

    it('permet la navigation au clavier', async () => {
      const user = userEvent.setup();
      render(<ExerciseQCM {...defaultProps} />);
      
      const firstButton = screen.getAllByRole('button')[0];
      await user.tab();
      
      expect(firstButton).toHaveFocus();
    });
  });
});


