/**
 * Offline API Wrapper
 * Wraps API calls to handle offline mode automatically
 */

import { networkDetector } from './networkDetector';
import { offlineStorage } from './offlineStorage';
import { createOfflineQueue } from './offlineQueue';
import { apiService } from '../api';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3003/api';
const offlineQueue = createOfflineQueue(baseURL);

// Cache window: preload exercises due in next 7 days
const CACHE_WINDOW_DAYS = 7;

interface OfflineApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message: string; code: string };
  fromCache?: boolean;
}

class OfflineApiWrapper {
  private isInitialized = false;

  async init() {
    if (this.isInitialized) return;
    
    await offlineStorage.init();
    
    // Listen to network changes
    networkDetector.subscribe((isOnline) => {
      if (isOnline) {
        this.syncWhenOnline();
      }
    });

    this.isInitialized = true;
  }

  private async syncWhenOnline() {
    const results = await offlineQueue.processQueue();
    if (results.success > 0 || results.failed > 0) {
      console.log(`Synced ${results.success} requests, ${results.failed} failed`);
    }
  }

  async getExercises(
    studentId: number,
    filters?: {
      competenceId?: number;
      level?: string;
      type?: string;
      difficulty?: string;
      limit?: number;
    }
  ): Promise<OfflineApiResponse<any>> {
    await this.init();
    const isOnline = networkDetector.getOnlineStatus();

    if (isOnline) {
      try {
        // Use recommended exercises endpoint that uses SuperMemo
        const response = await fetch(
          `${baseURL}/students/${studentId}/recommended-exercises?limit=${filters?.limit || 20}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const exercises = data.data.exercises || data.data || [];
            
            // Extract SuperMemo metadata if available
            const superMemoMap = new Map();
            if (data.data.superMemoData) {
              data.data.superMemoData.forEach((sm: any) => {
                superMemoMap.set(sm.exerciseId, {
                  nextReviewDate: new Date(sm.nextReviewDate),
                  easinessFactor: sm.easinessFactor,
                  repetitionNumber: sm.repetitionNumber,
                  priority: sm.priority,
                });
              });
            }
            
            // Cache exercises with SuperMemo metadata
            await offlineStorage.cacheExercises(exercises, studentId, superMemoMap);
            
            return {
              success: true,
              data: { items: exercises, total: exercises.length },
              fromCache: false,
            };
          }
        }
        
        // Fallback to regular exercises endpoint
        const fallbackResponse = await apiService.getExercises(filters);
        if (fallbackResponse.success && fallbackResponse.data) {
          await offlineStorage.cacheExercises(
            fallbackResponse.data.items || [],
            studentId
          );
          return { ...fallbackResponse, fromCache: false };
        }
        return fallbackResponse;
      } catch (error) {
        // Fallback to cache on error
        return this.getExercisesFromCache(studentId, filters);
      }
    } else {
      return this.getExercisesFromCache(studentId, filters);
    }
  }

  private async getExercisesFromCache(
    studentId: number,
    filters?: {
      competenceId?: number;
      level?: string;
    }
  ): Promise<OfflineApiResponse<any>> {
    const cached = await offlineStorage.getCachedExercises(
      studentId,
      filters?.competenceId,
      filters?.level
    );
    
    if (cached.length > 0) {
      return {
        success: true,
        data: { items: cached, total: cached.length },
        fromCache: true,
      };
    }

    return {
      success: false,
      error: {
        message: 'Aucun exercice en cache disponible pour révision',
        code: 'NO_CACHE',
      },
      fromCache: true,
    };
  }

  async getCompetences(filters?: {
    matiere?: 'FR' | 'MA';
    niveau?: string;
  }): Promise<OfflineApiResponse<any>> {
    await this.init();
    const isOnline = networkDetector.getOnlineStatus();

    if (isOnline) {
      try {
        const response = await apiService.getCompetences(filters);
        if (response.success && response.data) {
          await offlineStorage.cacheCompetences(response.data);
          return { ...response, fromCache: false };
        }
        return response;
      } catch (error) {
        return this.getCompetencesFromCache();
      }
    } else {
      return this.getCompetencesFromCache();
    }
  }

  private async getCompetencesFromCache(): Promise<OfflineApiResponse<any>> {
    const cached = await offlineStorage.getCachedCompetences();
    
    if (cached.length > 0) {
      return {
        success: true,
        data: cached,
        fromCache: true,
      };
    }

    return {
      success: false,
      error: {
        message: 'No cached competences available',
        code: 'NO_CACHE',
      },
      fromCache: true,
    };
  }

  async submitExercise(
    exerciseId: number,
    result: {
      score: number;
      timeSpent: number;
      completed: boolean;
      attempts?: number;
      hintsUsed?: number;
      answerGiven?: string;
    }
  ): Promise<OfflineApiResponse<any>> {
    await this.init();
    const isOnline = networkDetector.getOnlineStatus();

    if (isOnline) {
      try {
        return await apiService.submitExercise(exerciseId, result);
      } catch (error) {
        // Queue for later
        await offlineQueue.addRequest(
          `/exercises/attempt`,
          'POST',
          {
            exerciseId: exerciseId.toString(),
            score: result.score.toString(),
            completed: result.completed.toString(),
            timeSpent: result.timeSpent.toString(),
            answers: result.answerGiven || '',
          },
          undefined,
          'high'
        );

        return {
          success: true,
          data: {
            attempt: null,
            xpEarned: 0,
            queued: true,
          },
          fromCache: false,
        };
      }
    } else {
      // Queue for later
      await offlineQueue.addRequest(
        `/exercises/attempt`,
        'POST',
        {
          exerciseId: exerciseId.toString(),
          score: result.score.toString(),
          completed: result.completed.toString(),
          timeSpent: result.timeSpent.toString(),
          answers: result.answerGiven || '',
        },
        undefined,
        'high'
      );

      return {
        success: true,
        data: {
          attempt: null,
          xpEarned: 0,
          queued: true,
        },
        fromCache: false,
      };
    }
  }

  /**
   * Preload exercises for offline mode based on SuperMemo schedule
   * Should be called when online to prepare cache for next 7 days
   */
  async preloadExercisesForOffline(studentId: number): Promise<void> {
    await this.init();
    const isOnline = networkDetector.getOnlineStatus();
    
    if (!isOnline) return; // Only preload when online

    try {
      // Calculate date range for preloading
      const now = new Date();
      const futureDate = new Date(now.getTime() + CACHE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
      
      // Fetch recommended exercises (uses SuperMemo)
      // Increase limit to ensure enough exercises for 7 days offline
      const response = await fetch(
        `${baseURL}/students/${studentId}/recommended-exercises?limit=100`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const exercises = data.data.exercises || data.data || [];
          
          // Also fetch SuperMemo data for these exercises
          const superMemoResponse = await fetch(
            `${baseURL}/students/${studentId}/spaced-repetition`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
            }
          );

          const superMemoMap = new Map();
          if (superMemoResponse.ok) {
            const smData = await superMemoResponse.json();
            if (smData.success && smData.data) {
              smData.data.forEach((sm: any) => {
                const nextReview = new Date(sm.nextReviewDate);
                // Only cache exercises due within cache window
                if (nextReview <= futureDate) {
                  superMemoMap.set(sm.exerciseId, {
                    nextReviewDate: nextReview,
                    easinessFactor: parseFloat(sm.easinessFactor),
                    repetitionNumber: sm.repetitionNumber,
                    priority: sm.priority || 'normal',
                  });
                }
              });
            }
          }

          // Cache exercises with SuperMemo metadata
          await offlineStorage.cacheExercises(exercises, studentId, superMemoMap);
          
          // Count exercises due today (available offline)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dueToday = exercises.filter((ex: any) => {
            const sm = superMemoMap.get(ex.id);
            if (!sm) return false;
            const nextReview = new Date(sm.nextReviewDate);
            nextReview.setHours(0, 0, 0, 0);
            return nextReview <= today;
          }).length;
          
          console.log(`Preloaded ${exercises.length} exercises (${dueToday} available offline today)`);
        }
      }
    } catch (error) {
      console.error('Failed to preload exercises for offline:', error);
    }
  }

  async getStudentProgress(
    studentId: number,
    filters?: {
      matiere?: string;
      niveau?: string;
      masteryLevel?: string;
    }
  ): Promise<OfflineApiResponse<any>> {
    await this.init();
    const isOnline = networkDetector.getOnlineStatus();

    if (isOnline) {
      try {
        const response = await apiService.getStudentProgress(undefined, filters);
        if (response.success && response.data) {
          await offlineStorage.cacheProgress(response.data.competenceProgress || []);
          return { ...response, fromCache: false };
        }
        return response;
      } catch (error) {
        return this.getProgressFromCache();
      }
    } else {
      return this.getProgressFromCache();
    }
  }

  private async getProgressFromCache(): Promise<OfflineApiResponse<any>> {
    const cached = await offlineStorage.getCachedProgress();
    
    if (cached.length > 0) {
      return {
        success: true,
        data: {
          competenceProgress: cached,
          summary: {},
        },
        fromCache: true,
      };
    }

    return {
      success: false,
      error: {
        message: 'No cached progress available',
        code: 'NO_CACHE',
      },
      fromCache: true,
    };
  }

  getQueueLength(): number {
    return offlineQueue.getQueueLength();
  }

  async syncQueue(): Promise<{ success: number; failed: number }> {
    return offlineQueue.processQueue();
  }
}

export const offlineApiWrapper = new OfflineApiWrapper();
export default offlineApiWrapper;

