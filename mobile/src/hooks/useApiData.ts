import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';
import { Exercise } from '../types/exercise';
import { User } from '../types/auth';

// --- Generic API Hooks ---

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const useApiData = <T>(apiCall: () => Promise<T>, deps: any[] = []) => {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((prevState) => ({ ...prevState, loading: true, error: null }));
    try {
      const data = await apiCall();
      setState({ data, loading: false, error: null });
    } catch (err: any) {
      setState({ data: null, loading: false, error: err.message || 'An error occurred' });
    }
  }, deps);

  useEffect(() => {
    if (deps.every(dep => dep !== undefined && dep !== null && dep !== '')) {
        fetchData();
    }
  }, [fetchData]);

  return { ...state, refetch: fetchData };
};

export const useApiMutation = <T, P>(mutationFn: (params: P) => Promise<T>) => {
    const [state, setState] = useState<ApiState<T>>({
        data: null,
        loading: false,
        error: null,
    });

    const mutate = async (params: P) => {
        setState({ data: null, loading: true, error: null });
        try {
            const data = await mutationFn(params);
            setState({ data, loading: false, error: null });
            return data;
        } catch (err: any) {
            setState({ data: null, loading: false, error: err.message || 'An error occurred' });
            throw err;
        }
    };

    return { ...state, mutate };
};


// --- Specific Hooks ---

export const useStudentStats = (studentId: string) => {
  return useApiData<any>(() => apiClient.get(`/students/${studentId}`).then(res => res.data), [studentId]);
};

export const useXpTracking = (studentId: string) => {
    return useApiData<any>(() => apiClient.get(`/progress/${studentId}`).then(res => res.data), [studentId]);
};

export const useMascot = () => {
    // Mock implementation as no endpoint is defined for mascot
    return useApiData(async () => {
        await new Promise(res => setTimeout(res, 100));
        return { name: 'Sparky', emotion: 'happy' };
    });
};

export const useExercises = (level: string) => {
    return useApiData<Exercise[]>(() => apiClient.get(`/exercises?level=${level}`).then(res => res.data), [level]);
};

export const useExerciseSubmission = () => {
    return useApiMutation((params: { exerciseId: string, answer: any }) =>
        apiClient.post(`/exercises/${params.exerciseId}/submit`, { answer: params.answer }).then(res => res.data)
    );
};

// --- Mocked Hooks for missing endpoints ---

export const useCompetences = () => {
    return useApiData(async () => {
        await new Promise(res => setTimeout(res, 100));
        return [];
    });
};

export const useExercisesByLevel = (level: string) => {
    return useExercises(level);
};

export const useSessionManagement = () => {
    return {
        startSession: async () => console.log('Session started'),
        endSession: async () => console.log('Session ended'),
        data: { hasActiveSession: false, session: null },
    };
};
