/**
 * PARENT DASHBOARD API SERVICE
 * Connects the frontend parent dashboard to the backend analytics API
 * Provides real-time data fetching for parent insights
 */

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3003/api';

export interface ChildData {
  id: number;
  name: string;
  age: number;
  level: string;
  avatar: string;
  totalXP: number;
  currentStreak: number;
  completedExercises: number;
  masteredCompetencies: number;
  currentLevel: number;
  lastActivity: string;
}

export interface ChildAnalytics {
  weeklyProgress: number[];
  recentAchievements: Array<{
    id: number;
    title: string;
    icon: string;
    date: string;
    color: string;
  }>;
  competencyProgress: Array<{
    domain: string;
    progress: number;
    total: number;
    mastered: number;
  }>;
  learningPattern: {
    bestTime: string;
    averageSession: string;
    preferredSubject: string;
    difficultyTrend: string;
  };
}

export interface SuperMemoStats {
  retention: number;
  averageInterval: number;
  stabilityIndex: number;
  retrievalStrength: number;
  totalReviews: number;
  successRate: number;
}

export interface ProgressReport {
  childId: number;
  period: string;
  generatedAt: string;
  summary: {
    totalLearningTime: string;
    exercisesCompleted: number;
    competenciesImproved: number;
    averageScore: number;
    streakRecord: number;
  };
  achievements: Array<{
    type: string;
    description: string;
  }>;
  recommendations: string[];
}

class ParentApiService {
  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get all children for a parent
   */
  async getChildren(parentId: number): Promise<ChildData[]> {
    return this.fetchWithAuth(`/api/parents/children/${parentId}`);
  }

  /**
   * Get detailed analytics for a specific child
   */
  async getChildAnalytics(
    childId: number, 
    timeframe: 'week' | 'month' | 'year' = 'week'
  ): Promise<ChildAnalytics> {
    return this.fetchWithAuth(`/api/parents/analytics/${childId}?timeframe=${timeframe}`);
  }

  /**
   * Get SuperMemo algorithm performance stats
   */
  async getSuperMemoStats(childId: number, days: number = 30): Promise<SuperMemoStats> {
    return this.fetchWithAuth(`/api/parents/supermemo/${childId}?days=${days}`);
  }

  /**
   * Generate detailed progress report
   */
  async getProgressReport(
    childId: number,
    format: 'json' | 'pdf' | 'email' = 'json',
    period: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<ProgressReport> {
    return this.fetchWithAuth(`/api/parents/report/${childId}?format=${format}&period=${period}`);
  }

  /**
   * Real-time data fetching with caching
   */
  private cache = new Map<string, { data: any; timestamp: number }>();
  private CACHE_DURATION = 30000; // 30 seconds

  async getCachedData<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data as T;
    }

    const data = await fetcher();
    this.cache.set(key, { data, timestamp: now });
    return data;
  }

  /**
   * Clear cache for fresh data
   */
  clearCache(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

export const parentApi = new ParentApiService();