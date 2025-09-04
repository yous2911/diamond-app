// FastRevKids API Service
// Provides interfaces and services for the educational platform

export interface StudentProgress {
  id: number;
  competenceId: string;
  competenceName: string;
  status: 'mastered' | 'learning' | 'not_started' | 'failed';
  progress: number; // 0-100
  timeSpent: number; // minutes
  lastPracticed: Date | null;
  nextReview: Date | null;
  difficulty: number; // 1-5
  attempts: number;
  successes: number;
  repetitionNumber: number;
  easinessFactor: number;
  nextReviewDate: Date | null;
}

export interface StudentStats {
  totalTime: number; // minutes
  totalExercises: number;
  successRate: number; // percentage
  currentStreak: number;
  longestStreak: number;
  achievements: number;
  level: number;
}

export interface Exercise {
  id: string;
  type: 'math' | 'phonics' | 'vocabulary' | 'grammar';
  difficulty: number;
  content: string;
  answer: string;
  options?: string[];
  hints?: string[];
  timeLimit?: number; // seconds
}

export interface LearningSession {
  id: string;
  studentId: string;
  startTime: Date;
  endTime?: Date;
  exercises: Exercise[];
  progress: StudentProgress[];
  score: number;
}

class FastRevKidsApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  }

  // Student Progress Methods
  async getStudentProgress(studentId: string): Promise<StudentProgress[]> {
    try {
      const response = await fetch(`${this.baseUrl}/students/${studentId}/progress`);
      if (!response.ok) throw new Error('Failed to fetch progress');
      return await response.json();
    } catch (error) {
      console.error('Error fetching student progress:', error);
      throw error;
    }
  }

  async updateStudentProgress(progress: Partial<StudentProgress>): Promise<StudentProgress> {
    try {
      const response = await fetch(`${this.baseUrl}/students/progress/${progress.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progress)
      });
      if (!response.ok) throw new Error('Failed to update progress');
      return await response.json();
    } catch (error) {
      console.error('Error updating student progress:', error);
      throw error;
    }
  }

  // Student Stats Methods
  async getStudentStats(studentId: string): Promise<StudentStats> {
    try {
      const response = await fetch(`${this.baseUrl}/students/${studentId}/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return await response.json();
    } catch (error) {
      console.error('Error fetching student stats:', error);
      throw error;
    }
  }

  // Exercise Methods
  async getExercises(competenceId: string, difficulty?: number): Promise<Exercise[]> {
    try {
      const params = new URLSearchParams();
      if (difficulty) params.append('difficulty', difficulty.toString());
      
      const response = await fetch(`${this.baseUrl}/exercises/${competenceId}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch exercises');
      return await response.json();
    } catch (error) {
      console.error('Error fetching exercises:', error);
      throw error;
    }
  }

  async submitExerciseAnswer(exerciseId: string, answer: string, studentId: string): Promise<{
    correct: boolean;
    score: number;
    feedback: string;
    nextReview?: Date;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/exercises/${exerciseId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer, studentId })
      });
      if (!response.ok) throw new Error('Failed to submit answer');
      return await response.json();
    } catch (error) {
      console.error('Error submitting exercise answer:', error);
      throw error;
    }
  }

  // Learning Session Methods
  async startLearningSession(studentId: string, competenceIds: string[]): Promise<LearningSession> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, competenceIds })
      });
      if (!response.ok) throw new Error('Failed to start session');
      return await response.json();
    } catch (error) {
      console.error('Error starting learning session:', error);
      throw error;
    }
  }

  async endLearningSession(sessionId: string, finalProgress: StudentProgress[]): Promise<{
    session: LearningSession;
    achievements: string[];
    xpGained: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalProgress })
      });
      if (!response.ok) throw new Error('Failed to end session');
      return await response.json();
    } catch (error) {
      console.error('Error ending learning session:', error);
      throw error;
    }
  }

  // Authentication Methods
  async loginStudent(username: string, password: string): Promise<{
    token: string;
    student: {
      id: string;
      name: string;
      level: number;
      avatar?: string;
    };
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!response.ok) throw new Error('Login failed');
      return await response.json();
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }

  async logoutStudent(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }

  // Utility Methods
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Error handling
  private handleError(error: any, context: string): never {
    console.error(`Error in ${context}:`, error);
    throw new Error(`Failed to ${context}: ${error.message}`);
  }
}

// Export singleton instance
export const fastrevkidsApiService = new FastRevKidsApiService();

// Types are already exported above with interface declarations
