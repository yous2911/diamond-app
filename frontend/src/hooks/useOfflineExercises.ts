/**
 * useOfflineExercises Hook
 * React hook for fetching exercises with automatic offline support and SuperMemo integration
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { offlineApiWrapper } from '../services/offline/offlineApiWrapper';

interface UseOfflineExercisesOptions {
  competenceId?: number;
  level?: string;
  type?: string;
  difficulty?: string;
  limit?: number;
  autoFetch?: boolean;
}

export const useOfflineExercises = (options: UseOfflineExercisesOptions = {}) => {
  const { student, isAuthenticated } = useAuth();
  const [exercises, setExercises] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const fetchExercises = useCallback(async () => {
    if (!isAuthenticated || !student?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await offlineApiWrapper.getExercises(student.id, {
        competenceId: options.competenceId,
        level: options.level,
        type: options.type,
        difficulty: options.difficulty,
        limit: options.limit,
      });

      if (response.success && response.data) {
        setExercises(response.data.items || []);
        setFromCache(response.fromCache || false);
      } else {
        setError(response.error?.message || 'Failed to fetch exercises');
        setExercises([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setExercises([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    isAuthenticated,
    student?.id,
    options.competenceId,
    options.level,
    options.type,
    options.difficulty,
    options.limit,
  ]);

  useEffect(() => {
    if (options.autoFetch !== false && isAuthenticated && student?.id) {
      fetchExercises();
    }
  }, [fetchExercises, options.autoFetch, isAuthenticated, student?.id]);

  return {
    exercises,
    isLoading,
    error,
    fromCache,
    refetch: fetchExercises,
  };
};

export default useOfflineExercises;

