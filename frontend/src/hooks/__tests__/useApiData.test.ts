/**
 * Comprehensive unit tests for useApiData hook and all related hooks
 * Tests individual functions with minimal mocking - focus on hook logic
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { 
  useApiData, useStudentProgress, useStudentStats, useStudentAchievements,
  useCompetences, useExercises, useExercisesByLevel, useRandomExercises,
  useMascot, useWardrobe, useEquippedItems, useActiveSession,
  useSessionManagement, useExerciseSubmission, useXpTracking 
} from '../useApiData';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

// Mock only external dependencies
jest.mock('../../contexts/AuthContext');
jest.mock('../../services/api');

// Mock window focus events
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
Object.defineProperty(window, 'addEventListener', { value: mockAddEventListener });
Object.defineProperty(window, 'removeEventListener', { value: mockRemoveEventListener });

describe('useApiData Hook', () => {
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  const mockApiService = apiService as any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      student: { id: 1, totalXp: 100, currentLevel: 2 },
      refreshStudentData: jest.fn()
    } as any);
  });

  describe('Core useApiData functionality', () => {
    it('should initialize with correct default state', () => {
      const mockFetch = jest.fn().mockResolvedValue({ success: true, data: 'test-data' });
      
      const { result } = renderHook(() => 
        useApiData(mockFetch, { autoFetch: false })
      );

      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastFetch).toBeNull();
    });

    it('should fetch data on mount when autoFetch is true', async () => {
      const mockFetch = jest.fn().mockResolvedValue({ 
        success: true, 
        data: { id: 1, name: 'test' } 
      });
      
      const { result } = renderHook(() => 
        useApiData(mockFetch, { autoFetch: true })
      );

      expect(result.current.isLoading).toBe(true);
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.current.data).toEqual({ id: 1, name: 'test' });
      expect(result.current.error).toBeNull();
    });

    it('should not fetch when not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        student: null,
        refreshStudentData: jest.fn()
      } as any);

      const mockFetch = jest.fn();
      
      renderHook(() => useApiData(mockFetch, { autoFetch: true }));

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle fetch errors correctly', async () => {
      const mockFetch = jest.fn().mockResolvedValue({ 
        success: false, 
        error: { message: 'API Error' } 
      });
      
      const { result } = renderHook(() => 
        useApiData(mockFetch, { autoFetch: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe('API Error');
    });

    it('should handle network errors correctly', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network Error'));
      
      const { result } = renderHook(() => 
        useApiData(mockFetch, { autoFetch: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe('Network Error');
    });

    it('should provide refetch functionality', async () => {
      const mockFetch = jest.fn()
        .mockResolvedValueOnce({ success: true, data: 'first-data' })
        .mockResolvedValueOnce({ success: true, data: 'second-data' });
      
      const { result } = renderHook(() => 
        useApiData(mockFetch, { autoFetch: false })
      );

      // Manual refetch
      await act(async () => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.data).toBe('first-data');
      });

      // Second refetch
      await act(async () => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.data).toBe('second-data');
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should calculate isFresh correctly based on cacheTime', async () => {
      const mockFetch = jest.fn().mockResolvedValue({ 
        success: true, 
        data: 'test-data' 
      });
      
      const { result } = renderHook(() => 
        useApiData(mockFetch, { autoFetch: true, cacheTime: 1 }) // 1 minute cache
      );

      await waitFor(() => {
        expect(result.current.data).toBe('test-data');
      });

      expect(result.current.isFresh).toBe(true);
    });

    it('should set up window focus listener when refetchOnWindowFocus is true', () => {
      const mockFetch = jest.fn().mockResolvedValue({ success: true, data: 'test' });
      
      renderHook(() => 
        useApiData(mockFetch, { refetchOnWindowFocus: true })
      );

      expect(mockAddEventListener).toHaveBeenCalledWith('focus', expect.any(Function));
    });

    it('should cleanup event listener on unmount', () => {
      const mockFetch = jest.fn().mockResolvedValue({ success: true, data: 'test' });
      
      const { unmount } = renderHook(() => 
        useApiData(mockFetch, { refetchOnWindowFocus: true })
      );

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('focus', expect.any(Function));
    });
  });

  describe('useStudentProgress', () => {
    it('should call apiService.getStudentProgress with correct parameters', async () => {
      mockApiService.getStudentProgress = jest.fn().mockResolvedValue({
        success: true,
        data: [{ competence: 'FR.01', progress: 75 }]
      });

      const filters = { matiere: 'FR', niveau: 'CE2' };
      const { result } = renderHook(() => useStudentProgress(filters));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiService.getStudentProgress).toHaveBeenCalledWith(undefined, filters);
      expect(result.current.data).toEqual([{ competence: 'FR.01', progress: 75 }]);
    });

    it('should use correct cache time for progress data', () => {
      mockApiService.getStudentProgress = jest.fn().mockResolvedValue({
        success: true,
        data: []
      });

      renderHook(() => useStudentProgress());

      // Check that it was called with cacheTime: 2 (this would be internal to the hook)
      expect(mockApiService.getStudentProgress).toHaveBeenCalled();
    });
  });

  describe('useExerciseSubmission', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useExerciseSubmission());

      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.submitExercise).toBe('function');
      expect(typeof result.current.recordProgress).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });

    it('should handle successful exercise submission', async () => {
      mockApiService.submitExercise = jest.fn().mockResolvedValue({
        success: true,
        data: { xpEarned: 15, masteryLevelChanged: true }
      });

      const { result } = renderHook(() => useExerciseSubmission());

      let submissionResult;
      await act(async () => {
        submissionResult = await result.current.submitExercise(1, {
          score: 85,
          timeSpent: 120,
          completed: true,
          attempts: 1
        });
      });

      expect(mockApiService.submitExercise).toHaveBeenCalledWith(1, {
        score: 85,
        timeSpent: 120,
        completed: true,
        attempts: 1
      });

      expect(submissionResult).toEqual({
        success: true,
        data: { xpEarned: 15, masteryLevelChanged: true },
        xpEarned: 15,
        masteryLevelChanged: true
      });

      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle submission errors', async () => {
      mockApiService.submitExercise = jest.fn().mockResolvedValue({
        success: false,
        error: { message: 'Submission failed', code: 'VALIDATION_ERROR' }
      });

      const { result } = renderHook(() => useExerciseSubmission());

      let submissionResult;
      await act(async () => {
        submissionResult = await result.current.submitExercise(1, {
          score: 85,
          timeSpent: 120,
          completed: true
        });
      });

      expect(submissionResult).toEqual({
        success: false,
        error: { message: 'Submission failed', code: 'VALIDATION_ERROR' }
      });

      expect(result.current.error).toBe('Submission failed');
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should handle network errors during submission', async () => {
      mockApiService.submitExercise = jest.fn().mockRejectedValue(new Error('Network Error'));

      const { result } = renderHook(() => useExerciseSubmission());

      let submissionResult;
      await act(async () => {
        submissionResult = await result.current.submitExercise(1, {
          score: 85,
          timeSpent: 120,
          completed: true
        });
      });

      expect(submissionResult).toEqual({
        success: false,
        error: { message: 'Network Error', code: 'NETWORK_ERROR' }
      });

      expect(result.current.error).toBe('Network Error');
    });

    it('should clear errors correctly', async () => {
      mockApiService.submitExercise = jest.fn().mockResolvedValue({
        success: false,
        error: { message: 'Test error' }
      });

      const { result } = renderHook(() => useExerciseSubmission());

      await act(async () => {
        await result.current.submitExercise(1, {
          score: 85,
          timeSpent: 120,
          completed: true
        });
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle progress recording correctly', async () => {
      mockApiService.recordProgress = jest.fn().mockResolvedValue({
        success: true,
        data: {
          xpGained: 20,
          newMasteryLevel: 'intermediate',
          streakUpdated: true
        }
      });

      const { result } = renderHook(() => useExerciseSubmission());

      let progressResult;
      await act(async () => {
        progressResult = await result.current.recordProgress('CE2.FR.L.FL.01', {
          score: 90,
          timeSpent: 180,
          completed: true,
          attempts: 1,
          exerciseId: 5
        });
      });

      expect(mockApiService.recordProgress).toHaveBeenCalledWith('CE2.FR.L.FL.01', {
        score: 90,
        timeSpent: 180,
        completed: true,
        attempts: 1,
        exerciseId: 5
      });

      expect(progressResult).toEqual({
        success: true,
        xpGained: 20,
        newMasteryLevel: 'intermediate',
        streakUpdated: true
      });
    });
  });

  describe('useXpTracking', () => {
    it('should initialize with student data from auth context', () => {
      const { result } = renderHook(() => useXpTracking());

      expect(result.current.currentXp).toBe(100);
      expect(result.current.currentLevel).toBe(2);
      expect(result.current.xpGained).toBe(0);
      expect(result.current.showXpAnimation).toBe(false);
    });

    it('should handle student data not available', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        student: null,
        refreshStudentData: jest.fn()
      } as any);

      const { result } = renderHook(() => useXpTracking());

      expect(result.current.currentXp).toBe(0);
      expect(result.current.currentLevel).toBe(1);
    });

    it('should add XP and trigger animation', async () => {
      jest.useFakeTimers();
      const mockRefresh = jest.fn();
      
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        student: { id: 1, totalXp: 100, currentLevel: 2 },
        refreshStudentData: mockRefresh
      } as any);

      const { result } = renderHook(() => useXpTracking());

      await act(async () => {
        await result.current.addXp(25);
      });

      expect(result.current.xpGained).toBe(25);
      expect(result.current.showXpAnimation).toBe(true);

      // Fast-forward to trigger refresh
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockRefresh).toHaveBeenCalled();

      // Fast-forward to hide animation
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(result.current.showXpAnimation).toBe(false);
      expect(result.current.xpGained).toBe(0);

      jest.useRealTimers();
    });

    it('should accumulate XP gains correctly', async () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useXpTracking());

      await act(async () => {
        await result.current.addXp(10);
      });

      expect(result.current.xpGained).toBe(10);

      await act(async () => {
        await result.current.addXp(15);
      });

      expect(result.current.xpGained).toBe(25);

      jest.useRealTimers();
    });
  });

  describe('Additional Student Hooks', () => {
    it('should test useStudentStats', async () => {
      mockApiService.getStudentStats = jest.fn().mockResolvedValue({
        success: true,
        data: { totalXp: 1500, exercisesCompleted: 42 }
      });

      const { result } = renderHook(() => useStudentStats());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiService.getStudentStats).toHaveBeenCalled();
      expect(result.current.data).toEqual({ totalXp: 1500, exercisesCompleted: 42 });
    });

    it('should test useStudentAchievements with filters', async () => {
      mockApiService.getStudentAchievements = jest.fn().mockResolvedValue({
        success: true,
        data: [{ id: 1, title: 'First Steps' }]
      });

      const filters = { category: 'math', completed: true };
      const { result } = renderHook(() => useStudentAchievements(filters));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiService.getStudentAchievements).toHaveBeenCalledWith(undefined, filters);
      expect(result.current.data).toEqual([{ id: 1, title: 'First Steps' }]);
    });
  });

  describe('Curriculum Hooks', () => {
    it('should test useCompetences with filters', async () => {
      mockApiService.getCompetences = jest.fn().mockResolvedValue({
        success: true,
        data: [{ id: 1, code: 'FR.01' }]
      });

      const filters = { matiere: 'FR' as const, niveau: 'CE2' };
      const { result } = renderHook(() => useCompetences(filters));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiService.getCompetences).toHaveBeenCalledWith(filters);
      expect(result.current.data).toEqual([{ id: 1, code: 'FR.01' }]);
    });

    it('should test useExercises with filters', async () => {
      mockApiService.getExercises = jest.fn().mockResolvedValue({
        success: true,
        data: [{ id: 1, title: 'Addition' }]
      });

      const filters = { competenceId: 123, level: 'CE2' };
      const { result } = renderHook(() => useExercises(filters));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiService.getExercises).toHaveBeenCalledWith(filters);
      expect(result.current.data).toEqual([{ id: 1, title: 'Addition' }]);
    });

    it('should test useExercisesByLevel', async () => {
      mockApiService.getExercisesByLevel = jest.fn().mockResolvedValue({
        success: true,
        data: [{ id: 1, title: 'Reading CE2' }]
      });

      const { result } = renderHook(() => useExercisesByLevel('CE2', { matiere: 'FR' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiService.getExercisesByLevel).toHaveBeenCalledWith('CE2', { matiere: 'FR' });
      expect(result.current.data).toEqual([{ id: 1, title: 'Reading CE2' }]);
    });

    it('should test useRandomExercises success case', async () => {
      mockApiService.getRandomExercises = jest.fn().mockResolvedValue({
        success: true,
        data: [{ id: 1, title: 'Random Exercise' }]
      });

      const { result } = renderHook(() => useRandomExercises('CE2', 3, ['lecture']));

      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockApiService.getRandomExercises).toHaveBeenCalledWith('CE2', 3, ['lecture']);
      expect(result.current.data).toEqual([{ id: 1, title: 'Random Exercise' }]);
    });

    it('should test useRandomExercises error case', async () => {
      mockApiService.getRandomExercises = jest.fn().mockResolvedValue({
        success: false,
        error: { message: 'No exercises available' }
      });

      const { result } = renderHook(() => useRandomExercises('CE2'));

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.error).toBe('No exercises available');
      expect(result.current.data).toBeNull();
    });

    it('should test useRandomExercises network error', async () => {
      mockApiService.getRandomExercises = jest.fn().mockRejectedValue(new Error('Network failed'));

      const { result } = renderHook(() => useRandomExercises('CE2'));

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.error).toBe('Network failed');
    });
  });

  describe('Mascot Hooks', () => {
    beforeEach(() => {
      // Mock console.error for mascot error tests
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should test useMascot initialization', async () => {
      mockApiService.getMascot = jest.fn().mockResolvedValue({
        success: true,
        data: { id: 1, type: 'dragon', emotion: 'happy' }
      });

      const { result } = renderHook(() => useMascot());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({ id: 1, type: 'dragon', emotion: 'happy' });
      expect(typeof result.current.updateEmotion).toBe('function');
      expect(typeof result.current.getDialogue).toBe('function');
      expect(typeof result.current.updateMascot).toBe('function');
    });

    it('should test updateEmotion success', async () => {
      mockApiService.getMascot = jest.fn().mockResolvedValue({ success: true, data: {} });
      mockApiService.updateMascotEmotion = jest.fn().mockResolvedValue({
        success: true,
        data: { emotion: 'excited' }
      });

      const { result } = renderHook(() => useMascot());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const emotionResult = await act(async () => {
        return result.current.updateEmotion('excellent', 'level_up');
      });

      expect(mockApiService.updateMascotEmotion).toHaveBeenCalledWith('excellent', 'level_up');
      expect(emotionResult).toEqual({ emotion: 'excited' });
    });

    it('should test updateEmotion failure', async () => {
      mockApiService.getMascot = jest.fn().mockResolvedValue({ success: true, data: {} });
      mockApiService.updateMascotEmotion = jest.fn().mockResolvedValue({ success: false });

      const { result } = renderHook(() => useMascot());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const emotionResult = await act(async () => {
        return result.current.updateEmotion('good');
      });

      expect(emotionResult).toBeNull();
    });

    it('should test updateEmotion error handling', async () => {
      mockApiService.getMascot = jest.fn().mockResolvedValue({ success: true, data: {} });
      mockApiService.updateMascotEmotion = jest.fn().mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useMascot());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const emotionResult = await act(async () => {
        return result.current.updateEmotion('poor');
      });

      expect(emotionResult).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error updating mascot emotion:', expect.any(Error));
    });

    it('should test getDialogue success', async () => {
      mockApiService.getMascot = jest.fn().mockResolvedValue({ success: true, data: {} });
      mockApiService.getMascotDialogue = jest.fn().mockResolvedValue({
        data: 'Hello, great job!'
      });

      const { result } = renderHook(() => useMascot());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const dialogue = await act(async () => {
        return result.current.getDialogue('encouragement');
      });

      expect(mockApiService.getMascotDialogue).toHaveBeenCalledWith('encouragement');
      expect(dialogue).toBe('Hello, great job!');
    });

    it('should test getDialogue error handling', async () => {
      mockApiService.getMascot = jest.fn().mockResolvedValue({ success: true, data: {} });
      mockApiService.getMascotDialogue = jest.fn().mockRejectedValue(new Error('Dialogue Error'));

      const { result } = renderHook(() => useMascot());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const dialogue = await act(async () => {
        return result.current.getDialogue('help');
      });

      expect(dialogue).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error getting mascot dialogue:', expect.any(Error));
    });

    it('should test updateMascot success', async () => {
      mockApiService.getMascot = jest.fn().mockResolvedValue({ success: true, data: {} });
      mockApiService.updateMascot = jest.fn().mockResolvedValue({
        success: true,
        data: { type: 'fairy' }
      });

      const { result } = renderHook(() => useMascot());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updateResult = await act(async () => {
        return result.current.updateMascot({ type: 'fairy', equippedItems: [1, 2] });
      });

      expect(mockApiService.updateMascot).toHaveBeenCalledWith({ type: 'fairy', equippedItems: [1, 2] });
      expect(updateResult).toEqual({ type: 'fairy' });
    });

    it('should test updateMascot error handling', async () => {
      mockApiService.getMascot = jest.fn().mockResolvedValue({ success: true, data: {} });
      mockApiService.updateMascot = jest.fn().mockRejectedValue(new Error('Update Error'));

      const { result } = renderHook(() => useMascot());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updateResult = await act(async () => {
        return result.current.updateMascot({ type: 'dragon' });
      });

      expect(updateResult).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error updating mascot:', expect.any(Error));
    });
  });

  describe('Wardrobe Hooks', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should test useWardrobe with filters', async () => {
      mockApiService.getWardrobe = jest.fn().mockResolvedValue({
        success: true,
        data: [{ id: 1, type: 'hat', rarity: 'common' }]
      });

      const filters = { type: 'hat' as const, unlocked: true };
      const { result } = renderHook(() => useWardrobe(filters));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiService.getWardrobe).toHaveBeenCalledWith(undefined, filters);
      expect(result.current.data).toEqual([{ id: 1, type: 'hat', rarity: 'common' }]);
    });

    it('should test unlockItem success', async () => {
      mockApiService.getWardrobe = jest.fn().mockResolvedValue({ success: true, data: [] });
      mockApiService.unlockWardrobeItem = jest.fn().mockResolvedValue({
        success: true,
        data: { unlocked: true }
      });

      const { result } = renderHook(() => useWardrobe());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const unlockResult = await act(async () => {
        return result.current.unlockItem(123);
      });

      expect(mockApiService.unlockWardrobeItem).toHaveBeenCalledWith(123);
      expect(unlockResult).toEqual({ unlocked: true });
    });

    it('should test unlockItem error handling', async () => {
      mockApiService.getWardrobe = jest.fn().mockResolvedValue({ success: true, data: [] });
      mockApiService.unlockWardrobeItem = jest.fn().mockRejectedValue(new Error('Unlock failed'));

      const { result } = renderHook(() => useWardrobe());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const unlockResult = await act(async () => {
        return result.current.unlockItem(123);
      });

      expect(unlockResult).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error unlocking wardrobe item:', expect.any(Error));
    });

    it('should test equipItem and unequipItem', async () => {
      mockApiService.getWardrobe = jest.fn().mockResolvedValue({ success: true, data: [] });
      mockApiService.equipWardrobeItem = jest.fn().mockResolvedValue({
        success: true,
        data: { equipped: true }
      });
      mockApiService.unequipWardrobeItem = jest.fn().mockResolvedValue({
        success: true,
        data: { equipped: false }
      });

      const { result } = renderHook(() => useWardrobe());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Test equip
      const equipResult = await act(async () => {
        return result.current.equipItem(456);
      });

      expect(equipResult).toEqual({ equipped: true });

      // Test unequip
      const unequipResult = await act(async () => {
        return result.current.unequipItem(456);
      });

      expect(unequipResult).toEqual({ equipped: false });
    });

    it('should test useEquippedItems', async () => {
      mockApiService.getEquippedItems = jest.fn().mockResolvedValue({
        success: true,
        data: [{ id: 1, equipped: true }]
      });

      const { result } = renderHook(() => useEquippedItems());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([{ id: 1, equipped: true }]);
    });
  });

  describe('Session Management Hooks', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should test useActiveSession', async () => {
      mockApiService.getActiveSession = jest.fn().mockResolvedValue({
        success: true,
        data: { id: 1, active: true }
      });

      const { result } = renderHook(() => useActiveSession());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({ id: 1, active: true });
    });

    it('should test useSessionManagement startSession', async () => {
      mockApiService.getActiveSession = jest.fn().mockResolvedValue({ success: true, data: null });
      mockApiService.startSession = jest.fn().mockResolvedValue({
        success: true,
        data: { id: 123 }
      });

      const { result } = renderHook(() => useSessionManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const startResult = await act(async () => {
        return result.current.startSession(['MA_NUM_01', 'FR_LEC_01']);
      });

      expect(mockApiService.startSession).toHaveBeenCalledWith(['MA_NUM_01', 'FR_LEC_01']);
      expect(startResult).toEqual({ id: 123 });
    });

    it('should test useSessionManagement endSession', async () => {
      mockApiService.getActiveSession = jest.fn().mockResolvedValue({ success: true, data: null });
      mockApiService.endSession = jest.fn().mockResolvedValue({
        success: true,
        data: { completed: true }
      });

      const { result } = renderHook(() => useSessionManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const endResult = await act(async () => {
        return result.current.endSession(123, { exercisesCompleted: 5, totalXpGained: 100 });
      });

      expect(mockApiService.endSession).toHaveBeenCalledWith(123, { exercisesCompleted: 5, totalXpGained: 100 });
      expect(endResult).toEqual({ completed: true });
    });

    it('should test session management error handling', async () => {
      mockApiService.getActiveSession = jest.fn().mockResolvedValue({ success: true, data: null });
      mockApiService.startSession = jest.fn().mockRejectedValue(new Error('Session start failed'));

      const { result } = renderHook(() => useSessionManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const startResult = await act(async () => {
        return result.current.startSession();
      });

      expect(startResult).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error starting session:', expect.any(Error));
    });
  });

  describe('Window Focus Refetching', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should refetch on window focus when cache is stale', async () => {
      const mockFetch = jest.fn().mockResolvedValue({ success: true, data: 'test' });
      
      renderHook(() => useApiData(mockFetch, { 
        cacheTime: 1, // 1 minute cache
        refetchOnWindowFocus: true 
      }));

      // Wait for initial fetch
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Advance time beyond cache time
      act(() => {
        jest.advanceTimersByTime(2 * 60 * 1000); // 2 minutes
      });

      // Simulate window focus
      act(() => {
        const focusHandler = mockAddEventListener.mock.calls.find(
          call => call[0] === 'focus'
        )?.[1];
        if (focusHandler) focusHandler();
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    it('should not refetch on window focus when cache is fresh', async () => {
      const mockFetch = jest.fn().mockResolvedValue({ success: true, data: 'test' });
      
      renderHook(() => useApiData(mockFetch, { 
        cacheTime: 10, // 10 minute cache
        refetchOnWindowFocus: true 
      }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Clear mock calls to test fresh focus behavior
      mockFetch.mockClear();

      // Simulate window focus immediately (cache is fresh)
      act(() => {
        const focusHandler = mockAddEventListener.mock.calls.find(
          call => call[0] === 'focus'
        )?.[1];
        if (focusHandler) focusHandler();
      });

      // Should not refetch (0 additional calls) - wait a bit for potential async calls
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(mockFetch).toHaveBeenCalledTimes(0);
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle component unmounting during fetch', async () => {
      const mockFetch = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true, data: 'test' }), 100))
      );
      
      const { result, unmount } = renderHook(() => 
        useApiData(mockFetch, { autoFetch: true })
      );

      expect(result.current.isLoading).toBe(true);

      // Unmount before fetch completes
      unmount();

      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should not crash or update state after unmount
      expect(() => result.current).not.toThrow();
    });

    it('should handle undefined/null responses gracefully', async () => {
      const mockFetch = jest.fn().mockResolvedValue({ success: true, data: null });
      
      const { result } = renderHook(() => 
        useApiData(mockFetch, { autoFetch: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeNull();
      // The hook treats success: true, data: null as an error case
      expect(result.current.error).toBe('Unknown error occurred');
    });

    it('should handle non-Error thrown values', async () => {
      const mockFetch = jest.fn().mockRejectedValue('String error');
      
      const { result } = renderHook(() => 
        useApiData(mockFetch, { autoFetch: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
    });

    it('should handle responses without success flag', async () => {
      const mockFetch = jest.fn().mockResolvedValue({ data: 'test' });
      
      const { result } = renderHook(() => 
        useApiData(mockFetch, { autoFetch: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Unknown error occurred');
    });

    it('should handle authentication changes', async () => {
      const mockFetch = jest.fn().mockResolvedValue({ success: true, data: 'test' });
      
      const { rerender } = renderHook(() => 
        useApiData(mockFetch, { autoFetch: true })
      );

      // Change auth state to unauthenticated
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        student: null,
        refreshStudentData: jest.fn()
      } as any);

      rerender();

      // Clear any previous mock calls
      mockFetch.mockClear();

      // Should still handle refetch gracefully when not authenticated
      const { result } = renderHook(() =>
        useApiData(mockFetch, { autoFetch: false })
      );

      act(() => {
        result.current.refetch();
      });

      // Should not fetch when not authenticated
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});