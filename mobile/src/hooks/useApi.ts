import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api';
import cachedApiClient from '../services/cachedApi';
import { Exercise, StudentProgress, StudentStats, Achievement, Competence, Mascot, WardrobeItem } from '../types';

// =============================================================================
// QUERY KEYS
// =============================================================================
const QUERY_KEYS = {
  studentProgress: (filters?: any) => ['studentProgress', filters],
  studentStats: () => ['studentStats'],
  studentAchievements: (filters?: any) => ['studentAchievements', filters],
  competences: (filters?: any) => ['competences', filters],
  exercises: (filters?: any) => ['exercises', filters],
  mascot: () => ['mascot'],
  wardrobe: (filters?: any) => ['wardrobe', filters],
  equippedItems: () => ['equippedItems'],
};

// =============================================================================
// API FETCH FUNCTIONS
// =============================================================================
const fetchStudentProgress = async (filters?: any): Promise<StudentProgress[]> => {
  const { data } = await cachedApiClient.get('/student/progress', { params: filters });
  return data;
};

const fetchStudentStats = async (): Promise<StudentStats> => {
    const { data } = await cachedApiClient.get('/student/stats');
    return data;
};

const fetchStudentAchievements = async (filters?: any): Promise<Achievement[]> => {
    const { data } = await cachedApiClient.get('/student/achievements', { params: filters });
    return data;
};

const fetchCompetences = async (filters?: any): Promise<Competence[]> => {
    const { data } = await cachedApiClient.get('/competences', { params: filters });
    return data;
};

const fetchExercises = async (filters?: any): Promise<Exercise[]> => {
    const { data } = await cachedApiClient.get('/exercises', { params: filters });
    return data;
};

const fetchMascot = async (): Promise<Mascot> => {
    const { data } = await cachedApiClient.get('/mascot');
    return data;
};

const fetchWardrobe = async (filters?: any): Promise<WardrobeItem[]> => {
    const { data } = await cachedApiClient.get('/wardrobe', { params: filters });
    return data;
};

const submitExercise = async (submission: { exerciseId: number, answer: any, timeSpent: number }): Promise<any> => {
    const { data } = await apiClient.post('/exercises/submit', submission);
    return data;
};


// =============================================================================
// STUDENT DATA HOOKS
// =============================================================================
export const useStudentProgress = (filters?: any) => {
  return useQuery<StudentProgress[], Error>({
    queryKey: QUERY_KEYS.studentProgress(filters),
    queryFn: () => fetchStudentProgress(filters),
  });
};

export const useStudentStats = () => {
    return useQuery<StudentStats, Error>({
        queryKey: QUERY_KEYS.studentStats(),
        queryFn: fetchStudentStats,
    });
};

export const useStudentAchievements = (filters?: any) => {
    return useQuery<Achievement[], Error>({
        queryKey: QUERY_KEYS.studentAchievements(filters),
        queryFn: () => fetchStudentAchievements(filters),
    });
};

// =============================================================================
// CURRICULUM & EXERCISES HOOKS
// =============================================================================
export const useCompetences = (filters?: any) => {
    return useQuery<Competence[], Error>({
        queryKey: QUERY_KEYS.competences(filters),
        queryFn: () => fetchCompetences(filters),
    });
};

export const useExercises = (filters?: any) => {
    return useQuery<Exercise[], Error>({
        queryKey: QUERY_KEYS.exercises(filters),
        queryFn: () => fetchExercises(filters),
    });
};

export const useSubmitExercise = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: submitExercise,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studentProgress() });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studentStats() });
        },
    });
};

// =============================================================================
// MASCOT HOOKS
// =============================================================================
export const useMascot = () => {
    return useQuery<Mascot, Error>({
        queryKey: QUERY_KEYS.mascot(),
        queryFn: fetchMascot,
    });
};

// =============================================================================
// WARDROBE HOOKS
// =============================================================================
export const useWardrobe = (filters?: any) => {
    return useQuery<WardrobeItem[], Error>({
        queryKey: QUERY_KEYS.wardrobe(filters),
        queryFn: () => fetchWardrobe(filters),
    });
};
