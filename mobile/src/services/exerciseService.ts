import apiClient from './api';
import { Exercise } from '../types/exercise';

export const getExercises = async (level: string): Promise<Exercise[]> => {
  const response = await apiClient.get(`/exercises?level=${level}`);
  return response.data;
};

export const submitExercise = async (exerciseId: string, answer: any): Promise<{ correct: boolean; xpGained: number }> => {
    const response = await apiClient.post(`/exercises/${exerciseId}/submit`, { answer });
    return response.data;
};
