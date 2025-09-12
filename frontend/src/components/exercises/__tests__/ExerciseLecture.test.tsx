import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ExerciseLecture } from '../ExerciseLecture';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, ...domProps } = props;
      return <div {...domProps}>{children}</div>;
    },
  },
}));

describe('ExerciseLecture', () => {
  const mockExercise = {
    configuration: {
      texte: 'Le chat noir dort paisiblement sur le canapé. Il fait beau aujourd\'hui et le soleil brille.',
      question: 'Où dort le chat ?',
      typeQuestion: 'Compréhension de lecture',
      solution: 'sur le canapé'
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
    it('affiche le texte à lire', () => {
      render(<ExerciseLecture {...defaultProps} />);
      
      expect(screen.getByText('📖 Texte à lire :')).toBeInTheDocument();
      expect(screen.getByText('Le chat noir dort paisiblement sur le canapé. Il fait beau aujourd\'hui et le soleil brille.')).toBeInTheDocument();
    });

    it('affiche la question', () => {
      render(<ExerciseLecture {...defaultProps} />);
      
      expect(screen.getByText('Où dort le chat ?')).toBeInTheDocument();
    });

    it('affiche le type de question', () => {
      render(<ExerciseLecture {...defaultProps} />);
      
      expect(screen.getByText('Type de question :')).toBeInTheDocument();
      expect(screen.getByText('Compréhension de lecture')).toBeInTheDocument();
    });

    it('affiche la zone de texte pour la réponse', () => {
      render(<ExerciseLecture {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveValue('');
    });

    it('affiche les conseils de lecture', () => {
      render(<ExerciseLecture {...defaultProps} />);
      
      expect(screen.getByText('💡')).toBeInTheDocument();
      expect(screen.getByText('Conseils :')).toBeInTheDocument();
      expect(screen.getByText('• Relis le texte plusieurs fois si nécessaire')).toBeInTheDocument();
      expect(screen.getByText('• Surligne les informations importantes')).toBeInTheDocument();
      expect(screen.getByText('• Vérifie ta réponse dans le texte')).toBeInTheDocument();
    });
  });

  describe('Saisie de réponse', () => {
    it('permet de saisir une réponse', async () => {
      const user = userEvent.setup();
      render(<ExerciseLecture {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
      await user.type(textarea, 'sur le canapé');
      
      expect(textarea).toHaveValue('sur le canapé');
      expect(defaultProps.onAnswerChange).toHaveBeenCalledWith('sur le canapé');
    });

    it('appelle onAnswerChange avec la valeur nettoyée (trim)', async () => {
      const user = userEvent.setup();
      render(<ExerciseLecture {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
      await user.type(textarea, '  sur le canapé  ');
      
      expect(defaultProps.onAnswerChange).toHaveBeenCalledWith('sur le canapé');
    });

    it('affiche le compteur de caractères', async () => {
      const user = userEvent.setup();
      render(<ExerciseLecture {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
      await user.type(textarea, 'test');
      
      expect(screen.getByText('4 caractères')).toBeInTheDocument();
    });

    it('met à jour le compteur de caractères en temps réel', async () => {
      const user = userEvent.setup();
      render(<ExerciseLecture {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
      
      await user.type(textarea, 't');
      expect(screen.getByText('1 caractères')).toBeInTheDocument();
      
      await user.type(textarea, 'e');
      expect(screen.getByText('2 caractères')).toBeInTheDocument();
    });
  });

  describe('Validation et feedback', () => {
    it('affiche le feedback de succès pour une bonne réponse', () => {
      render(<ExerciseLecture {...defaultProps} currentAnswer="sur le canapé" showValidation={true} />);
      
      expect(screen.getByText('📚')).toBeInTheDocument();
      expect(screen.getByText('Excellente compréhension !')).toBeInTheDocument();
    });

    it('affiche le feedback d\'erreur pour une mauvaise réponse', () => {
      render(<ExerciseLecture {...defaultProps} currentAnswer="dans le jardin" showValidation={true} />);
      
      expect(screen.getByText('🤔')).toBeInTheDocument();
      expect(screen.getByText('Relis le texte attentivement')).toBeInTheDocument();
      expect(screen.getByText(/Réponse attendue|bonne réponse/i)).toBeInTheDocument();
    });

    it('affiche l\'icône ✅ pour une bonne réponse', () => {
      render(<ExerciseLecture {...defaultProps} currentAnswer="sur le canapé" showValidation={true} />);
      
      expect(screen.getByText('✅')).toBeInTheDocument();
    });

    it('affiche l\'icône ❌ pour une mauvaise réponse', () => {
      render(<ExerciseLecture {...defaultProps} currentAnswer="dans le jardin" showValidation={true} />);
      
      expect(screen.getByText('❌')).toBeInTheDocument();
    });

    it('applique les bonnes couleurs de validation', () => {
      const { rerender } = render(<ExerciseLecture {...defaultProps} currentAnswer="sur le canapé" showValidation={true} />);
      
      let textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
      expect(textarea).toHaveClass('border-green-500', 'bg-green-50');
      
      rerender(<ExerciseLecture {...defaultProps} currentAnswer="dans le jardin" showValidation={true} />);
      
      textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
      expect(textarea).toHaveClass('border-red-500', 'bg-red-50');
    });

    it('compare les réponses en ignorant la casse et les espaces', () => {
      render(<ExerciseLecture {...defaultProps} currentAnswer="SUR LE CANAPÉ" showValidation={true} />);
      
      expect(screen.getByText('✅')).toBeInTheDocument();
      expect(screen.getByText('Excellente compréhension !')).toBeInTheDocument();
    });
  });

  describe('État désactivé', () => {
    it('désactive la zone de texte quand disabled est true', () => {
      render(<ExerciseLecture {...defaultProps} disabled={true} />);
      
      const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
      expect(textarea).toBeDisabled();
    });

    it('empêche la saisie quand désactivé', async () => {
      const user = userEvent.setup();
      render(<ExerciseLecture {...defaultProps} disabled={true} />);
      
      const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
      await user.type(textarea, 'test');
      
      expect(textarea).toHaveValue('');
      expect(defaultProps.onAnswerChange).not.toHaveBeenCalled();
    });
  });

  describe('Gestion des événements clavier', () => {
    it('gère la touche Entrée', async () => {
      const user = userEvent.setup();
      render(<ExerciseLecture {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
      await user.type(textarea, 'test');
      await user.keyboard('{Enter}');
      
      // L'événement Enter est géré mais ne déclenche pas de validation automatique
      expect(textarea).toHaveValue('test');
    });
  });

  describe('Cas limites', () => {
    it('gère un exercice sans configuration', () => {
      const exerciseWithoutConfig = { configuration: null };
      render(<ExerciseLecture {...defaultProps} exercise={exerciseWithoutConfig} />);
      
      // If exercise configuration is missing, component should still render
      // Just check that it doesn't crash and renders the basic structure
      expect(screen.getByText('📖 Texte à lire :')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Écris ta réponse ici...')).toBeInTheDocument();
    });

    it('gère un exercice sans texte', () => {
      const exerciseWithoutText = {
        configuration: {
          question: 'Question sans texte',
          solution: 'réponse'
        }
      };
      render(<ExerciseLecture {...defaultProps} exercise={exerciseWithoutText} />);
      
      expect(screen.getByText('Question sans texte')).toBeInTheDocument();
      expect(screen.queryByText('📖 Texte à lire :')).toBeInTheDocument();
    });

    it('gère un exercice sans type de question', () => {
      const exerciseWithoutType = {
        configuration: {
          texte: 'Texte de test',
          question: 'Question sans type',
          solution: 'réponse'
        }
      };
      render(<ExerciseLecture {...defaultProps} exercise={exerciseWithoutType} />);
      
      expect(screen.getByText('Question sans type')).toBeInTheDocument();
      expect(screen.queryByText('Type de question :')).not.toBeInTheDocument();
    });

    it('gère une réponse vide lors de la validation', () => {
      render(<ExerciseLecture {...defaultProps} currentAnswer="" showValidation={true} />);
      
      expect(screen.getByText('❌')).toBeInTheDocument();
      expect(screen.getByText('Relis le texte attentivement')).toBeInTheDocument();
    });

    it('gère une réponse null lors de la validation', () => {
      render(<ExerciseLecture {...defaultProps} currentAnswer={null} showValidation={true} />);
      
      expect(screen.getByText('❌')).toBeInTheDocument();
      expect(screen.getByText('Relis le texte attentivement')).toBeInTheDocument();
    });
  });

  describe('Accessibilité', () => {
    it('utilise une textarea pour la saisie', () => {
      render(<ExerciseLecture {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('affiche un placeholder descriptif', () => {
      render(<ExerciseLecture {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
      expect(textarea).toHaveAttribute('placeholder', 'Écris ta réponse ici...');
    });

    it('désactive le redimensionnement de la textarea', () => {
      render(<ExerciseLecture {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
      expect(textarea).toHaveClass('resize-none');
    });
  });

  describe('Styles et apparence', () => {
    it('applique les bonnes classes CSS au texte à lire', () => {
      render(<ExerciseLecture {...defaultProps} />);
      
      const textContainer = screen.getByText('📖 Texte à lire :').closest('div');
      expect(textContainer).toHaveClass('bg-blue-50', 'border-2', 'border-blue-200', 'rounded-xl');
    });

    it('applique les bonnes classes CSS aux conseils', () => {
      render(<ExerciseLecture {...defaultProps} />);
      
      const tipsContainer = screen.getByText('💡').closest('div[class*="bg-yellow"]');
      expect(tipsContainer).toBeTruthy();
    });

    it('applique les classes de transition sur la textarea', () => {
      render(<ExerciseLecture {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
      expect(textarea).toHaveClass('transition-all', 'duration-200');
    });
  });
});


