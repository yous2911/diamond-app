/**
 * RealTimeNotifications Component Tests for FastRevEd Kids
 * Tests real-time notification display, WebSocket connection, and celebrations
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RealTimeNotifications from '../RealTimeNotifications';

// =============================================================================
// TEST SETUP & MOCKS
// =============================================================================

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { whileHover, whileTap, initial, animate, transition, ...domProps } = props;
      return <div {...domProps} data-testid="motion-div-notifications">{children}</div>;
    },
    button: ({ children, ...props }: any) => {
      const { whileHover, whileTap, initial, animate, transition, ...domProps } = props;
      return <button {...domProps}>{children}</button>;
    },
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Bell: () => <div data-testid="bell-icon" />,
  BellOff: () => <div data-testid="bell-off-icon" />,
  X: () => <div data-testid="close-icon" />,
  Star: () => <div data-testid="star-icon" />,
  Target: () => <div data-testid="target-icon" />,
  Flame: () => <div data-testid="flame-icon" />,
  Trophy: () => <div data-testid="trophy-icon" />,
  BookOpen: () => <div data-testid="book-icon" />,
}));

// Mock window dimensions
Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
Object.defineProperty(window, 'innerHeight', { writable: true, value: 768 });

// Mock WebSocket for real-time functionality
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  onopen: jest.fn(),
  onmessage: jest.fn(),
  onclose: jest.fn(),
  onerror: jest.fn(),
  readyState: 1, // WebSocket.OPEN
};

// Mock WebSocket constructor
global.WebSocket = jest.fn(() => mockWebSocket) as any;

// Mock WebSocket constants
Object.defineProperty(global.WebSocket, 'OPEN', { value: 1 });
Object.defineProperty(global.WebSocket, 'CLOSED', { value: 3 });
Object.defineProperty(global.WebSocket, 'CONNECTING', { value: 0 });
Object.defineProperty(global.WebSocket, 'CLOSING', { value: 2 });

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>{children}</div>
);

// Default props for RealTimeNotifications component
const defaultProps = {
  userId: 1,
  userType: 'student' as const,
};

// Mock WebSocket messages
const mockWebSocketMessages = {
  progressUpdate: {
    type: 'progress_update',
    update: {
      data: { score: 95 },
      timestamp: new Date().toISOString(),
    },
  },
  levelUpCelebration: {
    type: 'level_up_celebration',
    celebration: {
      title: 'Niveau Supérieur!',
      message: 'Tu es maintenant niveau 5! Continue comme ça!',
      confetti: true,
      duration: 5000,
    },
    update: {
      timestamp: new Date().toISOString(),
    },
  },
  streakCelebration: {
    type: 'streak_celebration',
    celebration: {
      title: 'Série de 7 jours!',
      message: 'Tu as une série de 7 jours consécutifs!',
      confetti: true,
      duration: 4000,
    },
    update: {
      timestamp: new Date().toISOString(),
    },
  },
  competencyMastery: {
    type: 'competency_mastery_celebration',
    celebration: {
      title: 'Compétence Maîtrisée!',
      message: 'Tu as maîtrisé la compétence "Calcul mental"!',
      confetti: true,
      duration: 6000,
    },
    update: {
      timestamp: new Date().toISOString(),
    },
  },
  dailyGoalAchieved: {
    type: 'daily_goal_achieved',
    data: {
      message: 'Objectif quotidien atteint!',
    },
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  // Reset WebSocket mock
  mockWebSocket.send.mockClear();
  mockWebSocket.close.mockClear();
  mockWebSocket.onopen = null;
  mockWebSocket.onmessage = null;
  mockWebSocket.onclose = null;
  mockWebSocket.onerror = null;
  mockWebSocket.readyState = WebSocket.OPEN;
  
  // Reset global WebSocket mock
  (global.WebSocket as unknown as jest.Mock).mockClear();
});

// =============================================================================
// REAL-TIME NOTIFICATIONS COMPONENT TESTS
// =============================================================================

describe('RealTimeNotifications', () => {
  describe('WebSocket Connection', () => {
    it('should establish WebSocket connection on mount', () => {
      render(<RealTimeNotifications {...defaultProps} />, { wrapper: TestWrapper });

      expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:3004/ws');
    });

    it('should send registration message when connected', async () => {
      render(<RealTimeNotifications {...defaultProps} />, { wrapper: TestWrapper });

      // Simulate WebSocket connection
      act(() => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen(new Event('open'));
        }
      });

      await waitFor(() => {
        expect(mockWebSocket.send).toHaveBeenCalledWith(
          JSON.stringify({
            type: 'register',
            userId: 1,
            userType: 'student',
          })
        );
      });
    });

    it('should show connection status indicator', async () => {
      render(<RealTimeNotifications {...defaultProps} />, { wrapper: TestWrapper });

      // Initially disconnected
      expect(screen.getByTestId('bell-off-icon')).toBeInTheDocument();
      expect(screen.getByText('Reconnexion...')).toBeInTheDocument();

      // Simulate connection
      act(() => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen(new Event('open'));
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
        expect(screen.getByText('Notifications actives')).toBeInTheDocument();
      });
    });

    it('should attempt to reconnect on connection loss', async () => {
      jest.useFakeTimers();
      render(<RealTimeNotifications {...defaultProps} />, { wrapper: TestWrapper });

      // Simulate connection and then disconnection
      act(() => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen(new Event('open'));
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Notifications actives')).toBeInTheDocument();
      });

      // Simulate disconnection
      act(() => {
        if (mockWebSocket.onclose) {
          mockWebSocket.onclose(new Event('close'));
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Reconnexion...')).toBeInTheDocument();
      });

      // Fast-forward time to trigger reconnection
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Should attempt to reconnect
      expect(global.WebSocket).toHaveBeenCalledTimes(2);
      
      jest.useRealTimers();
    });
  });

  describe('Notification Display', () => {
    it('should display progress update notifications', async () => {
      render(<RealTimeNotifications {...defaultProps} />, { wrapper: TestWrapper });

      // Simulate receiving progress update
      act(() => {
        if (mockWebSocket.onmessage) {
          const event = {
            data: JSON.stringify(mockWebSocketMessages.progressUpdate),
          } as MessageEvent;
          mockWebSocket.onmessage(event);
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Exercice terminé !')).toBeInTheDocument();
        expect(screen.getByText('Score: 95%')).toBeInTheDocument();
      });
    });

    it('should display level up celebration notifications', async () => {
      render(<RealTimeNotifications {...defaultProps} />, { wrapper: TestWrapper });

      // Simulate receiving level up celebration
      act(() => {
        if (mockWebSocket.onmessage) {
          const event = {
            data: JSON.stringify(mockWebSocketMessages.levelUpCelebration),
          } as MessageEvent;
          mockWebSocket.onmessage(event);
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Niveau Supérieur!')).toBeInTheDocument();
        expect(screen.getByText('Tu es maintenant niveau 5! Continue comme ça!')).toBeInTheDocument();
      });
    });

    it('should display streak celebration notifications', async () => {
      render(<RealTimeNotifications {...defaultProps} />, { wrapper: TestWrapper });

      // Simulate receiving streak celebration
      act(() => {
        if (mockWebSocket.onmessage) {
          const event = {
            data: JSON.stringify(mockWebSocketMessages.streakCelebration),
          } as MessageEvent;
          mockWebSocket.onmessage(event);
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Série de 7 jours!')).toBeInTheDocument();
        expect(screen.getByText('Tu as une série de 7 jours consécutifs!')).toBeInTheDocument();
      });
    });

    it('should display competency mastery notifications', async () => {
      render(<RealTimeNotifications {...defaultProps} />, { wrapper: TestWrapper });

      // Simulate receiving competency mastery
      act(() => {
        if (mockWebSocket.onmessage) {
          const event = {
            data: JSON.stringify(mockWebSocketMessages.competencyMastery),
          } as MessageEvent;
          mockWebSocket.onmessage(event);
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Compétence Maîtrisée!')).toBeInTheDocument();
        expect(screen.getByText('Tu as maîtrisé la compétence "Calcul mental"!')).toBeInTheDocument();
      });
    });

    it('should display daily goal achieved notifications', async () => {
      render(<RealTimeNotifications {...defaultProps} />, { wrapper: TestWrapper });

      // Simulate receiving daily goal achieved
      act(() => {
        if (mockWebSocket.onmessage) {
          const event = {
            data: JSON.stringify(mockWebSocketMessages.dailyGoalAchieved),
          } as MessageEvent;
          mockWebSocket.onmessage(event);
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Objectif quotidien atteint !')).toBeInTheDocument();
        expect(screen.getByText('Objectif quotidien atteint!')).toBeInTheDocument();
      });
    });

    it('should show appropriate icons for different notification types', async () => {
      render(<RealTimeNotifications {...defaultProps} />, { wrapper: TestWrapper });

      // Test progress update icon
      act(() => {
        if (mockWebSocket.onmessage) {
          const event = {
            data: JSON.stringify(mockWebSocketMessages.progressUpdate),
          } as MessageEvent;
          mockWebSocket.onmessage(event);
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('book-icon')).toBeInTheDocument();
      });
    });

    it('should show timestamps for notifications', async () => {
      render(<RealTimeNotifications {...defaultProps} />, { wrapper: TestWrapper });

      // Simulate receiving notification
      act(() => {
        if (mockWebSocket.onmessage) {
          const event = {
            data: JSON.stringify(mockWebSocketMessages.progressUpdate),
          } as MessageEvent;
          mockWebSocket.onmessage(event);
        }
      });

      await waitFor(() => {
        // Should show time in format like "10:30:00"
        expect(screen.getByText(/\d{1,2}:\d{2}:\d{2}/)).toBeInTheDocument();
      });
    });
  });

  describe('Notification Interactions', () => {
    it('should allow closing individual notifications', async () => {
      render(<RealTimeNotifications {...defaultProps} />, { wrapper: TestWrapper });

      // Simulate receiving notification
      act(() => {
        if (mockWebSocket.onmessage) {
          const event = {
            data: JSON.stringify(mockWebSocketMessages.progressUpdate),
          } as MessageEvent;
          mockWebSocket.onmessage(event);
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('Exercice terminé !')).toBeInTheDocument();
      });

      // Click close button
      const closeButton = screen.getByTestId('close-icon').closest('button');
      fireEvent.click(closeButton!);
      
      await waitFor(() => {
        expect(screen.queryByText('Exercice terminé !')).not.toBeInTheDocument();
      });
    });

    it('should call onNotificationReceived callback when notification is received', async () => {
      const mockCallback = jest.fn();
      render(
        <RealTimeNotifications {...defaultProps} onNotificationReceived={mockCallback} />,
        { wrapper: TestWrapper }
      );

      // Simulate receiving notification
      act(() => {
        if (mockWebSocket.onmessage) {
          const event = {
            data: JSON.stringify(mockWebSocketMessages.progressUpdate),
          } as MessageEvent;
          mockWebSocket.onmessage(event);
        }
      });

      await waitFor(() => {
        expect(mockCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'progress_update',
            title: 'Exercice terminé !',
            message: 'Score: 95%',
          })
        );
      });
    });
  });

  describe('Celebration Modal', () => {
    it('should show celebration modal for confetti celebrations', async () => {
      render(<RealTimeNotifications {...defaultProps} />, { wrapper: TestWrapper });

      // Simulate receiving level up celebration with confetti
      act(() => {
        if (mockWebSocket.onmessage) {
          const event = {
            data: JSON.stringify(mockWebSocketMessages.levelUpCelebration),
          } as MessageEvent;
          mockWebSocket.onmessage(event);
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Niveau Supérieur!')).toBeInTheDocument();
        expect(screen.getByText('Tu es maintenant niveau 5! Continue comme ça!')).toBeInTheDocument();
        expect(screen.getByText('Continuer ! ✨')).toBeInTheDocument();
      });
    });

    it('should close celebration modal when continue button is clicked', async () => {
      const user = userEvent.setup();
      render(<RealTimeNotifications {...defaultProps} />, { wrapper: TestWrapper });

      // Simulate receiving celebration
      act(() => {
        if (mockWebSocket.onmessage) {
          const event = {
            data: JSON.stringify(mockWebSocketMessages.levelUpCelebration),
          } as MessageEvent;
          mockWebSocket.onmessage(event);
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Continuer ! ✨')).toBeInTheDocument();
      });

      // Click continue button
      const continueButton = screen.getByText('Continuer ! ✨');
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.queryByText('Continuer ! ✨')).not.toBeInTheDocument();
      });
    });
  });

  describe('Parent Notifications', () => {
    it('should display child progress notifications for parent users', async () => {
      const parentProps = { ...defaultProps, userType: 'parent' as const };
      render(<RealTimeNotifications {...parentProps} />, { wrapper: TestWrapper });

      // Simulate receiving child progress notification
      const childProgressMessage = {
        type: 'child_progress_notification',
        notification: {
          title: 'Progrès de votre enfant',
          message: 'Marie a terminé son exercice de mathématiques',
          icon: '📚',
          color: 'bg-blue-500',
        },
      };

      act(() => {
        if (mockWebSocket.onmessage) {
          const event = {
            data: JSON.stringify(childProgressMessage),
          } as MessageEvent;
          mockWebSocket.onmessage(event);
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Progrès de votre enfant')).toBeInTheDocument();
        expect(screen.getByText('Marie a terminé son exercice de mathématiques')).toBeInTheDocument();
      });
    });

    it('should not display child progress notifications for student users', async () => {
      render(<RealTimeNotifications {...defaultProps} />, { wrapper: TestWrapper });

      // Simulate receiving child progress notification
      const childProgressMessage = {
        type: 'child_progress_notification',
        notification: {
          title: 'Progrès de votre enfant',
          message: 'Marie a terminé son exercice de mathématiques',
          icon: '📚',
          color: 'bg-blue-500',
        },
      };

      act(() => {
        if (mockWebSocket.onmessage) {
          const event = {
            data: JSON.stringify(childProgressMessage),
          } as MessageEvent;
          mockWebSocket.onmessage(event);
        }
      });

      await waitFor(() => {
        expect(screen.queryByText('Progrès de votre enfant')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle WebSocket connection errors gracefully', () => {
      // Mock WebSocket error
      global.WebSocket = jest.fn(() => {
        throw new Error('Connection failed');
      }) as any;

      // Should not crash the component
      expect(() => {
        render(<RealTimeNotifications {...defaultProps} />, { wrapper: TestWrapper });
      }).not.toThrow();
    });

    it('should handle malformed WebSocket messages', async () => {
      render(<RealTimeNotifications {...defaultProps} />, { wrapper: TestWrapper });

      // Simulate malformed message
      act(() => {
        if (mockWebSocket.onmessage) {
          const event = {
            data: 'invalid json',
          } as MessageEvent;
          mockWebSocket.onmessage(event);
        }
      });

      // Should not crash the component
      expect(screen.getByTestId('bell-off-icon')).toBeInTheDocument();
    });

    it('should handle unknown message types', async () => {
      render(<RealTimeNotifications {...defaultProps} />, { wrapper: TestWrapper });

      // Simulate unknown message type
      const unknownMessage = {
        type: 'unknown_type',
        data: { some: 'data' },
      };

      act(() => {
        if (mockWebSocket.onmessage) {
          const event = {
            data: JSON.stringify(unknownMessage),
          } as MessageEvent;
          mockWebSocket.onmessage(event);
        }
      });

      // Should not crash the component
      expect(screen.getByTestId('bell-off-icon')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should limit number of displayed notifications', async () => {
      render(<RealTimeNotifications {...defaultProps} />, { wrapper: TestWrapper });

      // Send multiple notifications
      for (let i = 0; i < 10; i++) {
        act(() => {
          if (mockWebSocket.onmessage) {
            const event = {
              data: JSON.stringify({
                ...mockWebSocketMessages.progressUpdate,
                update: {
                  ...mockWebSocketMessages.progressUpdate.update,
                  data: { score: 80 + i },
                },
              }),
            } as MessageEvent;
            mockWebSocket.onmessage(event);
          }
        });
      }

      await waitFor(() => {
        // Should only show 5 notifications (component limits to 5)
        const notifications = screen.getAllByText(/Exercice terminé/);
        expect(notifications.length).toBeLessThanOrEqual(5);
    });
  });

    it('should auto-remove notifications after duration', async () => {
      jest.useFakeTimers();
      render(<RealTimeNotifications {...defaultProps} />, { wrapper: TestWrapper });

      // Simulate receiving notification with duration
      act(() => {
        if (mockWebSocket.onmessage) {
          const event = {
            data: JSON.stringify(mockWebSocketMessages.progressUpdate),
          } as MessageEvent;
          mockWebSocket.onmessage(event);
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Exercice terminé !')).toBeInTheDocument();
      });

      // Fast-forward time to trigger auto-removal
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(screen.queryByText('Exercice terminé !')).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });
});

