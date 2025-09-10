/**
 * MysteryWordGame Component Tests
 * Tests the "Hangman"-style word guessing game.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MysteryWordGame from '../MysteryWordGame'; // Adjust path

// =============================================================================
// COMPONENT TESTS
// =============================================================================

describe('MysteryWordGame', () => {
  const defaultProps = {
    wordToGuess: 'REACT',
    maxWrongGuesses: 6,
    onGameEnd: jest.fn(),
  };

  const renderComponent = (props = defaultProps) => {
    return render(<MysteryWordGame {...props} />);
  };

  beforeEach(() => {
    defaultProps.onGameEnd.mockClear();
  });

  describe('Rendering', () => {
    it('should render the word with underscores for each letter', () => {
      renderComponent();
      // Expecting 5 underscores for "REACT"
      const letterPlaceholders = screen.getAllByText('_');
      expect(letterPlaceholders).toHaveLength(5);
    });

    it('should display the number of wrong guesses remaining', () => {
      renderComponent();
      expect(screen.getByText(/Guesses left: 6/i)).toBeInTheDocument();
    });

    it('should have an input field for guessing a letter and a submit button', () => {
      renderComponent();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Guess/i })).toBeInTheDocument();
    });

    it('should not display any guessed letters initially', () => {
        renderComponent();
        expect(screen.queryByText(/Guessed letters:/i)).not.toBeInTheDocument();
    });
  });

  describe('Gameplay', () => {
    it('should reveal a letter when a correct guess is made', async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByRole('textbox');
      const guessButton = screen.getByRole('button', { name: /Guess/i });

      await user.type(input, 'A');
      await user.click(guessButton);

      // The letter 'A' should be revealed
      expect(screen.getByText('A')).toBeInTheDocument();
      // The other letters should still be underscores
      expect(screen.getAllByText('_')).toHaveLength(4);
    });

    it('should decrease remaining guesses on a wrong guess', async () => {
        const user = userEvent.setup();
        renderComponent();

        const input = screen.getByRole('textbox');
        const guessButton = screen.getByRole('button', { name: /Guess/i });

        await user.type(input, 'Z');
        await user.click(guessButton);

        expect(screen.getByText(/Guesses left: 5/i)).toBeInTheDocument();
    });

    it('should show the guessed letter in the list of guessed letters', async () => {
        const user = userEvent.setup();
        renderComponent();

        const input = screen.getByRole('textbox');
        const guessButton = screen.getByRole('button', { name: /Guess/i });

        await user.type(input, 'E');
        await user.click(guessButton);

        expect(screen.getByText(/Guessed letters:/i)).toBeInTheDocument();
        expect(screen.getByText('E')).toBeInTheDocument();
    });

    it('should handle both correct and incorrect guesses', async () => {
        const user = userEvent.setup();
        renderComponent();

        const input = screen.getByRole('textbox');
        const guessButton = screen.getByRole('button', { name: /Guess/i });

        // Correct guess
        await user.type(input, 'R');
        await user.click(guessButton);
        expect(screen.getByText('R')).toBeInTheDocument();
        expect(screen.getByText(/Guesses left: 6/i)).toBeInTheDocument();

        // Incorrect guess
        await user.type(input, 'X');
        await user.click(guessButton);
        expect(screen.getByText(/Guesses left: 5/i)).toBeInTheDocument();
    });

    it('should ignore guesses of letters already guessed', async () => {
        const user = userEvent.setup();
        renderComponent();

        const input = screen.getByRole('textbox');
        const guessButton = screen.getByRole('button', { name: /Guess/i });

        await user.type(input, 'Q');
        await user.click(guessButton);
        expect(screen.getByText(/Guesses left: 5/i)).toBeInTheDocument();

        // Guess 'Q' again
        await user.type(input, 'Q');
        await user.click(guessButton);
        // Guesses left should not decrease further
        expect(screen.getByText(/Guesses left: 5/i)).toBeInTheDocument();
    });
  });

  describe('Game End', () => {
    it('should call onGameEnd with true when the word is guessed correctly', async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByRole('textbox');
      const guessButton = screen.getByRole('button', { name: /Guess/i });

      // Guess the word "REACT"
      for (const letter of ['R', 'E', 'A', 'C', 'T']) {
        await user.type(input, letter);
        await user.click(guessButton);
      }

      expect(screen.getByText('You won!')).toBeInTheDocument();
      expect(defaultProps.onGameEnd).toHaveBeenCalledTimes(1);
      expect(defaultProps.onGameEnd).toHaveBeenCalledWith(true);
    });

    it('should call onGameEnd with false when the player runs out of guesses', async () => {
        const user = userEvent.setup();
        renderComponent();

        const input = screen.getByRole('textbox');
        const guessButton = screen.getByRole('button', { name: /Guess/i });

        // Make 6 wrong guesses
        for (const letter of ['Z', 'X', 'Y', 'W', 'V', 'U']) {
            await user.type(input, letter);
            await user.click(guessButton);
        }

        expect(screen.getByText(/You lost!/i)).toBeInTheDocument();
        expect(screen.getByText(/The word was: REACT/i)).toBeInTheDocument();
        expect(defaultProps.onGameEnd).toHaveBeenCalledTimes(1);
        expect(defaultProps.onGameEnd).toHaveBeenCalledWith(false);
      });

      it('should disable the input and button when the game ends', async () => {
        const user = userEvent.setup();
        renderComponent();

        const input = screen.getByRole('textbox');
        const guessButton = screen.getByRole('button', { name: /Guess/i });

        // Win the game
        for (const letter of ['R', 'E', 'A', 'C', 'T']) {
            await user.type(input, letter);
            await user.click(guessButton);
        }

        expect(input).toBeDisabled();
        expect(guessButton).toBeDisabled();
      });
  });
});
