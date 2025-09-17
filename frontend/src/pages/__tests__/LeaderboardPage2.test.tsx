import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LeaderboardPage from '../LeaderboardPage';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn().mockReturnValue({
    student: { id: 123, name: 'Test Student' },
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn()
  })
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => {
      const { initial, animate, transition, ...domProps } = props;
      return <div className={className} {...domProps}>{children}</div>;
    }
  }
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Home: () => <div data-testid="home-icon" />
}));

// Mock UserCentricLeaderboard component
jest.mock('../../components/dashboard/UserCentricLeaderboard', () => {
  return function MockUserCentricLeaderboard({ studentId }: { studentId: number }) {
    return <div data-testid="leaderboard-component">Leaderboard for student {studentId}</div>;
  };
});

describe('LeaderboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithRouter = () => {
    return render(
      <MemoryRouter>
        <LeaderboardPage />
      </MemoryRouter>
    );
  };

  it('renders the page title', () => {
    renderWithRouter();
    
    expect(screen.getByText('🏆 Classement')).toBeInTheDocument();
  });

  it('renders the home button with icon and text', () => {
    renderWithRouter();
    
    expect(screen.getByTestId('home-icon')).toBeInTheDocument();
    expect(screen.getByText('Accueil')).toBeInTheDocument();
  });

  it('renders the UserCentricLeaderboard component with student ID', () => {
    renderWithRouter();
    
    const leaderboard = screen.getByTestId('leaderboard-component');
    expect(leaderboard).toBeInTheDocument();
    expect(leaderboard).toHaveTextContent('Leaderboard for student 123');
  });

  it('navigates to home when home button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter();
    
    const homeButton = screen.getByRole('button', { name: /accueil/i });
    await user.click(homeButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('uses default student ID when no student in context', () => {
    // Temporarily mock useAuth to return no student
    mockUseAuth.mockReturnValue({
      student: null,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn()
    });
    
    renderWithRouter();
    
    const leaderboard = screen.getByTestId('leaderboard-component');
    expect(leaderboard).toHaveTextContent('Leaderboard for student 1');
    
    // Restore original mock
    mockUseAuth.mockReturnValue(mockAuthContext);
  });

  it('has correct CSS classes for layout', () => {
    renderWithRouter();
    
    const mainContainer = screen.getByText('🏆 Classement').closest('div')?.parentElement;
    expect(mainContainer).toHaveClass('min-h-screen', 'bg-gradient-to-br', 'from-purple-50', 'via-blue-50', 'to-pink-50', 'p-6');
  });

  it('has correct CSS classes for header', () => {
    renderWithRouter();
    
    const headerContainer = screen.getByText('🏆 Classement').closest('div');
    expect(headerContainer).toHaveClass('flex', 'justify-between', 'items-center', 'mb-8');
  });

  it('has correct CSS classes for title', () => {
    renderWithRouter();
    
    const title = screen.getByText('🏆 Classement');
    expect(title).toHaveClass('text-3xl', 'font-bold', 'bg-gradient-to-r', 'from-purple-600', 'to-pink-600', 'bg-clip-text', 'text-transparent');
  });

  it('has correct CSS classes for home button', () => {
    renderWithRouter();
    
    const homeButton = screen.getByRole('button', { name: /accueil/i });
    expect(homeButton).toHaveClass('flex', 'items-center', 'space-x-2', 'bg-white/80', 'rounded-xl', 'px-4', 'py-2', 'hover:bg-white', 'transition-colors');
  });

  it('renders with different student IDs', () => {
    // Test with different student ID
    mockUseAuth.mockReturnValue({
      student: { id: 456, name: 'Another Student' },
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn()
    });
    
    renderWithRouter();
    
    const leaderboard = screen.getByTestId('leaderboard-component');
    expect(leaderboard).toHaveTextContent('Leaderboard for student 456');
  });

  it('handles undefined student gracefully', () => {
    mockUseAuth.mockReturnValue({
      student: undefined,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn()
    });
    
    renderWithRouter();
    
    const leaderboard = screen.getByTestId('leaderboard-component');
    expect(leaderboard).toHaveTextContent('Leaderboard for student 1');
  });

  it('renders all main elements', () => {
    renderWithRouter();
    
    // Check all main elements are present
    expect(screen.getByRole('button', { name: /accueil/i })).toBeInTheDocument();
    expect(screen.getByText('🏆 Classement')).toBeInTheDocument();
    expect(screen.getByTestId('leaderboard-component')).toBeInTheDocument();
    expect(screen.getByTestId('home-icon')).toBeInTheDocument();
  });
});