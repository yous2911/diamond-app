import { parentApi, ChildData, ChildAnalytics, SuperMemoStats, ProgressReport } from '../parentApi';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock environment
const originalEnv = process.env;

describe('ParentApiService', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockLocalStorage.getItem.mockReset();
    parentApi.clearCache();
  });

  describe('Authentication', () => {
    it('includes Bearer token in requests when token exists', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' }),
      });

      await parentApi.getChildren(1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/parents/children/1'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('includes Bearer token as null when no token exists', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' }),
      });

      await parentApi.getChildren(1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/parents/children/1'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer null',
          }),
        })
      );
    });

    it('uses default BASE_URL when REACT_APP_API_URL is not set', async () => {
      // Temporarily remove env var
      delete process.env.REACT_APP_API_URL;
      
      mockLocalStorage.getItem.mockReturnValue('token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' }),
      });

      await parentApi.getChildren(1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/parents/children/1'),
        expect.any(Object)
      );

      // Restore env var
      process.env.REACT_APP_API_URL = 'http://test-api.com';
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
    });

    it('throws error for 404 responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(parentApi.getChildren(999)).rejects.toThrow('API Error: 404 Not Found');
    });

    it('throws error for 500 responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(parentApi.getChildren(1)).rejects.toThrow('API Error: 500 Internal Server Error');
    });

    it('throws error for 401 unauthorized responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(parentApi.getChildren(1)).rejects.toThrow('API Error: 401 Unauthorized');
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(parentApi.getChildren(1)).rejects.toThrow('Network error');
    });
  });

  describe('getChildren', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
    });

    it('fetches children data successfully', async () => {
      const mockChildrenData: ChildData[] = [
        {
          id: 1,
          name: 'Alice',
          age: 8,
          level: 'CE2',
          avatar: 'avatar1.jpg',
          totalXP: 1200,
          currentStreak: 5,
          completedExercises: 45,
          masteredCompetencies: 12,
          currentLevel: 3,
          lastActivity: '2024-01-15',
        },
        {
          id: 2,
          name: 'Bob',
          age: 7,
          level: 'CE1',
          avatar: 'avatar2.jpg',
          totalXP: 850,
          currentStreak: 3,
          completedExercises: 32,
          masteredCompetencies: 8,
          currentLevel: 2,
          lastActivity: '2024-01-14',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockChildrenData,
      });

      const result = await parentApi.getChildren(123);

      expect(result).toEqual(mockChildrenData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/parents/children/123'),
        expect.any(Object)
      );
    });

    it('handles empty children array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await parentApi.getChildren(123);
      expect(result).toEqual([]);
    });
  });

  describe('getChildAnalytics', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
    });

    it('fetches child analytics with default timeframe', async () => {
      const mockAnalytics: ChildAnalytics = {
        weeklyProgress: [10, 15, 12, 20, 18, 25, 22],
        recentAchievements: [
          {
            id: 1,
            title: 'Reading Champion',
            icon: '📚',
            date: '2024-01-15',
            color: 'blue',
          },
        ],
        competencyProgress: [
          {
            domain: 'French',
            progress: 75,
            total: 100,
            mastered: 12,
          },
        ],
        learningPattern: {
          bestTime: 'Morning',
          averageSession: '25 minutes',
          preferredSubject: 'Mathematics',
          difficultyTrend: 'Improving',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalytics,
      });

      const result = await parentApi.getChildAnalytics(456);

      expect(result).toEqual(mockAnalytics);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/parents/analytics/456?timeframe=week'),
        expect.any(Object)
      );
    });

    it('fetches child analytics with custom timeframe', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await parentApi.getChildAnalytics(456, 'month');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/parents/analytics/456?timeframe=month'),
        expect.any(Object)
      );
    });

    it('handles year timeframe', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await parentApi.getChildAnalytics(456, 'year');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/parents/analytics/456?timeframe=year'),
        expect.any(Object)
      );
    });
  });

  describe('getSuperMemoStats', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
    });

    it('fetches SuperMemo stats with default days', async () => {
      const mockStats: SuperMemoStats = {
        retention: 0.85,
        averageInterval: 4.2,
        stabilityIndex: 3.1,
        retrievalStrength: 0.72,
        totalReviews: 145,
        successRate: 0.78,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      const result = await parentApi.getSuperMemoStats(789);

      expect(result).toEqual(mockStats);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/parents/supermemo/789?days=30'),
        expect.any(Object)
      );
    });

    it('fetches SuperMemo stats with custom days', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await parentApi.getSuperMemoStats(789, 60);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/parents/supermemo/789?days=60'),
        expect.any(Object)
      );
    });
  });

  describe('getProgressReport', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
    });

    it('fetches progress report with default parameters', async () => {
      const mockReport: ProgressReport = {
        childId: 123,
        period: 'month',
        generatedAt: '2024-01-15T10:00:00Z',
        summary: {
          totalLearningTime: '15h 30m',
          exercisesCompleted: 45,
          competenciesImproved: 8,
          averageScore: 85.5,
          streakRecord: 12,
        },
        achievements: [
          {
            type: 'streak',
            description: 'Maintained 7-day learning streak',
          },
        ],
        recommendations: [
          'Continue focusing on reading comprehension',
          'Try more challenging math problems',
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockReport,
      });

      const result = await parentApi.getProgressReport(123);

      expect(result).toEqual(mockReport);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/parents/report/123?format=json&period=month'),
        expect.any(Object)
      );
    });

    it('fetches progress report with custom parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await parentApi.getProgressReport(123, 'pdf', 'quarter');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/parents/report/123?format=pdf&period=quarter'),
        expect.any(Object)
      );
    });

    it('handles email format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await parentApi.getProgressReport(123, 'email', 'week');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/parents/report/123?format=email&period=week'),
        expect.any(Object)
      );
    });
  });

  describe('Caching', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
    });

    it('caches data and returns cached result within cache duration', async () => {
      const mockFetcher = jest.fn().mockResolvedValue('fresh data');

      // First call - should fetch fresh data
      let result = await parentApi.getCachedData('test-key', mockFetcher);
      expect(result).toBe('fresh data');
      expect(mockFetcher).toHaveBeenCalledTimes(1);

      // Second call within cache duration - should return cached data
      result = await parentApi.getCachedData('test-key', mockFetcher);
      expect(result).toBe('fresh data');
      expect(mockFetcher).toHaveBeenCalledTimes(1); // Still only called once
    });

    it('fetches fresh data after cache expires', async () => {
      const mockFetcher = jest.fn()
        .mockResolvedValueOnce('old data')
        .mockResolvedValueOnce('new data');

      // Mock Date.now to control time
      const originalDateNow = Date.now;
      let mockTime = 1000;
      Date.now = jest.fn(() => mockTime);

      try {
        // First call
        let result = await parentApi.getCachedData('test-key', mockFetcher);
        expect(result).toBe('old data');

        // Move time forward beyond cache duration (30 seconds)
        mockTime += 35000;

        // Second call after cache expiration
        result = await parentApi.getCachedData('test-key', mockFetcher);
        expect(result).toBe('new data');
        expect(mockFetcher).toHaveBeenCalledTimes(2);
      } finally {
        Date.now = originalDateNow;
      }
    });

    it('handles different cache keys independently', async () => {
      const mockFetcher1 = jest.fn().mockResolvedValue('data1');
      const mockFetcher2 = jest.fn().mockResolvedValue('data2');

      const result1 = await parentApi.getCachedData('key1', mockFetcher1);
      const result2 = await parentApi.getCachedData('key2', mockFetcher2);

      expect(result1).toBe('data1');
      expect(result2).toBe('data2');
      expect(mockFetcher1).toHaveBeenCalledTimes(1);
      expect(mockFetcher2).toHaveBeenCalledTimes(1);

      // Second calls should use cache
      await parentApi.getCachedData('key1', mockFetcher1);
      await parentApi.getCachedData('key2', mockFetcher2);

      expect(mockFetcher1).toHaveBeenCalledTimes(1);
      expect(mockFetcher2).toHaveBeenCalledTimes(1);
    });

    it('clears specific cache key', async () => {
      const mockFetcher = jest.fn().mockResolvedValue('data');

      // First call - cache data
      await parentApi.getCachedData('test-key', mockFetcher);
      expect(mockFetcher).toHaveBeenCalledTimes(1);

      // Clear specific cache key
      parentApi.clearCache('test-key');

      // Second call - should fetch fresh data
      await parentApi.getCachedData('test-key', mockFetcher);
      expect(mockFetcher).toHaveBeenCalledTimes(2);
    });

    it('clears entire cache when no key specified', async () => {
      const mockFetcher1 = jest.fn().mockResolvedValue('data1');
      const mockFetcher2 = jest.fn().mockResolvedValue('data2');

      // Cache some data
      await parentApi.getCachedData('key1', mockFetcher1);
      await parentApi.getCachedData('key2', mockFetcher2);

      // Clear entire cache
      parentApi.clearCache();

      // Both should fetch fresh data
      await parentApi.getCachedData('key1', mockFetcher1);
      await parentApi.getCachedData('key2', mockFetcher2);

      expect(mockFetcher1).toHaveBeenCalledTimes(2);
      expect(mockFetcher2).toHaveBeenCalledTimes(2);
    });

    it('handles fetcher errors correctly', async () => {
      const mockFetcher = jest.fn().mockRejectedValue(new Error('Fetcher error'));

      await expect(parentApi.getCachedData('error-key', mockFetcher))
        .rejects.toThrow('Fetcher error');

      // Should not cache error results
      await expect(parentApi.getCachedData('error-key', mockFetcher))
        .rejects.toThrow('Fetcher error');

      expect(mockFetcher).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration Tests', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
    });

    it('handles complete parent dashboard data flow', async () => {
      // Mock children data
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, name: 'Test Child' }],
      });

      // Mock analytics data
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ weeklyProgress: [1, 2, 3] }),
      });

      // Mock SuperMemo stats
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ retention: 0.85 }),
      });

      const children = await parentApi.getChildren(1);
      const analytics = await parentApi.getChildAnalytics(1);
      const stats = await parentApi.getSuperMemoStats(1);

      expect(children).toEqual([{ id: 1, name: 'Test Child' }]);
      expect(analytics).toEqual({ weeklyProgress: [1, 2, 3] });
      expect(stats).toEqual({ retention: 0.85 });
    });

    it('handles authentication flow correctly', async () => {
      // Test without token
      mockLocalStorage.getItem.mockReturnValue(null);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(parentApi.getChildren(1)).rejects.toThrow('API Error: 401 Unauthorized');

      // Test with token
      mockLocalStorage.getItem.mockReturnValue('valid-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, name: 'Child' }],
      });

      const result = await parentApi.getChildren(1);
      expect(result).toEqual([{ id: 1, name: 'Child' }]);
    });
  });
});