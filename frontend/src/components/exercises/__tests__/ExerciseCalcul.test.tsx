import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ExerciseCalcul } from '../ExerciseCalcul';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, ...domProps } = props;
      return <div {...domProps}>{children}</div>;
    },
  },
}));

describe('ExerciseCalcul', () => {
  const mockExercise = {
    configuration: {
      operation: '5 + 3',
      question: 'Calcule cette addition',
      resultat: 8
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
      render(<ExerciseCalcul {...defaultProps} />);
      
      expect(screen.getByText('Calcule cette addition')).toBeInTheDocument();
    });

    it('affiche l\'opération mathématique', () => {
      render(<ExerciseCalcul {...defaultProps} />);
      
      expect(screen.getByText('5 + 3 = ?')).toBeInTheDocument();
    });

    it('affiche le champ de saisie avec placeholder', () => {
      render(<ExerciseCalcul {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Ta réponse...');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('');
    });

    it('affiche le clavier numérique', () => {
      render(<ExerciseCalcul {...defaultProps} />);
      
      // Vérifier que tous les boutons du clavier sont présents
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('9')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('⌫')).toBeInTheDocument();
    });
  });

  describe('Saisie de réponse', () => {
    it('permet de saisir une réponse via le clavier', async () => {
      const user = userEvent.setup();
      render(<ExerciseCalcul {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Ta réponse...');
      await user.type(input, '8');
      
      expect(input).toHaveValue('8');
      expect(defaultProps.onAnswerChange).toHaveBeenCalledWith(8);
    });

    it('permet de saisir une réponse via le clavier numérique', async () => {
      const user = userEvent.setup();
      render(<ExerciseCalcul {...defaultProps} />);
      
      const button5 = screen.getByText('5');
      const button3 = screen.getByText('3');
      
      await user.click(button5);
      await user.click(button3);
      
      const input = screen.getByPlaceholderText('Ta réponse...');
      expect(input).toHaveValue('53');
      expect(defaultProps.onAnswerChange).toHaveBeenCalledWith(53);
    });

    it('nettoie la saisie pour ne garder que les chiffres et caractères mathématiques', async () => {
      const user = userEvent.setup();
      render(<ExerciseCalcul {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Ta réponse...');
      await user.type(input, 'abc8.5def');
      
      expect(input).toHaveValue('8.5');
      expect(defaultProps.onAnswerChange).toHaveBeenCalledWith(8.5);
    });

    it('gère les virgules comme séparateurs décimaux', async () => {
      const user = userEvent.setup();
      render(<ExerciseCalcul {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Ta réponse...');
      await user.type(input, '12,5');
      
      expect(input).toHaveValue('12,5');
      expect(defaultProps.onAnswerChange).toHaveBeenCalledWith(12.5);
    });
  });

  describe('Fonctions du clavier numérique', () => {
    it('efface la saisie avec le bouton C', async () => {
      const user = userEvent.setup();
      render(<ExerciseCalcul {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Ta réponse...');
      await user.type(input, '123');
      
      const clearButton = screen.getByText('C');
      await user.click(clearButton);
      
      expect(input).toHaveValue('');
      expect(defaultProps.onAnswerChange).toHaveBeenCalledWith(0);
    });

    it('supprime le dernier caractère avec le bouton ⌫', async () => {
      const user = userEvent.setup();
      render(<ExerciseCalcul {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Ta réponse...');
      await user.type(input, '123');
      
      const backspaceButton = screen.getByText('⌫');
      await user.click(backspaceButton);
      
      expect(input).toHaveValue('12');
      expect(defaultProps.onAnswerChange).toHaveBeenCalledWith(12);
    });

    it('gère la suppression quand la saisie est vide', async () => {
      const user = userEvent.setup();
      render(<ExerciseCalcul {...defaultProps} />);
      
      const backspaceButton = screen.getByText('⌫');
      await user.click(backspaceButton);
      
      const input = screen.getByPlaceholderText('Ta réponse...');
      expect(input).toHaveValue('');
      expect(defaultProps.onAnswerChange).toHaveBeenCalledWith(0);
    });
  });

  describe('Validation et feedback', () => {
    it('affiche la validation quand showValidation est true', () => {
      render(<ExerciseCalcul {...defaultProps} currentAnswer={8} showValidation={true} />);
      
      expect(screen.getByText('✅')).toBeInTheDocument();
    });

    it('affiche le feedback de succès pour une bonne réponse', () => {
      render(<ExerciseCalcul {...defaultProps} currentAnswer={8} showValidation={true} />);
      
      expect(screen.getByText('🎯')).toBeInTheDocument();
      expect(screen.getByText('Parfait ! Tu as trouvé la bonne réponse !')).toBeInTheDocument();
    });

    it('affiche le feedback d\'erreur pour une mauvaise réponse', () => {
      render(<ExerciseCalcul {...defaultProps} currentAnswer={5} showValidation={true} />);
      
      expect(screen.getByText('❌')).toBeInTheDocument();
      expect(screen.getByText('🤔')).toBeInTheDocument();
      expect(screen.getByText('Pas tout à fait...')).toBeInTheDocument();
      expect(screen.getByText(/La bonne réponse était :/)).toBeInTheDocument();
      const correctAnswer = screen.getAllByText('8').find(el => el.tagName === 'STRONG');
      expect(correctAnswer).toBeInTheDocument();
    });

    it('applique les bonnes couleurs de validation', () => {
      const { rerender } = render(<ExerciseCalcul {...defaultProps} currentAnswer={8} showValidation={true} />);
      
      let input = screen.getByPlaceholderText('Ta réponse...');
      expect(input).toHaveClass('border-green-500', 'bg-green-50');
      
      rerender(<ExerciseCalcul {...defaultProps} currentAnswer={5} showValidation={true} />);
      
      input = screen.getByPlaceholderText('Ta réponse...');
      expect(input).toHaveClass('border-red-500', 'bg-red-50');
    });
  });

  describe('État désactivé', () => {
    it('désactive tous les contrôles quand disabled est true', () => {
      render(<ExerciseCalcul {...defaultProps} disabled={true} />);
      
      const input = screen.getByPlaceholderText('Ta réponse...');
      expect(input).toBeDisabled();
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('empêche la saisie quand désactivé', async () => {
      const user = userEvent.setup();
      render(<ExerciseCalcul {...defaultProps} disabled={true} />);
      
      const input = screen.getByPlaceholderText('Ta réponse...');
      await user.type(input, '123');
      
      expect(input).toHaveValue('');
      expect(defaultProps.onAnswerChange).not.toHaveBeenCalled();
    });
  });

  describe('Gestion des événements clavier', () => {
    it('gère la touche Entrée', async () => {
      const user = userEvent.setup();
      render(<ExerciseCalcul {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Ta réponse...');
      await user.type(input, '8');
      await user.keyboard('{Enter}');
      
      // L'événement Enter est géré mais ne déclenche pas de validation automatique
      expect(input).toHaveValue('8');
    });
  });

  describe('Cas limites', () => {
    it('gère un exercice sans configuration', () => {
      const exerciseWithoutConfig = { configuration: null };
      render(<ExerciseCalcul {...defaultProps} exercise={exerciseWithoutConfig} />);
      
      expect(screen.getByText('Résous cette opération')).toBeInTheDocument();
      expect(screen.queryByText('= ?')).not.toBeInTheDocument();
    });

    it('gère une réponse vide', () => {
      render(<ExerciseCalcul {...defaultProps} currentAnswer={null} showValidation={true} />);
      
      const input = screen.getByPlaceholderText('Ta réponse...');
      expect(input).toHaveClass('border-red-500', 'bg-red-50');
    });

    it('gère les nombres négatifs', async () => {
      const user = userEvent.setup();
      render(<ExerciseCalcul {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Ta réponse...');
      await user.type(input, '-5');
      
      expect(input).toHaveValue('-5');
      expect(defaultProps.onAnswerChange).toHaveBeenCalledWith(-5);
    });
  });
});


