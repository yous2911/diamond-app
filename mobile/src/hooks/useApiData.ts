import { useState, useEffect, useCallback } from 'react';
import * as studentService from '../services/studentService';
import * as exerciseService from '../services/exerciseService';
import * as leaderboardService from '../services/leaderboardService';

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
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
};

interface MutationState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

export const useApiMutation = <T, P>(mutationFn: (params: P) => Promise<T>) => {
    const [state, setState] = useState<MutationState<T>>({
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

export const useStudentStats = (studentId: string) => {
  return useApiData(() => studentService.getStudent(studentId), [studentId]);
};

export const useExerciseSubmission = () => {
    return useApiMutation((params: { exerciseId: string, answer: any }) =>
        exerciseService.submitExercise(params.exerciseId, params.answer)
    );
};

export const useXpTracking = (studentId: string) => {
  return useApiData(() => studentService.getStudentProgress(studentId), [studentId]);
};

export const useMascot = () => {
    // Mock implementation as no endpoint is defined for mascot
    return useApiData(async () => {
        console.log('Fetching mascot data');
        await new Promise(res => setTimeout(res, 600));
        return {
            name: 'Sparky',
            emotion: 'happy',
        };
    });
};

export const useExercises = (level: string) => {
    return useApiData(() => exerciseService.getExercises(level), [level]);
};

export const useLeaderboard = () => {
    return useApiData(() => leaderboardService.getLeaderboard());
};
