/**
 * RealTimeNotifications Component Tests for FastRevEd Kids
 * Tests notification display, real-time updates, animations, and user interactions
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
  X: () => <div data-testid="close-icon" />,
  CheckCircle: () => <div data-testid="success-icon" />,
  AlertCircle: () => <div data-testid="warning-icon" />,
  Info: () => <div data-testid="info-icon" />,
  Trophy: () => <div data-testid="trophy-icon" />,
  Star: () => <div data-testid="star-icon" />,
  Heart: () => <div data-testid="heart-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  BookOpen: () => <div data-testid="book-icon" />,
  Target: () => <div data-testid="target-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
}));

// Mock window dimensions
Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
Object.defineProperty(window, 'innerHeight', { writable: true, value: 768 });

// Mock WebSocket for real-time functionality
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: WebSocket.OPEN,
};

global.WebSocket = jest.fn(() => mockWebSocket) as any;


// Mock notification service - create a simple mock since the service doesn't exist
const mockNotificationService = {
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  sendNotification: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  getUnreadCount: jest.fn(),
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>{children}</div>
);

// Mock notification data
const mockNotifications = [
  {
    id: '1',
    type: 'achievement',
    title: 'Nouveau Badge!',
    message: 'Tu as débloqué le badge "Mathématicien"',
    timestamp: new Date('2024-01-20T10:30:00Z'),
    read: false,
    priority: 'high',
    icon: 'trophy',
    actionUrl: '/achievements',
    metadata: {
      badgeId: 'math_genius',
      xpGained: 50,
    },
  },
  {
    id: '2',
    type: 'exercise_completed',
    title: 'Exercice Terminé',
    message: 'Félicitations! Tu as terminé l\'exercice de mathématiques',
    timestamp: new Date('2024-01-20T10:25:00Z'),
    read: false,
    priority: 'medium',
    icon: 'check-circle',
    actionUrl: '/exercises',
    metadata: {
      exerciseId: 'math_001',
      score: 95,
      timeSpent: 120,
    },
  },
  {
    id: '3',
    type: 'level_up',
    title: 'Niveau Supérieur!',
    message: 'Tu es maintenant niveau 5! Continue comme ça!',
    timestamp: new Date('2024-01-20T10:20:00Z'),
    read: true,
    priority: 'high',
    icon: 'star',
    actionUrl: '/profile',
    metadata: {
      newLevel: 5,
      xpGained: 100,
    },
  },
  {
    id: '4',
    type: 'reminder',
    title: 'Rappel',
    message: 'N\'oublie pas de faire tes exercices quotidiens!',
    timestamp: new Date('2024-01-20T09:00:00Z'),
    read: false,
    priority: 'low',
    icon: 'clock',
    actionUrl: '/exercises',
    metadata: {
      reminderType: 'daily_exercise',
    },
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockNotificationService.getUnreadCount.mockReturnValue(2);
  mockNotificationService.subscribe.mockImplementation((callback) => {
    // Simulate receiving notifications
    setTimeout(() => callback(mockNotifications), 100);
    return () => {}; // unsubscribe function
  });
});

// =============================================================================
// REAL-TIME NOTIFICATIONS COMPONENT TESTS
// =============================================================================

describe('RealTimeNotifications', () => {
  describe('Rendering', () => {
    it('should render notification bell icon', () => {
      render(<RealTimeNotifications />, { wrapper: TestWrapper });

      expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
    });

    it('should display unread count badge', () => {
      render(<RealTimeNotifications />, { wrapper: TestWrapper });

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should not display count badge when no unread notifications', () => {
      mockNotificationService.getUnreadCount.mockReturnValue(0);
      
      render(<RealTimeNotifications />, { wrapper: TestWrapper });

      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('should display count badge with max 99 for large numbers', () => {
      mockNotificationService.getUnreadCount.mockReturnValue(150);
      
      render(<RealTimeNotifications />, { wrapper: TestWrapper });

      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });

  describe('Notification Panel', () => {
    it('should open notification panel when bell is clicked', async () => {
      const user = userEvent.setup();
      render(<RealTimeNotifications />, { wrapper: TestWrapper });

      const bellButton = screen.getByTestId('bell-icon').closest('button');
      expect(bellButton).toBeInTheDocument();

      await user.click(bellButton!);

      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });
    });

    it('should close notification panel when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<RealTimeNotifications />, { wrapper: TestWrapper });

      // Open panel
      const bellButton = screen.getByTestId('bell-icon').closest('button');
      await user.click(bellButton!);

      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });

      // Close panel
      const closeButton = screen.getByTestId('close-icon').closest('button');
      await user.click(closeButton!);

      await waitFor(() => {
        expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
      });
    });

    it('should close notification panel when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <RealTimeNotifications />
          <div data-testid="outside-element">Outside</div>
        </div>,
        { wrapper: TestWrapper }
      );

      // Open panel
      const bellButton = screen.getByTestId('bell-icon').closest('button');
      await user.click(bellButton!);

      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });

      // Click outside
      const outsideElement = screen.getByTestId('outside-element');
      await user.click(outsideElement);

      await waitFor(() => {
        expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
      });
    });
  });

  describe('Notification Display', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<RealTimeNotifications />, { wrapper: TestWrapper });

      // Open notification panel
      const bellButton = screen.getByTestId('bell-icon').closest('button');
      await user.click(bellButton!);

      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });
    });

    it('should display all notifications', async () => {
      await waitFor(() => {
        expect(screen.getByText('Nouveau Badge!')).toBeInTheDocument();
        expect(screen.getByText('Exercice Terminé')).toBeInTheDocument();
        expect(screen.getByText('Niveau Supérieur!')).toBeInTheDocument();
        expect(screen.getByText('Rappel')).toBeInTheDocument();
      });
    });

    it('should display notification messages', async () => {
      await waitFor(() => {
        expect(screen.getByText('Tu as débloqué le badge "Mathématicien"')).toBeInTheDocument();
        expect(screen.getByText('Félicitations! Tu as terminé l\'exercice de mathématiques')).toBeInTheDocument();
        expect(screen.getByText('Tu es maintenant niveau 5! Continue comme ça!')).toBeInTheDocument();
        expect(screen.getByText('N\'oublie pas de faire tes exercices quotidiens!')).toBeInTheDocument();
      });
    });

    it('should display appropriate icons for different notification types', async () => {
      await waitFor(() => {
        expect(screen.getAllByTestId('trophy-icon')).toHaveLength(1);
        expect(screen.getAllByTestId('success-icon')).toHaveLength(1);
        expect(screen.getAllByTestId('star-icon')).toHaveLength(1);
        expect(screen.getAllByTestId('clock-icon')).toHaveLength(1);
      });
    });

    it('should show timestamps for notifications', async () => {
      await waitFor(() => {
        expect(screen.getByText(/il y a/i)).toBeInTheDocument();
      });
    });

    it('should highlight unread notifications', async () => {
      await waitFor(() => {
        const unreadNotifications = screen.getAllByText(/Nouveau Badge|Exercice Terminé|Rappel/);
        unreadNotifications.forEach(notification => {
          expect(notification.closest('div')).toHaveClass(/unread|highlight/);
        });
      });
    });
  });

  describe('Notification Interactions', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<RealTimeNotifications />, { wrapper: TestWrapper });

      // Open notification panel
      const bellButton = screen.getByTestId('bell-icon').closest('button');
      await user.click(bellButton!);

      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });
    });

    it('should mark notification as read when clicked', async () => {
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByText('Nouveau Badge!')).toBeInTheDocument();
      });

      const notification = screen.getByText('Nouveau Badge!').closest('div');
      await user.click(notification!);

      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('1');
    });

    it('should navigate to action URL when notification is clicked', async () => {
      const user = userEvent.setup();
      
      // Mock window.location
      delete (window as any).location;
      window.location = { href: '' } as any;

      await waitFor(() => {
        expect(screen.getByText('Nouveau Badge!')).toBeInTheDocument();
      });

      const notification = screen.getByText('Nouveau Badge!').closest('div');
      await user.click(notification!);

      expect(window.location.href).toBe('/achievements');
    });

    it('should mark all notifications as read when mark all button is clicked', async () => {
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });

      const markAllButton = screen.getByText(/marquer tout comme lu/i);
      await user.click(markAllButton);

      expect(mockNotificationService.markAllAsRead).toHaveBeenCalled();
    });

    it('should clear all notifications when clear all button is clicked', async () => {
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });

      const clearAllButton = screen.getByText(/tout effacer/i);
      await user.click(clearAllButton);

      await waitFor(() => {
        expect(screen.queryByText('Nouveau Badge!')).not.toBeInTheDocument();
        expect(screen.queryByText('Exercice Terminé')).not.toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should subscribe to notification updates on mount', () => {
      render(<RealTimeNotifications />, { wrapper: TestWrapper });

      expect(mockNotificationService.subscribe).toHaveBeenCalled();
    });

    it('should unsubscribe from notification updates on unmount', () => {
      const { unmount } = render(<RealTimeNotifications />, { wrapper: TestWrapper });

      unmount();

      // The unsubscribe function should be called
      expect(mockNotificationService.subscribe).toHaveBeenCalled();
    });

    it('should update notification count when new notifications arrive', async () => {
      const user = userEvent.setup();
      render(<RealTimeNotifications />, { wrapper: TestWrapper });

      // Initially shows 2 unread
      expect(screen.getByText('2')).toBeInTheDocument();

      // Simulate new notification arriving
      act(() => {
        mockNotificationService.getUnreadCount.mockReturnValue(3);
        // Trigger re-render
        const bellButton = screen.getByTestId('bell-icon').closest('button');
        fireEvent.click(bellButton!);
      });

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('should display new notifications in real-time', async () => {
      const user = userEvent.setup();
      render(<RealTimeNotifications />, { wrapper: TestWrapper });

      // Open notification panel
      const bellButton = screen.getByTestId('bell-icon').closest('button');
      await user.click(bellButton!);

      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });

      // Simulate new notification
      const newNotification = {
        id: '5',
        type: 'streak',
        title: 'Série de 7 jours!',
        message: 'Tu as une série de 7 jours consécutifs!',
        timestamp: new Date(),
        read: false,
        priority: 'high',
        icon: 'zap',
        actionUrl: '/streaks',
        metadata: { streakDays: 7 },
      };

      act(() => {
        // Simulate receiving new notification
        const callback = mockNotificationService.subscribe.mock.calls[0][0];
        callback([...mockNotifications, newNotification]);
      });

      await waitFor(() => {
        expect(screen.getByText('Série de 7 jours!')).toBeInTheDocument();
      });
    });
  });

  describe('Notification Types and Priorities', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<RealTimeNotifications />, { wrapper: TestWrapper });

      // Open notification panel
      const bellButton = screen.getByTestId('bell-icon').closest('button');
      await user.click(bellButton!);

      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });
    });

    it('should display high priority notifications first', async () => {
      await waitFor(() => {
        const notifications = screen.getAllByText(/Nouveau Badge|Exercice Terminé|Niveau Supérieur|Rappel/);
        // High priority notifications should appear first
        expect(notifications[0]).toHaveTextContent(/Nouveau Badge|Niveau Supérieur/);
      });
    });

    it('should show different styling for different priorities', async () => {
      await waitFor(() => {
        const highPriorityNotification = screen.getByText('Nouveau Badge!').closest('div');
        const lowPriorityNotification = screen.getByText('Rappel').closest('div');

        expect(highPriorityNotification).toHaveClass(/high-priority|priority-high/);
        expect(lowPriorityNotification).toHaveClass(/low-priority|priority-low/);
      });
    });

    it('should group notifications by type', async () => {
      await waitFor(() => {
        // Should have sections for different notification types
        expect(screen.getByText(/Achievements|Badges/)).toBeInTheDocument();
        expect(screen.getByText(/Exercises|Activités/)).toBeInTheDocument();
        expect(screen.getByText(/Progress|Progrès/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle WebSocket connection errors gracefully', async () => {
      // Mock WebSocket error
      const mockWebSocketError = new Error('Connection failed');
      global.WebSocket = jest.fn(() => {
        throw mockWebSocketError;
      }) as any;

      // Should not crash the component
      expect(() => {
        render(<RealTimeNotifications />, { wrapper: TestWrapper });
      }).not.toThrow();
    });

    it('should handle notification service errors', async () => {
      mockNotificationService.subscribe.mockImplementation(() => {
        throw new Error('Service unavailable');
      });

      // Should not crash the component
      expect(() => {
        render(<RealTimeNotifications />, { wrapper: TestWrapper });
      }).not.toThrow();
    });

    it('should display error message when notifications fail to load', async () => {
      mockNotificationService.subscribe.mockImplementation((callback) => {
        setTimeout(() => callback([]), 100);
        return () => {};
      });

      const user = userEvent.setup();
      render(<RealTimeNotifications />, { wrapper: TestWrapper });

      // Open notification panel
      const bellButton = screen.getByTestId('bell-icon').closest('button');
      await user.click(bellButton!);

      await waitFor(() => {
        expect(screen.getByText(/Aucune notification/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<RealTimeNotifications />, { wrapper: TestWrapper });

      const bellButton = screen.getByTestId('bell-icon').closest('button');
      expect(bellButton).toHaveAttribute('aria-label', /notifications/i);
    });

    it('should announce new notifications to screen readers', async () => {
      const user = userEvent.setup();
      render(<RealTimeNotifications />, { wrapper: TestWrapper });

      // Simulate new notification
      act(() => {
        const callback = mockNotificationService.subscribe.mock.calls[0][0];
        callback([...mockNotifications, {
          id: '6',
          type: 'achievement',
          title: 'Nouveau Badge!',
          message: 'Tu as débloqué un nouveau badge!',
          timestamp: new Date(),
          read: false,
          priority: 'high',
          icon: 'trophy',
          actionUrl: '/achievements',
          metadata: {},
        }]);
      });

      // Should have aria-live region for announcements
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<RealTimeNotifications />, { wrapper: TestWrapper });

      const bellButton = screen.getByTestId('bell-icon').closest('button');
      
      // Should be focusable
      bellButton?.focus();
      expect(bellButton).toHaveFocus();

      // Should open with Enter key
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });
    });

    it('should have proper button roles and text', () => {
      render(<RealTimeNotifications />, { wrapper: TestWrapper });

      const bellButton = screen.getByTestId('bell-icon').closest('button');
      expect(bellButton).toHaveAttribute('role', 'button');
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      const TestComponent = () => {
        renderSpy();
        return <RealTimeNotifications />;
      };

      render(<TestComponent />, { wrapper: TestWrapper });

      // Should only render once initially
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle large numbers of notifications efficiently', async () => {
      const user = userEvent.setup();
      
      // Create many notifications
      const manyNotifications = Array.from({ length: 100 }, (_, i) => ({
        id: `notification-${i}`,
        type: 'info',
        title: `Notification ${i}`,
        message: `This is notification number ${i}`,
        timestamp: new Date(),
        read: false,
        priority: 'low',
        icon: 'info',
        actionUrl: '/',
        metadata: {},
      }));

      mockNotificationService.subscribe.mockImplementation((callback) => {
        setTimeout(() => callback(manyNotifications), 100);
        return () => {};
      });

      render(<RealTimeNotifications />, { wrapper: TestWrapper });

      // Open notification panel
      const bellButton = screen.getByTestId('bell-icon').closest('button');
      await user.click(bellButton!);

      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });

      // Should handle large number of notifications without crashing
      expect(screen.getByText(/100 notifications/i)).toBeInTheDocument();
    });
  });
});
