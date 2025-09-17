/**
 * Unit tests for useFastRevKidsApi hooks
 * Tests real hook logic for student progress and stats management
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useStudentProgress, useStudentStats, useUpdateProgress } from '../useFastRevKidsApi';

describe('useFastRevKidsApi Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useStudentProgress', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useStudentProgress());

      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should load progress data successfully', async () => {
      const { result } = renderHook(() => useStudentProgress());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(3);
      expect(result.current.data?.[0]).toEqual(
        expect.objectContaining({
          id: 1,
          competenceId: 'math-basics',
          competenceName: 'Mathématiques de Base',
          status: 'mastered',
          progress: 100
        })
      );
      expect(result.current.error).toBeNull();
    });

    it('should contain all expected progress statuses', async () => {
      const { result } = renderHook(() => useStudentProgress());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const statuses = result.current.data?.map(item => item.status) || [];
      expect(statuses).toContain('mastered');
      expect(statuses).toContain('learning');
      expect(statuses).toContain('not_started');
    });

    it('should have correct spaced repetition data structure', async () => {
      const { result } = renderHook(() => useStudentProgress());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const masteredItem = result.current.data?.find(item => item.status === 'mastered');
      expect(masteredItem).toEqual(
        expect.objectContaining({
          repetitionNumber: 5,
          easinessFactor: 2.5,
          nextReviewDate: expect.any(Date),
          attempts: 12,
          successes: 12
        })
      );
    });

    it('should handle not_started items correctly', async () => {
      const { result } = renderHook(() => useStudentProgress());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const notStartedItem = result.current.data?.find(item => item.status === 'not_started');
      expect(notStartedItem).toEqual(
        expect.objectContaining({
          progress: 0,
          timeSpent: 0,
          lastPracticed: null,
          nextReview: null,
          attempts: 0,
          successes: 0,
          repetitionNumber: 0,
          nextReviewDate: null
        })
      );
    });

    it('should handle learning progress correctly', async () => {
      const { result } = renderHook(() => useStudentProgress());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const learningItem = result.current.data?.find(item => item.status === 'learning');
      expect(learningItem).toEqual(
        expect.objectContaining({
          progress: 75,
          timeSpent: 30,
          attempts: 8,
          successes: 6,
          repetitionNumber: 2,
          easinessFactor: 1.8
        })
      );

      // Learning items should have review dates
      expect(learningItem?.lastPracticed).toBeInstanceOf(Date);
      expect(learningItem?.nextReview).toBeInstanceOf(Date);
      expect(learningItem?.nextReviewDate).toBeInstanceOf(Date);
    });
  });

  describe('useStudentStats', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useStudentStats());

      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should load stats data successfully', async () => {
      const { result } = renderHook(() => useStudentStats());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({
        stats: {
          totalTime: 75,
          totalExercises: 20,
          successRate: 85,
          currentStreak: 5,
          longestStreak: 12,
          achievements: 8,
          level: 3
        }
      });
      expect(result.current.error).toBeNull();
    });

    it('should provide meaningful stats structure', async () => {
      const { result } = renderHook(() => useStudentStats());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const stats = result.current.data?.stats;
      expect(stats).toEqual(
        expect.objectContaining({
          totalTime: expect.any(Number),
          totalExercises: expect.any(Number),
          successRate: expect.any(Number),
          currentStreak: expect.any(Number),
          longestStreak: expect.any(Number),
          achievements: expect.any(Number),
          level: expect.any(Number)
        })
      );
    });

    it('should have realistic stat values', async () => {
      const { result } = renderHook(() => useStudentStats());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const stats = result.current.data?.stats;
      expect(stats.successRate).toBeGreaterThan(0);
      expect(stats.successRate).toBeLessThanOrEqual(100);
      expect(stats.currentStreak).toBeLessThanOrEqual(stats.longestStreak);
      expect(stats.level).toBeGreaterThan(0);
      expect(stats.totalExercises).toBeGreaterThan(0);
      expect(stats.totalTime).toBeGreaterThan(0);
    });
  });

  describe('useUpdateProgress', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useUpdateProgress());

      expect(result.current.isUpdating).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.updateProgress).toBe('function');
    });

    it('should handle successful progress update', async () => {
      const { result } = renderHook(() => useUpdateProgress());

      const updateResult = await act(async () => {
        return await result.current.updateProgress('math-basics', {
          progress: 90,
          status: 'learning'
        });
      });

      expect(updateResult).toEqual({ success: true });
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle partial progress updates', async () => {
      const { result } = renderHook(() => useUpdateProgress());

      const partialUpdate = {
        progress: 50,
        timeSpent: 25
      };

      const updateResult = await act(async () => {
        return await result.current.updateProgress('french-phonics', partialUpdate);
      });

      expect(updateResult).toEqual({ success: true });
      expect(result.current.isUpdating).toBe(false);
    });

    it('should handle competence status changes', async () => {
      const { result } = renderHook(() => useUpdateProgress());

      const statusUpdate = {
        status: 'mastered' as const,
        progress: 100,
        repetitionNumber: 3,
        easinessFactor: 2.2
      };

      const updateResult = await act(async () => {
        return await result.current.updateProgress('vocabulary', statusUpdate);
      });

      expect(updateResult).toEqual({ success: true });
      expect(result.current.error).toBeNull();
    });

    it('should handle spaced repetition updates', async () => {
      const { result } = renderHook(() => useUpdateProgress());

      const spacedRepetitionUpdate = {
        repetitionNumber: 4,
        easinessFactor: 2.1,
        nextReviewDate: new Date('2024-01-25'),
        attempts: 15,
        successes: 14
      };

      const updateResult = await act(async () => {
        return await result.current.updateProgress('math-basics', spacedRepetitionUpdate);
      });

      expect(updateResult).toEqual({ success: true });
      expect(result.current.isUpdating).toBe(false);
    });

    it('should maintain loading state during update', async () => {
      const { result } = renderHook(() => useUpdateProgress());

      const updateResult = await act(async () => {
        return await result.current.updateProgress('test-competence', { progress: 75 });
      });

      expect(updateResult).toEqual({ success: true });
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should allow multiple sequential updates', async () => {
      const { result } = renderHook(() => useUpdateProgress());

      // First update
      const result1 = await act(async () => {
        return await result.current.updateProgress('competence-1', { progress: 50 });
      });
      expect(result1.success).toBe(true);

      // Second update
      const result2 = await act(async () => {
        return await result.current.updateProgress('competence-2', { progress: 75 });
      });
      expect(result2.success).toBe(true);

      expect(result.current.isUpdating).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Data Structure Validation', () => {
    it('should have consistent data types in progress items', async () => {
      const { result } = renderHook(() => useStudentProgress());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.data?.forEach(item => {
        expect(typeof item.id).toBe('number');
        expect(typeof item.competenceId).toBe('string');
        expect(typeof item.competenceName).toBe('string');
        expect(['mastered', 'learning', 'not_started']).toContain(item.status);
        expect(typeof item.progress).toBe('number');
        expect(item.progress).toBeGreaterThanOrEqual(0);
        expect(item.progress).toBeLessThanOrEqual(100);
        expect(typeof item.timeSpent).toBe('number');
        expect(typeof item.difficulty).toBe('number');
        expect(typeof item.attempts).toBe('number');
        expect(typeof item.successes).toBe('number');
        expect(typeof item.repetitionNumber).toBe('number');
        expect(typeof item.easinessFactor).toBe('number');
      });
    });

    it('should have valid dates where present', async () => {
      const { result } = renderHook(() => useStudentProgress());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.data?.forEach(item => {
        if (item.lastPracticed) {
          expect(item.lastPracticed).toBeInstanceOf(Date);
        }
        if (item.nextReview) {
          expect(item.nextReview).toBeInstanceOf(Date);
        }
        if (item.nextReviewDate) {
          expect(item.nextReviewDate).toBeInstanceOf(Date);
        }
      });
    });

    it('should have logical spaced repetition values', async () => {
      const { result } = renderHook(() => useStudentProgress());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.data?.forEach(item => {
        expect(item.successes).toBeLessThanOrEqual(item.attempts);
        expect(item.easinessFactor).toBeGreaterThan(0);
        expect(item.repetitionNumber).toBeGreaterThanOrEqual(0);
      });
    });
  });
});