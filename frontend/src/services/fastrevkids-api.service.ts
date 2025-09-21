// FastRevKids API Service
// This service handles all API calls for the FastRevKids application

export interface StudentProgress {
  id: string;
  studentId: string;
  competenceId: string;
  competenceName: string;
  status: 'mastered' | 'learning' | 'not_started' | 'struggling' | 'failed';
  difficulty: number;
  attempts: number;
  successes: number;
  progress: number; // percentage 0-100
  timeSpent: number; // in minutes
  lastPracticed?: Date;
  repetitionNumber?: number;
  easinessFactor?: number;
  nextReview?: Date;
}

export interface StudentStats {
  id: string;
  name: string;
  level: number;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  totalExercises: number;
  averageAccuracy: number;
  totalTimeSpent: number;
  achievements: string[];
  lastLogin: Date;
}

export interface ExerciseResult {
  exerciseId: string;
  studentId: string;
  correct: boolean;
  timeSpent: number;
  attempts: number;
  timestamp: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class FastRevKidsApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3003/api';
  }

  // Student Progress Methods
  async getStudentProgress(studentId: string): Promise<ApiResponse<StudentProgress[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/students/${studentId}/progress`);
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateStudentProgress(progress: Partial<StudentProgress>): Promise<ApiResponse<StudentProgress>> {
    try {
      const response = await fetch(`${this.baseUrl}/students/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progress),
      });
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Student Stats Methods
  async getStudentStats(studentId: string): Promise<ApiResponse<StudentStats>> {
    try {
      const response = await fetch(`${this.baseUrl}/students/${studentId}/stats`);
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateStudentStats(stats: Partial<StudentStats>): Promise<ApiResponse<StudentStats>> {
    try {
      const response = await fetch(`${this.baseUrl}/students/stats`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stats),
      });
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Exercise Methods
  async submitExerciseResult(result: ExerciseResult): Promise<ApiResponse<ExerciseResult>> {
    try {
      const response = await fetch(`${this.baseUrl}/exercises/result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      });
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getExercises(subject?: string, level?: number): Promise<ApiResponse<any[]>> {
    try {
      const params = new URLSearchParams();
      if (subject) params.append('subject', subject);
      if (level) params.append('level', level.toString());
      
      const response = await fetch(`${this.baseUrl}/exercises?${params}`);
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Authentication Methods
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async register(userData: any): Promise<ApiResponse<{ token: string; user: any }>> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Utility Methods
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async makeAuthenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Export singleton instance
export const fastRevKidsApi = new FastRevKidsApiService();
export default fastRevKidsApi;
