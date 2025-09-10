/**
 * ParentLoginScreen Component Tests for FastRevEd Kids
 * Tests parent authentication, registration, form validation, and error handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ParentLoginScreen from '../ParentLoginScreen';

// =============================================================================
// TEST SETUP & MOCKS
// =============================================================================

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { whileHover, whileTap, initial, animate, transition, ...domProps } = props;
      return <div {...domProps} data-testid="motion-div-main">{children}</div>;
    },
    button: ({ children, ...props }: any) => {
      const { whileHover, whileTap, initial, animate, transition, ...domProps } = props;
      return <button {...domProps}>{children}</button>;
    },
    form: ({ children, ...props }: any) => {
      const { whileHover, whileTap, initial, animate, transition, ...domProps } = props;
      return <form {...domProps}>{children}</form>;
    },
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
  Mail: () => <div data-testid="mail-icon" />,
  Lock: () => <div data-testid="lock-icon" />,
  User: () => <div data-testid="user-icon" />,
  Phone: () => <div data-testid="phone-icon" />,
  UserPlus: () => <div data-testid="user-plus-icon" />,
  LogIn: () => <div data-testid="login-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  Loader: () => <div data-testid="loader-icon" />,
}));

// Mock window dimensions
Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
Object.defineProperty(window, 'innerHeight', { writable: true, value: 768 });

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>{children}</div>
);

// Mock functions
const mockOnLogin = jest.fn();
const mockOnRegister = jest.fn();

const defaultProps = {
  onLogin: mockOnLogin,
  onRegister: mockOnRegister,
};

beforeEach(() => {
  jest.clearAllMocks();
});

// =============================================================================
// PARENT LOGIN SCREEN COMPONENT TESTS
// =============================================================================

describe('ParentLoginScreen', () => {
  describe('Rendering', () => {
    it('should render login screen with all elements', () => {
      render(<ParentLoginScreen {...defaultProps} />, { wrapper: TestWrapper });

      // Check header elements
      expect(screen.getByText('Espace Parents')).toBeInTheDocument();
      expect(screen.getByText('Suivez les progrès de vos enfants')).toBeInTheDocument();

      // Check form elements
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();

      // Check mode toggle
      expect(screen.getByText('Pas encore de compte ?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /inscription/i })).toBeInTheDocument();
    });

    it('should render registration form when in register mode', async () => {
      const user = userEvent.setup();
      render(<ParentLoginScreen {...defaultProps} />, { wrapper: TestWrapper });

      // Switch to register mode
      const registerButton = screen.getByRole('button', { name: /inscription/i });
      await user.click(registerButton);

      // Check registration form elements
      expect(screen.getByLabelText('Prénom')).toBeInTheDocument();
      expect(screen.getByLabelText('Nom de famille')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirmer le mot de passe')).toBeInTheDocument();
      expect(screen.getByLabelText('Téléphone (optionnel)')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /créer le compte/i })).toBeInTheDocument();

      // Check mode toggle back
      expect(screen.getByText('Déjà un compte ?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
    });

    it('should have proper form validation attributes', () => {
      render(<ParentLoginScreen {...defaultProps} />, { wrapper: TestWrapper });

      const emailInput = screen.getByPlaceholderText('votre.email@exemple.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('required');
    });
  });

  describe('Form Interaction - Login Mode', () => {
    it('should update form inputs when user types', async () => {
      const user = userEvent.setup();
      render(<ParentLoginScreen {...defaultProps} />, { wrapper: TestWrapper });

      const emailInput = screen.getByPlaceholderText('votre.email@exemple.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');

      await user.type(emailInput, 'parent@example.com');
      await user.type(passwordInput, 'password123');

      expect(emailInput).toHaveValue('parent@example.com');
      expect(passwordInput).toHaveValue('password123');
    });

    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      render(<ParentLoginScreen {...defaultProps} />, { wrapper: TestWrapper });

      const passwordInput = screen.getByPlaceholderText('••••••••');
      const toggleButton = screen.getByRole('button', { name: /afficher le mot de passe/i });

      expect(passwordInput).toHaveAttribute('type', 'password');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');
      expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    });

    it('should disable submit button when form is incomplete', () => {
      render(<ParentLoginScreen {...defaultProps} />, { wrapper: TestWrapper });

      const submitButton = screen.getByRole('button', { name: /se connecter/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when form is complete', async () => {
      const user = userEvent.setup();
      render(<ParentLoginScreen {...defaultProps} />, { wrapper: TestWrapper });

      const emailInput = screen.getByPlaceholderText('votre.email@exemple.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /se connecter/i });

      await user.type(emailInput, 'parent@example.com');
      await user.type(passwordInput, 'password123');

      expect(submitButton).toBeEnabled();
    });

    it('should submit form with correct data', async () => {
      const user = userEvent.setup();
      mockOnLogin.mockResolvedValue(undefined);

      render(<ParentLoginScreen {...defaultProps} />, { wrapper: TestWrapper });

      const emailInput = screen.getByPlaceholderText('votre.email@exemple.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /se connecter/i });

      await user.type(emailInput, 'parent@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(mockOnLogin).toHaveBeenCalledWith({
        email: 'parent@example.com',
        password: 'password123'
      });
    });
  });

  describe('Form Interaction - Registration Mode', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<ParentLoginScreen {...defaultProps} />, { wrapper: TestWrapper });
      
      // Switch to register mode
      const registerButton = screen.getByRole('button', { name: /inscription/i });
      await user.click(registerButton);
    });

    it('should update all registration form inputs', async () => {
      const user = userEvent.setup();

      const prenomInput = screen.getByLabelText('Prénom');
      const nomInput = screen.getByLabelText('Nom de famille');
      const emailInput = screen.getByPlaceholderText('votre.email@exemple.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const confirmPasswordInput = screen.getByLabelText('Confirmer le mot de passe');
      const phoneInput = screen.getByLabelText('Téléphone (optionnel)');

      await user.type(prenomInput, 'Marie');
      await user.type(nomInput, 'Dupont');
      await user.type(emailInput, 'marie.dupont@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.type(phoneInput, '0123456789');

      expect(prenomInput).toHaveValue('Marie');
      expect(nomInput).toHaveValue('Dupont');
      expect(emailInput).toHaveValue('marie.dupont@example.com');
      expect(passwordInput).toHaveValue('password123');
      expect(confirmPasswordInput).toHaveValue('password123');
      expect(phoneInput).toHaveValue('0123456789');
    });

    it('should validate password confirmation', async () => {
      const user = userEvent.setup();

      const passwordInput = screen.getByPlaceholderText('••••••••');
      const confirmPasswordInput = screen.getByLabelText('Confirmer le mot de passe');
      const submitButton = screen.getByRole('button', { name: /créer le compte/i });

      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'different123');

      // Should show validation error
      expect(screen.getByText('Les mots de passe ne correspondent pas')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should submit registration form with correct data', async () => {
      const user = userEvent.setup();
      mockOnRegister.mockResolvedValue(undefined);

      const prenomInput = screen.getByLabelText('Prénom');
      const nomInput = screen.getByLabelText('Nom de famille');
      const emailInput = screen.getByPlaceholderText('votre.email@exemple.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const confirmPasswordInput = screen.getByLabelText('Confirmer le mot de passe');
      const submitButton = screen.getByRole('button', { name: /créer le compte/i });

      await user.type(prenomInput, 'Marie');
      await user.type(nomInput, 'Dupont');
      await user.type(emailInput, 'marie.dupont@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      expect(mockOnRegister).toHaveBeenCalledWith({
        nom: 'Dupont',
        prenom: 'Marie',
        email: 'marie.dupont@example.com',
        password: 'password123',
        telephone: ''
      });
    });

    it('should include phone number when provided', async () => {
      const user = userEvent.setup();
      mockOnRegister.mockResolvedValue(undefined);

      const prenomInput = screen.getByLabelText('Prénom');
      const nomInput = screen.getByLabelText('Nom de famille');
      const emailInput = screen.getByPlaceholderText('votre.email@exemple.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const confirmPasswordInput = screen.getByLabelText('Confirmer le mot de passe');
      const phoneInput = screen.getByLabelText('Téléphone (optionnel)');
      const submitButton = screen.getByRole('button', { name: /créer le compte/i });

      await user.type(prenomInput, 'Marie');
      await user.type(nomInput, 'Dupont');
      await user.type(emailInput, 'marie.dupont@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.type(phoneInput, '0123456789');
      await user.click(submitButton);

      expect(mockOnRegister).toHaveBeenCalledWith({
        nom: 'Dupont',
        prenom: 'Marie',
        email: 'marie.dupont@example.com',
        password: 'password123',
        telephone: '0123456789'
      });
    });
  });

  describe('Mode Switching', () => {
    it('should switch between login and registration modes', async () => {
      const user = userEvent.setup();
      render(<ParentLoginScreen {...defaultProps} />, { wrapper: TestWrapper });

      // Initially in login mode
      expect(screen.getByText('Se connecter')).toBeInTheDocument();
      expect(screen.queryByLabelText('Prénom')).not.toBeInTheDocument();

      // Switch to registration
      const registerButton = screen.getByRole('button', { name: /inscription/i });
      await user.click(registerButton);

      expect(screen.getByText('Créer un compte')).toBeInTheDocument();
      expect(screen.getByLabelText('Prénom')).toBeInTheDocument();

      // Switch back to login
      const loginButton = screen.getByRole('button', { name: /se connecter/i });
      await user.click(loginButton);

      expect(screen.getByText('Se connecter')).toBeInTheDocument();
      expect(screen.queryByLabelText('Prénom')).not.toBeInTheDocument();
    });

    it('should clear form data when switching modes', async () => {
      const user = userEvent.setup();
      render(<ParentLoginScreen {...defaultProps} />, { wrapper: TestWrapper });

      // Fill login form
      const emailInput = screen.getByPlaceholderText('votre.email@exemple.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      // Switch to registration
      const registerButton = screen.getByRole('button', { name: /inscription/i });
      await user.click(registerButton);

      // Switch back to login
      const loginButton = screen.getByRole('button', { name: /se connecter/i });
      await user.click(loginButton);

      // Form should be cleared
      expect(screen.getByLabelText('Email')).toHaveValue('');
      expect(screen.getByLabelText('Mot de passe')).toHaveValue('');
    });
  });

  describe('Error Handling', () => {
    it('should display login error message', async () => {
      const user = userEvent.setup();
      mockOnLogin.mockRejectedValue(new Error('Invalid credentials'));

      render(<ParentLoginScreen {...defaultProps} />, { wrapper: TestWrapper });

      const emailInput = screen.getByPlaceholderText('votre.email@exemple.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /se connecter/i });

      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });

    it('should display registration error message', async () => {
      const user = userEvent.setup();
      mockOnRegister.mockRejectedValue(new Error('Email already exists'));

      render(<ParentLoginScreen {...defaultProps} />, { wrapper: TestWrapper });

      // Switch to registration
      const registerButton = screen.getByRole('button', { name: /inscription/i });
      await user.click(registerButton);

      const prenomInput = screen.getByLabelText('Prénom');
      const nomInput = screen.getByLabelText('Nom de famille');
      const emailInput = screen.getByPlaceholderText('votre.email@exemple.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const confirmPasswordInput = screen.getByLabelText('Confirmer le mot de passe');
      const submitButton = screen.getByRole('button', { name: /créer le compte/i });

      await user.type(prenomInput, 'Marie');
      await user.type(nomInput, 'Dupont');
      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });
    });

    it('should clear error when user starts typing', async () => {
      const user = userEvent.setup();
      mockOnLogin.mockRejectedValueOnce(new Error('Invalid credentials'));

      render(<ParentLoginScreen {...defaultProps} />, { wrapper: TestWrapper });

      const emailInput = screen.getByPlaceholderText('votre.email@exemple.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /se connecter/i });

      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      // Start typing should clear error
      await user.type(emailInput, 'a');

      await waitFor(() => {
        expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during login', async () => {
      const user = userEvent.setup();
      
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve;
      });
      
      mockOnLogin.mockReturnValue(loginPromise as any);

      render(<ParentLoginScreen {...defaultProps} />, { wrapper: TestWrapper });

      const emailInput = screen.getByPlaceholderText('votre.email@exemple.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /se connecter/i });

      await user.type(emailInput, 'parent@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText('Connexion...')).toBeInTheDocument();
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // Resolve the login
      resolveLogin!(undefined);

      await waitFor(() => {
        expect(screen.queryByText('Connexion...')).not.toBeInTheDocument();
      });
    });

    it('should show loading state during registration', async () => {
      const user = userEvent.setup();
      
      let resolveRegister: (value: any) => void;
      const registerPromise = new Promise(resolve => {
        resolveRegister = resolve;
      });
      
      mockOnRegister.mockReturnValue(registerPromise as any);

      render(<ParentLoginScreen {...defaultProps} />, { wrapper: TestWrapper });

      // Switch to registration
      const registerButton = screen.getByRole('button', { name: /inscription/i });
      await user.click(registerButton);

      const prenomInput = screen.getByLabelText('Prénom');
      const nomInput = screen.getByLabelText('Nom de famille');
      const emailInput = screen.getByPlaceholderText('votre.email@exemple.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const confirmPasswordInput = screen.getByLabelText('Confirmer le mot de passe');
      const submitButton = screen.getByRole('button', { name: /créer le compte/i });

      await user.type(prenomInput, 'Marie');
      await user.type(nomInput, 'Dupont');
      await user.type(emailInput, 'marie@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText('Création du compte...')).toBeInTheDocument();
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // Resolve the registration
      resolveRegister!(undefined);

      await waitFor(() => {
        expect(screen.queryByText('Création du compte...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all form inputs', () => {
      render(<ParentLoginScreen {...defaultProps} />, { wrapper: TestWrapper });

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
    });

    it('should have proper labels in registration mode', async () => {
      const user = userEvent.setup();
      render(<ParentLoginScreen {...defaultProps} />, { wrapper: TestWrapper });

      // Switch to registration
      const registerButton = screen.getByRole('button', { name: /inscription/i });
      await user.click(registerButton);

      expect(screen.getByLabelText('Prénom')).toBeInTheDocument();
      expect(screen.getByLabelText('Nom de famille')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirmer le mot de passe')).toBeInTheDocument();
      expect(screen.getByLabelText('Téléphone (optionnel)')).toBeInTheDocument();
    });

    it('should have appropriate button roles and text', () => {
      render(<ParentLoginScreen {...defaultProps} />, { wrapper: TestWrapper });

      expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /inscription/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /afficher le mot de passe/i })).toBeInTheDocument();
    });

    it('should associate error messages with form', async () => {
      const user = userEvent.setup();
      mockOnLogin.mockRejectedValue(new Error('Invalid credentials'));

      render(<ParentLoginScreen {...defaultProps} />, { wrapper: TestWrapper });

      const emailInput = screen.getByPlaceholderText('votre.email@exemple.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /se connecter/i });

      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText('Invalid credentials');
        expect(errorMessage).toBeInTheDocument();
        // Error should be visually associated with the form
        expect(errorMessage.closest('form')).toBeInTheDocument();
      });
    });
  });

  describe('User Experience', () => {
    it('should prevent form submission when fields are empty', async () => {
      const user = userEvent.setup();
      render(<ParentLoginScreen {...defaultProps} />, { wrapper: TestWrapper });

      const submitButton = screen.getByRole('button', { name: /se connecter/i });
      
      // Try to click submit button when form is empty
      await user.click(submitButton);

      // Should not call login API
      expect(mockOnLogin).not.toHaveBeenCalled();
    });

    it('should provide visual feedback for password strength', async () => {
      const user = userEvent.setup();
      render(<ParentLoginScreen {...defaultProps} />, { wrapper: TestWrapper });

      // Switch to registration
      const registerButton = screen.getByRole('button', { name: /inscription/i });
      await user.click(registerButton);

      const passwordInput = screen.getByPlaceholderText('••••••••');

      // Type weak password
      await user.type(passwordInput, '123');
      
      // Should show password strength indicator
      expect(screen.getByText(/faible/i)).toBeInTheDocument();

      // Type strong password
      await user.clear(passwordInput);
      await user.type(passwordInput, 'StrongPassword123!');
      
      // Should show strong password indicator
      expect(screen.getByText(/fort/i)).toBeInTheDocument();
    });

    it('should handle form validation gracefully', async () => {
      const user = userEvent.setup();
      render(<ParentLoginScreen {...defaultProps} />, { wrapper: TestWrapper });

      const emailInput = screen.getByPlaceholderText('votre.email@exemple.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');

      // Type invalid email
      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'password123');

      // Should show email validation error
      expect(screen.getByText(/format d'email invalide/i)).toBeInTheDocument();
    });
  });
});
