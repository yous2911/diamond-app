/**
 * EnhancedDashboard Component Tests
 * Tests the main dashboard view, including widget rendering and data display.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import EnhancedDashboard from '../EnhancedDashboard'; // Adjust path
import { apiService } from '../../services/api'; // Assuming a service like this

// =============================================================================
// TEST SETUP & MOCKS
// =============================================================================

// Mock the API service
jest.mock('../../services/api', () => ({
  apiService: {
    getDashboardData: jest.fn(),
  },
}));

// Mock child components to isolate the dashboard's own logic
jest.mock('../XPProgressWidget', () => () => <div data-testid="xp-widget" />);
jest.mock('../AchievementBadges', () => () => <div data-testid="achievements-widget" />);
jest.mock('../CurrentGoalsWidget', () => () => <div data-testid="goals-widget" />);


// Mock data
const mockDashboardData = {
  userName: 'Test User',
  level: 10,
  xp: { current: 500, total: 1000 },
  recentAchievements: [{ id: 1, title: 'Math Whiz' }],
  currentGoals: [{ id: 1, title: 'Complete 10 exercises' }],
};

// =============================================================================
// COMPONENT TESTS
// =============================================================================

describe('EnhancedDashboard', () => {
  beforeEach(() => {
    // Reset mocks before each test
    (apiService.getDashboardData as jest.Mock).mockClear();
  });

  it('should show a loading state initially', () => {
    (apiService.getDashboardData as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<EnhancedDashboard />);
    expect(screen.getByText(/Loading dashboard.../i)).toBeInTheDocument();
  });

  it('should display an error message if data fetching fails', async () => {
    (apiService.getDashboardData as jest.Mock).mockRejectedValue(new Error('API Error'));
    render(<EnhancedDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load dashboard data/i)).toBeInTheDocument();
    });
  });

  describe('With successful data fetching', () => {
    beforeEach(() => {
      (apiService.getDashboardData as jest.Mock).mockResolvedValue(mockDashboardData);
    });

    it('should fetch data on mount', () => {
      render(<EnhancedDashboard />);
      expect(apiService.getDashboardData).toHaveBeenCalledTimes(1);
    });

    it('should render a welcome message with the user name', async () => {
      render(<EnhancedDashboard />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Welcome back, Test User!/i })).toBeInTheDocument();
      });
    });

    it('should render all the dashboard widgets', async () => {
      render(<EnhancedDashboard />);
      await waitFor(() => {
        expect(screen.getByTestId('xp-widget')).toBeInTheDocument();
        expect(screen.getByTestId('achievements-widget')).toBeInTheDocument();
        expect(screen.getByTestId('goals-widget')).toBeInTheDocument();
      });
    });
  });
});
