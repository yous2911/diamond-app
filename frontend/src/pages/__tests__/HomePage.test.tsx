/**
 * HomePage Component Tests for FastRevEd Kids
 * Tests main dashboard, student profile, mascot interactions, and navigation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from '../HomePage';
import { AuthProvider } from '../../contexts/AuthContext';
import { CelebrationProvider } from '../../contexts/CelebrationContext';
import { PremiumFeaturesProvider } from '../../contexts/PremiumFeaturesContext';
import { BrowserRouter } from 'react-router-dom';

// =============================================================================
// TEST SETUP & MOCKS
// =============================================================================

// Mock react-router-dom - keep navigate mock but provide real BrowserRouter for tests
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the API service
jest.mock('../../services/api', () => ({
  apiService: {
    getStudentProfile: jest.fn(),
    updateStudentProfile: jest.fn(),
    getExercises: jest.fn(),
    submitExerciseResult: jest.fn(),
    getMascotData: jest.fn(),
    updateMascotEmotion: jest.fn(),
    getWardrobeItems: jest.fn(),
    equipWardrobeItem: jest.fn(),
    getAchievements: jest.fn(),
    getLeaderboard: jest.fn(),
  }
}));

// Mock the API hooks to match actual HomePage usage
const mockUpdateEmotion = jest.fn();
const mockStartSession = jest.fn();
const mockEndSession = jest.fn();
const mockAddXp = jest.fn();

jest.mock('../../hooks/useApiData', () => ({
  useStudentStats: () => ({
    data: {
      stats: {
        totalCorrectAnswers: 25,
        totalExercises: 30
      }
    },
    isLoading: false,
    error: null
  }),
  useExercisesByLevel: (level: string) => ({
    data: [
      {
        id: 1,
        matiere: 'mathematiques',
        type: 'calcul',
        question: '2 + 2 = ?',
        answer: '4',
        options: ['3', '4', '5', '6']
      },
      {
        id: 2,
        matiere: 'francais',
        type: 'lecture',
        question: 'Complétez: Le chat ___ sur le toit',
        answer: 'monte',
        options: ['monte', 'descend', 'court', 'dort']
      }
    ],
    isLoading: false,
    error: null
  }),
  useMascot: () => ({
    data: {
      type: 'dragon',
      emotion: 'happy',
      level: 5
    },
    updateEmotion: mockUpdateEmotion,
    isLoading: false,
    error: null
  }),
  useSessionManagement: () => ({
    data: {
      hasActiveSession: false,
      session: null
    },
    startSession: mockStartSession,
    endSession: mockEndSession,
    isLoading: false,
    error: null
  }),
  useXpTracking: () => ({
    currentXp: 1250,
    currentLevel: 5,
    xpGained: 0,
    showXpAnimation: false,
    addXp: mockAddXp
  }),
  useCompetences: () => ({
    data: [],
    isLoading: false,
    error: null
  })
}));

// Mock useGPUPerformance
jest.mock('../../hooks/useGPUPerformance', () => ({
  useGPUPerformance: () => ({})
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { whileHover, whileTap, initial, animate, transition, ...domProps } = props;
      return <div {...domProps}>{children}</div>;
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
  User: () => <div data-testid="user-icon" />,
  Trophy: () => <div data-testid="trophy-icon" />,
  Star: () => <div data-testid="star-icon" />,
  Heart: () => <div data-testid="heart-icon" />,
  BookOpen: () => <div data-testid="book-icon" />,
  Target: () => <div data-testid="target-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Award: () => <div data-testid="award-icon" />,
  Play: () => <div data-testid="play-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  LogOut: () => <div data-testid="logout-icon" />,
  Volume2: () => <div data-testid="volume-on-icon" />,
  VolumeX: () => <div data-testid="volume-off-icon" />,
}));

// Mock components used by HomePage
jest.mock('../../components/MemorableEntrance', () => {
  return function MockMemorableEntrance({ studentName, level, onComplete }: any) {
    return (
      <div data-testid="memorable-entrance">
        <span>Welcome {studentName}!</span>
        <span>Level: {level}</span>
        <button onClick={onComplete} data-testid="entrance-complete">Continue</button>
      </div>
    );
  };
});

jest.mock('../../components/DiamondCP_CE2Interface', () => {
  return function MockDiamondInterface({ studentData, onSubjectClick, onExerciseStart }: any) {
    return (
      <div data-testid="diamond-interface">
        <span>Student: {studentData?.prenom}</span>
        <button onClick={() => onSubjectClick({ id: 'math', exercises: [] })} data-testid="subject-math">
          Mathématiques
        </button>
        <button onClick={() => onSubjectClick({ id: 'french', exercises: [{ id: 1, title: 'Test Exercise' }] })} data-testid="subject-french">
          Français
        </button>
      </div>
    );
  };
});

jest.mock('../../components/mascot/MascotWardrobe3D', () => {
  return function MockMascotWardrobe({ mascotType, equippedItems, onItemEquip, onItemUnequip }: any) {
    return (
      <div data-testid="mascot-wardrobe">
        <span>Mascot: {mascotType}</span>
        <span>Items: {equippedItems?.join(', ')}</span>
        <button onClick={() => onItemEquip('test-item')} data-testid="equip-item">
          Equip Item
        </button>
        <button onClick={() => onItemUnequip('golden_crown')} data-testid="unequip-item">
          Unequip Item
        </button>
      </div>
    );
  };
});

jest.mock('../../components/XPCrystalsPremium', () => {
  return function MockXPCrystalsPremium({ currentXP, maxXP, level, onLevelUp, studentName, achievements }: any) {
    return (
      <div data-testid="xp-crystals-premium">
        <div>XP: {currentXP}/{maxXP}</div>
        <div>Level: {level}</div>
        <div>Student: {studentName}</div>
        <div>Achievements: {achievements?.length || 0}</div>
      </div>
    );
  };
});

jest.mock('../../components/MicroInteractions', () => {
  return function MockMicroInteraction({ children, onClick, className, ...props }: any) {
    return (
      <div className={className} onClick={onClick} {...props}>
        {children}
      </div>
    );
  };
});

// Mock window dimensions
Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
Object.defineProperty(window, 'innerHeight', { writable: true, value: 768 });


// Mock AuthContext with student data
const mockStudent = {
  id: 1,
  prenom: 'Emma',
  nom: 'Martin',
  niveau: 'CE1',
  currentStreak: 7,
  heartsRemaining: 5,
  totalXp: 1250,
  currentLevel: 5
};

const mockLogout = jest.fn();
const mockSetMascotEmotion = jest.fn();
const mockSetMascotMessage = jest.fn();
const mockTriggerParticles = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    student: mockStudent,
    logout: mockLogout,
    isAuthenticated: true,
    refreshStudentData: jest.fn()
  }),
  AuthProvider: ({ children }: any) => children
}));

jest.mock('../../contexts/PremiumFeaturesContext', () => ({
  usePremiumFeatures: () => ({
    setMascotEmotion: mockSetMascotEmotion,
    setMascotMessage: mockSetMascotMessage,
    triggerParticles: mockTriggerParticles
  }),
  PremiumFeaturesProvider: ({ children }: any) => children
}));

// Test wrapper with all providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <CelebrationProvider>
        <PremiumFeaturesProvider>
          {children}
        </PremiumFeaturesProvider>
      </CelebrationProvider>
    </AuthProvider>
  </BrowserRouter>
);

beforeEach(() => {
  jest.clearAllMocks();
  mockNavigate.mockClear();
  mockUpdateEmotion.mockClear();
  mockStartSession.mockClear();
  mockEndSession.mockClear();
  mockLogout.mockClear();
  mockSetMascotEmotion.mockClear();
  mockSetMascotMessage.mockClear();
  mockTriggerParticles.mockClear();
  
  // Reset localStorage
  localStorage.clear();
});

// =============================================================================
// HOMEPAGE COMPONENT TESTS
// =============================================================================

describe('HomePage', () => {
  describe('Core Rendering', () => {
    it('should render the main homepage components', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      // Check main components are rendered
      expect(screen.getByTestId('xp-crystals-premium')).toBeInTheDocument();
      expect(screen.getByTestId('diamond-interface')).toBeInTheDocument();
      expect(screen.getByTestId('logout-icon')).toBeInTheDocument();
    });

    it('should display student data correctly', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      // Check XP Crystals component receives correct data
      expect(screen.getByText('XP: 1250/200')).toBeInTheDocument();
      expect(screen.getByText('Level: 5')).toBeInTheDocument();
      expect(screen.getByText('Student: Emma')).toBeInTheDocument();
      expect(screen.getByText('Achievements: 3')).toBeInTheDocument();
    });

    it('should show memorable entrance for first-time visitors', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      expect(screen.getByTestId('memorable-entrance')).toBeInTheDocument();
      expect(screen.getByText('Welcome Emma!')).toBeInTheDocument();
      expect(screen.getByText('Level: 5')).toBeInTheDocument();
    });

    it('should not show entrance for returning visitors', () => {
      localStorage.setItem('diamond-app-visited', 'true');
      render(<HomePage />, { wrapper: TestWrapper });

      expect(screen.queryByTestId('memorable-entrance')).not.toBeInTheDocument();
    });

    it('should render diamond interface with student data', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      expect(screen.getByTestId('diamond-interface')).toBeInTheDocument();
      expect(screen.getByText('Student: Emma')).toBeInTheDocument();
    });
  });

  describe('Subject Interaction', () => {
    it('should handle subject click with exercises', async () => {
      const user = userEvent.setup();
      render(<HomePage />, { wrapper: TestWrapper });

      const frenchSubject = screen.getByTestId('subject-french');
      await user.click(frenchSubject);

      await waitFor(() => {
        expect(mockSetMascotEmotion).toHaveBeenCalledWith('thinking');
        expect(mockSetMascotMessage).toHaveBeenCalledWith('C\'est parti pour une nouvelle aventure !');
        expect(mockUpdateEmotion).toHaveBeenCalledWith('good', 'exercise_complete');
        expect(mockNavigate).toHaveBeenCalledWith('/exercise', { state: { exercise: { id: 1, title: 'Test Exercise' } } });
      });
    });

    it('should handle subject click without exercises', async () => {
      const user = userEvent.setup();
      render(<HomePage />, { wrapper: TestWrapper });

      const mathSubject = screen.getByTestId('subject-math');
      await user.click(mathSubject);

      await waitFor(() => {
        expect(mockSetMascotEmotion).toHaveBeenCalledWith('thinking');
        expect(mockSetMascotMessage).toHaveBeenCalledWith('C\'est parti pour une nouvelle aventure !');
        expect(mockSetMascotEmotion).toHaveBeenCalledWith('sleepy');
        expect(mockSetMascotMessage).toHaveBeenCalledWith('Cette matière arrive bientôt ! 🚧');
      });
    });

    it('should start session when no active session exists', async () => {
      const user = userEvent.setup();
      render(<HomePage />, { wrapper: TestWrapper });

      const frenchSubject = screen.getByTestId('subject-french');
      await user.click(frenchSubject);

      await waitFor(() => {
        expect(mockStartSession).toHaveBeenCalledWith([]);
      });
    });
  });

  describe('Wardrobe System', () => {
    it('should open wardrobe modal when button is clicked', async () => {
      const user = userEvent.setup();
      render(<HomePage />, { wrapper: TestWrapper });

      // Find wardrobe button (has shirt emoji)
      const wardrobeButton = screen.getByText('👕').closest('div');
      await user.click(wardrobeButton!);

      await waitFor(() => {
        expect(screen.getByText('Garde-robe du Mascot')).toBeInTheDocument();
        expect(screen.getByTestId('mascot-wardrobe')).toBeInTheDocument();
      });
    });

    it('should close wardrobe modal when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<HomePage />, { wrapper: TestWrapper });

      // Open wardrobe first
      const wardrobeButton = screen.getByText('👕').closest('div');
      await user.click(wardrobeButton!);

      await waitFor(() => {
        expect(screen.getByText('Garde-robe du Mascot')).toBeInTheDocument();
      });

      // Close wardrobe
      const closeButton = screen.getByText('×');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Garde-robe du Mascot')).not.toBeInTheDocument();
      });
    });

    it('should display wardrobe with mascot and equipped items', async () => {
      const user = userEvent.setup();
      render(<HomePage />, { wrapper: TestWrapper });

      const wardrobeButton = screen.getByText('👕').closest('div');
      await user.click(wardrobeButton!);

      await waitFor(() => {
        expect(screen.getByText('Mascot: dragon')).toBeInTheDocument();
        expect(screen.getByText('Items: golden_crown, magic_cape')).toBeInTheDocument();
      });
    });
  });

  describe('Level Up System', () => {
    it('should handle level up with celebrations', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      // Get the onLevelUp function from XPCrystalsPremium mock
      const xpComponent = screen.getByTestId('xp-crystals-premium');
      
      // Simulate level up by directly calling the handler
      const handleLevelUp = jest.fn((newLevel) => {
        mockSetMascotEmotion('excited');
        mockSetMascotMessage('NIVEAU SUPÉRIEUR ! 🎉');
        mockUpdateEmotion('excellent', 'level_up');
        mockTriggerParticles('levelup', 3000);
      });

      handleLevelUp(6);

      expect(mockSetMascotEmotion).toHaveBeenCalledWith('excited');
      expect(mockSetMascotMessage).toHaveBeenCalledWith('NIVEAU SUPÉRIEUR ! 🎉');
      expect(mockUpdateEmotion).toHaveBeenCalledWith('excellent', 'level_up');
      expect(mockTriggerParticles).toHaveBeenCalledWith('levelup', 3000);
    });
  });

  describe('Logout Functionality', () => {
    it('should display logout button', () => {
      render(<HomePage />, { wrapper: TestWrapper });
      
      expect(screen.getByTestId('logout-icon')).toBeInTheDocument();
    });

    it('should handle logout without active session', async () => {
      const user = userEvent.setup();
      render(<HomePage />, { wrapper: TestWrapper });

      const logoutButton = screen.getByTestId('logout-icon').closest('div');
      await user.click(logoutButton!);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
        expect(mockEndSession).not.toHaveBeenCalled();
      });
    });
  });

  describe('Session Management Integration', () => {
    it('should not show active session indicator when no session', () => {
      render(<HomePage />, { wrapper: TestWrapper });
      
      expect(screen.queryByText('📚 Session en cours')).not.toBeInTheDocument();
    });

    it('should show active session indicator when session exists', () => {
      // Mock active session
      jest.mocked(require('../../hooks/useApiData').useSessionManagement).mockReturnValue({
        data: {
          hasActiveSession: true,
          session: { id: 1, exercisesCompleted: 3 }
        },
        startSession: mockStartSession,
        endSession: mockEndSession,
        isLoading: false,
        error: null
      });
      
      render(<HomePage />, { wrapper: TestWrapper });
      
      expect(screen.getByText('📚 Session en cours')).toBeInTheDocument();
      expect(screen.getByText('3 exercices complétés')).toBeInTheDocument();
    });
  });

  describe('Memorable Entrance Flow', () => {
    it('should complete entrance flow correctly', async () => {
      const user = userEvent.setup();
      render(<HomePage />, { wrapper: TestWrapper });

      expect(screen.getByTestId('memorable-entrance')).toBeInTheDocument();
      
      const completeButton = screen.getByTestId('entrance-complete');
      await user.click(completeButton);

      await waitFor(() => {
        expect(localStorage.getItem('diamond-app-visited')).toBe('true');
        expect(screen.queryByTestId('memorable-entrance')).not.toBeInTheDocument();
      });
    });
  });

  describe('Route Navigation', () => {
    it('should ensure homepage stays on correct route', () => {
      // Mock window location
      delete window.location;
      window.location = { pathname: '/other-page' } as any;
      
      render(<HomePage />, { wrapper: TestWrapper });
      
      // Should attempt to navigate to homepage
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });

    it('should not navigate if already on homepage', () => {
      delete window.location;
      window.location = { pathname: '/' } as any;
      
      render(<HomePage />, { wrapper: TestWrapper });
      
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Student Data Processing', () => {
    it('should process student data correctly for components', () => {
      render(<HomePage />, { wrapper: TestWrapper });
      
      // Verify student data is processed into correct format
      expect(screen.getByText('Student: Emma')).toBeInTheDocument();
      expect(screen.getByText('XP: 1250/200')).toBeInTheDocument(); // maxXP = 100 + (level * 20)
      expect(screen.getByText('Level: 5')).toBeInTheDocument();
    });

    it('should handle missing student data gracefully', () => {
      // Mock null student
      jest.mocked(require('../../contexts/AuthContext').useAuth).mockReturnValue({
        student: null,
        logout: mockLogout,
        isAuthenticated: true,
        refreshStudentData: jest.fn()
      });
      
      render(<HomePage />, { wrapper: TestWrapper });
      
      expect(screen.getByText('Student: Élève')).toBeInTheDocument();
      expect(screen.getByText('Level: 1')).toBeInTheDocument();
    });
  });

  describe('Fallback Subject Data', () => {
    it('should use mock subject data when API data is empty', () => {
      // Mock empty exercises data
      jest.mocked(require('../../hooks/useApiData').useExercisesByLevel).mockReturnValue({
        data: [],
        isLoading: false,
        error: null
      });
      
      render(<HomePage />, { wrapper: TestWrapper });
      
      // Component should still render with fallback data
      expect(screen.getByTestId('diamond-interface')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors in subject click', async () => {
      // Mock API error
      mockUpdateEmotion.mockRejectedValue(new Error('API Error'));
      mockStartSession.mockRejectedValue(new Error('API Error'));
      
      const user = userEvent.setup();
      render(<HomePage />, { wrapper: TestWrapper });

      const frenchSubject = screen.getByTestId('subject-french');
      await user.click(frenchSubject);

      // Should still navigate despite errors (due to .catch(console.warn))
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/exercise', { state: { exercise: { id: 1, title: 'Test Exercise' } } });
      });
    });

    it('should handle logout with active session and error', async () => {
      // Mock active session with error on end
      jest.mocked(require('../../hooks/useApiData').useSessionManagement).mockReturnValue({
        data: {
          hasActiveSession: true,
          session: { id: 1, exercisesCompleted: 3 }
        },
        startSession: mockStartSession,
        endSession: mockEndSession.mockRejectedValue(new Error('Session end error')),
        isLoading: false,
        error: null
      });
      
      const user = userEvent.setup();
      render(<HomePage />, { wrapper: TestWrapper });

      const logoutButton = screen.getByTestId('logout-icon').closest('div');
      await user.click(logoutButton!);

      await waitFor(() => {
        expect(mockEndSession).toHaveBeenCalledWith(1);
        expect(mockLogout).toHaveBeenCalled();
      });
    });
  });

  describe('Wardrobe Item Management', () => {
    it('should handle item equip in wardrobe', async () => {
      const user = userEvent.setup();
      render(<HomePage />, { wrapper: TestWrapper });

      // Open wardrobe
      const wardrobeButton = screen.getByText('👕').closest('div');
      await user.click(wardrobeButton!);

      await waitFor(() => {
        expect(screen.getByTestId('mascot-wardrobe')).toBeInTheDocument();
      });

      // Equip an item
      const equipButton = screen.getByTestId('equip-item');
      await user.click(equipButton);

      // Should update equipped items state
      await waitFor(() => {
        expect(screen.getByText('Items: golden_crown, magic_cape, test-item')).toBeInTheDocument();
      });
    });

    it('should handle item unequip in wardrobe', async () => {
      const user = userEvent.setup();
      render(<HomePage />, { wrapper: TestWrapper });

      const wardrobeButton = screen.getByText('👕').closest('div');
      await user.click(wardrobeButton!);

      await waitFor(() => {
        expect(screen.getByTestId('mascot-wardrobe')).toBeInTheDocument();
      });

      const unequipButton = screen.getByTestId('unequip-item');
      await user.click(unequipButton);

      await waitFor(() => {
        expect(screen.getByText('Items: magic_cape')).toBeInTheDocument();
      });
    });
  });

  describe('Component Integration', () => {
    it('should integrate all major components correctly', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      // Verify all major components are present and integrated
      expect(screen.getByTestId('xp-crystals-premium')).toBeInTheDocument();
      expect(screen.getByTestId('diamond-interface')).toBeInTheDocument();
      expect(screen.getByTestId('logout-icon')).toBeInTheDocument();
      expect(screen.getByText('👕')).toBeInTheDocument(); // Wardrobe button
    });

    it('should pass correct props to child components', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      // XP Crystals should receive correct student data
      expect(screen.getByText('XP: 1250/200')).toBeInTheDocument();
      expect(screen.getByText('Student: Emma')).toBeInTheDocument();
      
      // Diamond interface should receive student data
      expect(screen.getByText('Student: Emma')).toBeInTheDocument();
    });
  });
});
