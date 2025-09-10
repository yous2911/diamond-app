/**
 * UserCentricLeaderboard Component Tests
 * Tests the display of rankings with a focus on the current user.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import UserCentricLeaderboard from '../UserCentricLeaderboard'; // Adjust path

// =============================================================================
// TEST SETUP & MOCKS
// =============================================================================

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Trophy: () => <div data-testid="trophy-icon" />,
  Medal: () => <div data-testid="medal-icon" />,
  Crown: () => <div data-testid="crown-icon" />,
}));

// Mock data
const mockPlayers = [
  { id: 'user-1', name: 'Player One', rank: 1, xp: 5000 },
  { id: 'user-2', name: 'Player Two', rank: 2, xp: 4500 },
  { id: 'user-3', name: 'Current User', rank: 3, xp: 4000 },
  { id: 'user-4', name: 'Player Four', rank: 4, xp: 3500 },
];

// =============================================================================
// COMPONENT TESTS
// =============================================================================

describe('UserCentricLeaderboard', () => {
  const defaultProps = {
    players: mockPlayers,
    currentUserID: 'user-3',
  };

  const renderComponent = (props = defaultProps) => {
    return render(<UserCentricLeaderboard {...props} />);
  };

  it('should render a list of all players', () => {
    renderComponent();
    expect(screen.getByText('Player One')).toBeInTheDocument();
    expect(screen.getByText('Player Two')).toBeInTheDocument();
    expect(screen.getByText('Current User')).toBeInTheDocument();
    expect(screen.getByText('Player Four')).toBeInTheDocument();
  });

  it('should display the correct rank and XP for each player', () => {
    renderComponent();
    // Check for a few players to confirm
    const playerOneRow = screen.getByText('Player One').closest('div');
    expect(playerOneRow).toHaveTextContent('1');
    expect(playerOneRow).toHaveTextContent('5000 XP');

    const playerFourRow = screen.getByText('Player Four').closest('div');
    expect(playerFourRow).toHaveTextContent('4');
    expect(playerFourRow).toHaveTextContent('3500 XP');
  });

  it('should highlight the current user in the list', () => {
    renderComponent();
    const currentUserRow = screen.getByText('Current User').closest('div');
    // This assumes a specific class is used for highlighting
    expect(currentUserRow).toHaveClass('highlight-user');
  });

  it('should display special icons for the top 3 players', () => {
    renderComponent();
    // Player 1 (rank 1) should have a crown
    const playerOneRow = screen.getByText('Player One').closest('div');
    expect(playerOneRow.querySelector('[data-testid="crown-icon"]')).toBeInTheDocument();

    // Player 2 (rank 2) should have a medal
    const playerTwoRow = screen.getByText('Player Two').closest('div');
    expect(playerTwoRow.querySelector('[data-testid="medal-icon"]')).toBeInTheDocument();

    // Player 3 (rank 3) should have a medal
    const currentUserRow = screen.getByText('Current User').closest('div');
    expect(currentUserRow.querySelector('[data-testid="medal-icon"]')).toBeInTheDocument();
  });

  it('should render a message if the player list is empty', () => {
    renderComponent({ ...defaultProps, players: [] });
    expect(screen.getByText(/The leaderboard is empty./i)).toBeInTheDocument();
  });
});
