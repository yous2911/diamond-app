import { useState, useEffect } from 'react';
import { StudentProgress } from '../services/fastrevkids-api.service';

// Mock data for development - replace with actual API calls
const MOCK_PROGRESS_DATA: StudentProgress[] = [
  {
    id: '1',
    studentId: 'student-1',
    competenceId: 'math-basics',
    competenceName: 'Mathématiques de Base',
    status: 'mastered',
    progress: 100,
    timeSpent: 45,
    lastPracticed: new Date('2024-01-15'),
    nextReview: new Date('2024-01-22'),
    difficulty: 3,
    attempts: 12,
    successes: 12,
    repetitionNumber: 5,
    easinessFactor: 2.5
  },
  {
    id: '2',
    studentId: 'student-1',
    competenceId: 'french-phonics',
    competenceName: 'Phonétique Française',
    status: 'learning',
    progress: 75,
    timeSpent: 30,
    lastPracticed: new Date('2024-01-14'),
    nextReview: new Date('2024-01-16'),
    difficulty: 2,
    attempts: 8,
    successes: 6,
    repetitionNumber: 2,
    easinessFactor: 1.8
  },
  {
    id: '3',
    studentId: 'student-1',
    competenceId: 'vocabulary',
    competenceName: 'Vocabulaire',
    status: 'not_started',
    progress: 0,
    timeSpent: 0,
    lastPracticed: undefined,
    nextReview: undefined,
    difficulty: 1,
    attempts: 0,
    successes: 0,
    repetitionNumber: 0,
    easinessFactor: 2.5
  }
];

const MOCK_STATS_DATA = {
  stats: {
    totalTime: 75,
    totalExercises: 20,
    successRate: 85,
    currentStreak: 5,
    longestStreak: 12,
    achievements: 8,
    level: 3
  }
};

// Hook for student progress data
export const useStudentProgress = () => {
  const [data, setData] = useState<StudentProgress[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setIsLoading(true);
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // In a real implementation, this would call your backend API
        // const response = await fetch('/api/students/progress');
        // const data = await response.json();
        
        setData(MOCK_PROGRESS_DATA);
        setError(null);
      } catch (err) {
        setError('Failed to load progress data');
        console.error('Error fetching progress:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, []);

  return { data, isLoading, error };
};

// Hook for student statistics
export const useStudentStats = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // In a real implementation, this would call your backend API
        // const response = await fetch('/api/students/stats');
        // const data = await response.json();
        
        setData(MOCK_STATS_DATA);
        setError(null);
      } catch (err) {
        setError('Failed to load stats data');
        console.error('Error fetching stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { data, isLoading, error };
};

// Hook for updating student progress
export const useUpdateProgress = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProgress = async (competenceId: string, newProgress: Partial<StudentProgress>) => {
    try {
      setIsUpdating(true);
      setError(null);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, this would call your backend API
      // const response = await fetch(`/api/students/progress/${competenceId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newProgress)
      // });
      // const data = await response.json();
      
      return { success: true };
    } catch (err) {
      const errorMessage = 'Failed to update progress';
      setError(errorMessage);
      console.error('Error updating progress:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateProgress, isUpdating, error };
};
