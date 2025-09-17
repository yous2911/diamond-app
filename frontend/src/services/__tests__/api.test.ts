import { apiService, Student } from '../api';

// Mocking global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock student data for responses
const mockStudent: Student = {
  id: 1,
  prenom: 'Jean',
  nom: 'Dupont',
  identifiant: 'JD123',
  classe: 'CP',
  niveau: 'Niveau 1',
  ageGroup: '6-8',
  totalXp: 100,
  currentLevel: 2,
  currentStreak: 5,
  heartsRemaining: 3,
  dateInscription: new Date().toISOString(),
  lastLogin: new Date().toISOString(),
};

describe('APIService', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    apiService.logout(); // Reset auth state before each test
  });

  // =============================================================================
  // UTILITY: makeRequest
  // =============================================================================
  describe('makeRequest', () => {
    it('should handle successful API responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { message: 'Success' } }),
      });

      const response = await apiService.healthCheck();
      expect(response.success).toBe(true);
      expect(response.data).toEqual({ message: 'Success' });
    });

    it('should handle failed API responses (response not ok)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: { message: 'Not Found', code: 'NOT_FOUND' },
        }),
      });

      const response = await apiService.healthCheck();
      expect(response.success).toBe(false);
      expect(response.error?.message).toBe('Not Found');
      expect(response.error?.code).toBe('NOT_FOUND');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      const response = await apiService.healthCheck();
      expect(response.success).toBe(false);
      expect(response.error?.message).toBe('Network failure');
      expect(response.error?.code).toBe('NETWORK_ERROR');
    });
  });

  // =============================================================================
  // AUTHENTICATION
  // =============================================================================
  describe('Authentication', () => {
    it('should login successfully and update state', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { student: mockStudent, expiresIn: 3600 },
        }),
      });

      const response = await apiService.login({ email: 'test@test.com', password: 'password' });
      expect(response.success).toBe(true);
      expect(response.data?.student).toEqual(mockStudent);
      expect(apiService.authenticated).toBe(true);
      expect(apiService.currentStudentData).toEqual(mockStudent);
    });

    it('should handle login failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' },
        }),
      });

      const response = await apiService.login({ email: 'test@test.com', password: 'password' });
      expect(response.success).toBe(false);
      expect(apiService.authenticated).toBe(false);
      expect(apiService.currentStudentData).toBeNull();
    });

    it('should logout successfully and clear state', async () => {
      // First, simulate a logged-in state
      apiService['isAuthenticated'] = true;
      apiService['currentStudent'] = mockStudent;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { message: 'Logged out' } }),
      });

      await apiService.logout();
      expect(apiService.authenticated).toBe(false);
      expect(apiService.currentStudentData).toBeNull();
    });
  });

  // =============================================================================
  // STUDENT MANAGEMENT
  // =============================================================================
  describe('Student Management', () => {
    it('should get student profile when authenticated', async () => {
      apiService['currentStudent'] = mockStudent; // Simulate logged-in state
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { student: mockStudent } }),
      });

      const response = await apiService.getStudentProfile();
      expect(response.success).toBe(true);
      expect(response.data?.student).toEqual(mockStudent);
    });

    it('should return an error if getting profile without student ID', async () => {
      const response = await apiService.getStudentProfile();
      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('MISSING_STUDENT_ID');
    });
  });

  // =============================================================================
  // EXERCISES
  // =============================================================================
  describe('Exercises', () => {
    it('should submit an exercise successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { attempt: {}, xpEarned: 10, masteryLevelChanged: false },
        }),
      });

      const result = {
        score: 80,
        timeSpent: 120,
        completed: true,
      };

      const response = await apiService.submitExercise(1, result);
      expect(response.success).toBe(true);
      expect(response.data?.xpEarned).toBe(10);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/exercises/attempt'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String),
        })
      );
    });
  });

  // =============================================================================
  // MASCOT & WARDROBE
  // =============================================================================
  describe('Mascot and Wardrobe', () => {
    beforeEach(() => {
      apiService['currentStudent'] = mockStudent; // All these endpoints need a student
    });

    it('should fetch the mascot data', async () => {
      const mockMascot = { id: 1, type: 'dragon', studentId: 1 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { mascot: mockMascot } }),
      });

      const response = await apiService.getMascot();
      expect(response.success).toBe(true);
      expect(response.data?.mascot).toEqual(mockMascot);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/mascots/1'), expect.any(Object));
    });

    it('should fetch wardrobe items', async () => {
      const mockWardrobe = { items: [], summary: {} };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockWardrobe }),
      });

      const response = await apiService.getWardrobe();
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockWardrobe);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/wardrobe/1'), expect.any(Object));
    });
  });
});
