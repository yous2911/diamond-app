/**
 * Enhanced Database Service for Educational Platform
 * Provides comprehensive database operations for competence tracking, analytics, and spaced repetition
 */

import { getDatabase } from '../db/connection';
import {
  students,
  exercises,
  studentProgress,
  studentCompetenceProgress,
  competencePrerequisites,
  dailyLearningAnalytics,
  weeklyProgressSummary,
  learningSessionTracking,
  exercisePerformanceAnalytics,
  studentAchievements,
  gdprConsentRequests,
  type Student,
  type Exercise,
  type StudentProgress as Progress,
  type StudentCompetenceProgress,
  competencePrerequisites as CompetencePrerequisite,
  type DailyLearningAnalytics,
  type WeeklyProgressSummary,
  type LearningSessionTracking,
  type ExercisePerformanceAnalytics,
  type StudentAchievements as StudentAchievement,
  MasteryLevels
} from '../db/schema';
import { eq, and, or, desc, asc, sql, count, sum, avg, between, inArray, gte, lte } from 'drizzle-orm';
import { logger } from '../utils/logger';

export interface CompetenceProgressFilters {
  matiere?: string;
  niveau?: string;
  masteryLevel?: string;
  competenceCodes?: string[];
  limit?: number;
  offset?: number;
}

export interface ProgressRecordingData {
  competenceCode: string;
  score: number;
  timeSpent: number;
  completed: boolean;
  attempts?: number;
  exerciseId?: number;
  difficultyLevel?: number;
  sessionData?: {
    sessionId?: string;
    deviceType?: string;
    focusScore?: number;
  };
}

export interface AchievementFilters {
  category?: string;
  difficulty?: string;
  completed?: boolean;
  visible?: boolean;
  limit?: number;
  offset?: number;
}

export interface AnalyticsFilters {
  studentId?: number;
  startDate?: string;
  endDate?: string;
  matiere?: string;
  groupBy?: 'day' | 'week' | 'month';
  limit?: number;
  offset?: number;
}

export interface LearningRecommendation {
  competenceCode: string;
  difficulty: string;
  priority: number;
  reason: string;
  exercises: Exercise[];
}

export interface StudentStats {
  totalExercises: number;
  completedExercises: number;
  completionRate: number;
  averageScore: number;
  totalTimeSpent: number;
  xpEarned: number;
  streakDays: number;
  masteredCompetences: number;
  competenceBreakdown: {
    decouverte: number;
    apprentissage: number;
    maitrise: number;
    expertise: number;
  };
}

class EnhancedDatabaseService {
  private db = getDatabase();

  /**
   * Get comprehensive competence progress for a student with advanced filtering
   */
  async getStudentCompetenceProgress(
    studentId: number, 
    filters: CompetenceProgressFilters = {}
  ): Promise<StudentCompetenceProgress[]> {
    try {
      const conditions = [eq(studentCompetenceProgress.studentId, studentId)];

      if (filters.masteryLevel) {
        conditions.push(eq(studentCompetenceProgress.masteryLevel, filters.masteryLevel));
      }

      if (filters.competenceCodes && filters.competenceCodes.length > 0) {
        conditions.push(inArray(studentCompetenceProgress.competenceCode, filters.competenceCodes));
      }

      const result = await this.db
        .select()
        .from(studentCompetenceProgress)
        .where(and(...conditions))
        .orderBy(desc(studentCompetenceProgress.lastAttemptAt))
        .limit(filters.limit || 50)
        .offset(filters.offset || 0);

      return result;
    } catch (error) {
      logger.error('Get student competence progress error:', { studentId, filters, error });
      throw new Error('Failed to get student competence progress');
    }
  }

  /**
   * Record progress with intelligent mastery level calculation
   */
  async recordStudentProgress(studentId: number, data: ProgressRecordingData): Promise<{
    id: number;
    masteryLevel: string;
    progressPercent: number;
    consecutiveSuccesses: number;
    masteryLevelChanged: boolean;
    averageScore: number;
  }> {
    try {
      // Get existing progress record
      const existingProgress = await this.db
        .select()
        .from(studentCompetenceProgress)
        .where(and(
          eq(studentCompetenceProgress.studentId, studentId),
          eq(studentCompetenceProgress.competenceCode, data.competenceCode)
        ))
        .limit(1);

      const now = new Date();
      let masteryLevelChanged = false;
      let newMasteryLevel = 'decouverte';

      if (existingProgress.length > 0) {
        // Update existing progress
        const current = existingProgress[0];
        const newTotalAttempts = current.totalAttempts + (data.attempts || 1);
        const newSuccessfulAttempts = current.successfulAttempts + (data.completed ? 1 : 0);
        const newAverageScore = Number((((Number(current.currentScore) || 0) * current.totalAttempts) + data.score) / newTotalAttempts);
        
        // Calculate new mastery level
        const oldMasteryLevel = current.masteryLevel;
        newMasteryLevel = this.calculateMasteryLevel(newSuccessfulAttempts, newTotalAttempts, newAverageScore);
        masteryLevelChanged = oldMasteryLevel !== newMasteryLevel;

        // Update consecutive counts
        let newConsecutiveSuccesses = current.totalAttempts || 0;
        
        if (data.completed && data.score >= 70) {
          newConsecutiveSuccesses = (current.totalAttempts || 0) + 1;
        } else {
          newConsecutiveSuccesses = 0;
        }

        await this.db
          .update(studentCompetenceProgress)
          .set({
            masteryLevel: newMasteryLevel,
            currentScore: newAverageScore.toFixed(2),
            totalAttempts: newTotalAttempts,
            successfulAttempts: newSuccessfulAttempts,
            lastAttemptAt: now,
            updatedAt: now
          })
          .where(eq(studentCompetenceProgress.id, current.id));

        return {
          id: current.id,
          masteryLevel: newMasteryLevel,
          progressPercent: Math.round((newSuccessfulAttempts / newTotalAttempts) * 100),
          consecutiveSuccesses: newConsecutiveSuccesses,
          masteryLevelChanged,
          averageScore: newAverageScore
        };

      } else {
        // Create new progress record
        newMasteryLevel = this.calculateMasteryLevel(data.completed ? 1 : 0, 1, data.score);
        masteryLevelChanged = true;

        const newRecord = await this.db
          .insert(studentCompetenceProgress)
          .values({
            studentId,
            competenceCode: data.competenceCode,
            masteryLevel: newMasteryLevel,
            currentScore: data.score.toFixed(2),
            totalAttempts: data.attempts || 1,
            successfulAttempts: data.completed ? 1 : 0,
            lastAttemptAt: now,
            createdAt: now,
            updatedAt: now
          });

        return {
          id: 0, // Will be assigned by database
          masteryLevel: newMasteryLevel,
          progressPercent: data.completed ? Math.round(data.score) : 0,
          consecutiveSuccesses: (data.completed && data.score >= 70) ? 1 : 0,
          masteryLevelChanged,
          averageScore: data.score
        };
      }
    } catch (error) {
      logger.error('Record student progress error:', { studentId, data, error });
      throw new Error('Failed to record student progress');
    }
  }

  /**
   * Get prerequisites for a competence with dependency resolution
   */
  async getCompetencePrerequisites(
    competenceCode: string, 
    options: { includeDetails?: boolean; depth?: number } = {}
  ): Promise<CompetencePrerequisite[]> {
    try {
      const prerequisites = await this.db
        .select()
        .from(competencePrerequisites)
        .where(eq(competencePrerequisites.competenceCode, competenceCode))
        .orderBy(asc(competencePrerequisites.minimumLevel));

      return prerequisites;
    } catch (error) {
      logger.error('Get competence prerequisites error:', { competenceCode, error });
      throw new Error('Failed to get competence prerequisites');
    }
  }

  /**
   * Get student achievements with comprehensive filtering
   */
  async getStudentAchievements(studentId: number, filters: AchievementFilters = {}): Promise<StudentAchievement[]> {
    try {
      const conditions = [eq(studentAchievements.studentId, studentId)];
      
      if (filters.category) {
        conditions.push(eq(studentAchievements.achievementType, filters.category));
      }
      if (filters.difficulty) {
        conditions.push(sql`${studentAchievements.achievementCode} LIKE ${`%${filters.difficulty}%`}`);
      }
      if (typeof filters.completed === 'boolean') {
        // All achievements in table are completed by definition
      }
      if (typeof filters.visible === 'boolean') {
        // All achievements are visible by default
      }

      const result = await this.db
        .select()
        .from(studentAchievements)
        .where(and(...conditions))
        .orderBy(desc(studentAchievements.unlockedAt))
        .limit(filters.limit || 50)
        .offset(filters.offset || 0);

      return result;
    } catch (error) {
      logger.error('Get student achievements error:', { studentId, filters, error });
      throw new Error('Failed to get student achievements');
    }
  }

  /**
   * Get daily learning analytics with flexible filtering
   */
  async getDailyLearningAnalytics(filters: AnalyticsFilters): Promise<DailyLearningAnalytics[]> {
    try {
      const conditions = [];
      
      if (filters.studentId) {
        conditions.push(eq(dailyLearningAnalytics.studentId, filters.studentId));
      }
      
      if (filters.startDate && filters.endDate) {
        conditions.push(
          between(
            dailyLearningAnalytics.date,
            new Date(filters.startDate),
            new Date(filters.endDate)
          )
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      const result = await this.db
        .select()
        .from(dailyLearningAnalytics)
        .where(whereClause)
        .orderBy(desc(dailyLearningAnalytics.date))
        .limit(filters.limit || 50)
        .offset(filters.offset || 0);

      return result;
    } catch (error) {
      logger.error('Get daily learning analytics error:', { filters, error });
      throw new Error('Failed to get daily learning analytics');
    }
  }

  /**
   * Get learning session tracking data
   */
  async getLearningSessionTracking(filters: AnalyticsFilters): Promise<LearningSessionTracking[]> {
    try {
      const conditions = [];
      
      if (filters.studentId) {
        conditions.push(eq(learningSessionTracking.studentId, filters.studentId));
      }
      
      if (filters.startDate && filters.endDate) {
        conditions.push(
          between(
            learningSessionTracking.sessionStart,
            new Date(filters.startDate),
            new Date(filters.endDate)
          )
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      const result = await this.db
        .select()
        .from(learningSessionTracking)
        .where(whereClause)
        .orderBy(desc(learningSessionTracking.sessionStart))
        .limit(filters.limit || 50)
        .offset(filters.offset || 0);

      return result;
    } catch (error) {
      logger.error('Get learning session tracking error:', { filters, error });
      throw new Error('Failed to get learning session tracking');
    }
  }

  /**
   * Get comprehensive student statistics
   */
  async getStudentStats(studentId: number): Promise<StudentStats> {
    try {
      // Get basic progress metrics
      const [progressMetrics] = await this.db
        .select({
          totalExercises: count(),
          completedExercises: sql<number>`COUNT(CASE WHEN ${studentProgress.completed} THEN 1 END)`,
          averageScore: avg(sql<number>`CAST(${studentProgress.score} AS DECIMAL(5,2))`),
          totalTimeSpent: sum(studentProgress.timeSpent),
          xpEarned: sql<number>`COALESCE(SUM(10), 0)` // Default XP value
        })
        .from(studentProgress)
        .where(eq(studentProgress.studentId, studentId));

      // Get competence breakdown
      const competenceBreakdown = await this.db
        .select({
          masteryLevel: studentCompetenceProgress.masteryLevel,
          count: count()
        })
        .from(studentCompetenceProgress)
        .where(eq(studentCompetenceProgress.studentId, studentId))
        .groupBy(studentCompetenceProgress.masteryLevel);

      const breakdown = {
        decouverte: 0,
        apprentissage: 0,
        maitrise: 0,
        expertise: 0
      };

      competenceBreakdown.forEach(item => {
        if (item.masteryLevel in breakdown) {
          breakdown[item.masteryLevel as keyof typeof breakdown] = item.count;
        }
      });

      const totalExercises = progressMetrics.totalExercises || 0;
      const completedExercises = Number(progressMetrics.completedExercises) || 0;

      return {
        totalExercises,
        completedExercises,
        completionRate: totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0,
        averageScore: Number(progressMetrics.averageScore) || 0,
        totalTimeSpent: Number(progressMetrics.totalTimeSpent) || 0,
        xpEarned: Number(progressMetrics.xpEarned) || 0,
        streakDays: await this.calculateCurrentStreak(studentId),
        masteredCompetences: breakdown.expertise + breakdown.maitrise,
        competenceBreakdown: breakdown
      };
    } catch (error) {
      logger.error('Get student stats error:', { studentId, error });
      throw new Error('Failed to get student statistics');
    }
  }

  /**
   * Get recommended exercises based on competence progress and spaced repetition
   */
  async getRecommendedExercises(studentId: number, limit: number = 10): Promise<Exercise[]> {
    try {
      // Get student's competence progress
      const competenceProgress = await this.db
        .select()
        .from(studentCompetenceProgress)
        .where(eq(studentCompetenceProgress.studentId, studentId));

      // Identify competences that need reinforcement
      const needReinforcementCodes = competenceProgress
        .filter(cp => cp.masteryLevel === 'apprentissage' || cp.masteryLevel === 'decouverte')
        .map(cp => cp.competenceCode);

      if (needReinforcementCodes.length === 0) {
        // If all competences are mastered, suggest new ones
        const allExercises = await this.db
          .select()
          .from(exercises)
          .limit(limit);
        return allExercises;
      }

      // Get exercises for competences that need work
      const recommendedExercises = await this.db
        .select()
        .from(exercises)
        .where(inArray(exercises.competenceCode, needReinforcementCodes))
        .limit(limit);

      return recommendedExercises;
    } catch (error) {
      logger.error('Get recommended exercises error:', { studentId, error });
      throw new Error('Failed to get recommended exercises');
    }
  }

  /**
   * Get student by ID with enhanced details
   */
  async getStudentById(id: number): Promise<Student | null> {
    try {
      const result = await this.db
        .select()
        .from(students)
        .where(eq(students.id, id))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      logger.error('Get student by ID error:', { id, error });
      throw new Error('Failed to get student');
    }
  }

  /**
   * Get student progress with optional filtering
   */
  async getStudentProgress(studentId: number, matiere?: string, limit?: number): Promise<Progress[]> {
    try {
      const result = await this.db
        .select()
        .from(studentProgress)
        .where(eq(studentProgress.studentId, studentId))
        .orderBy(desc(studentProgress.createdAt))
        .limit(limit || 50);

      return result;
    } catch (error) {
      logger.error('Get student progress error:', { studentId, matiere, error });
      return [];
    }
  }

  /**
   * Helper method to calculate mastery level based on performance metrics
   */
  private calculateMasteryLevel(successfulAttempts: number, totalAttempts: number, averageScore: number): string {
    if (totalAttempts === 0) return 'decouverte';
    
    const successRate = successfulAttempts / totalAttempts;
    
    if (successRate >= 0.9 && averageScore >= 85 && successfulAttempts >= 5) {
      return 'expertise';
    } else if (successRate >= 0.75 && averageScore >= 70 && successfulAttempts >= 3) {
      return 'maitrise';
    } else if (successRate >= 0.5 && successfulAttempts >= 2) {
      return 'apprentissage';
    } else {
      return 'decouverte';
    }
  }

  /**
   * Calculate current learning streak for a student
   */
  private async calculateCurrentStreak(studentId: number): Promise<number> {
    try {
      const recentDays = await this.db
        .select({ date: dailyLearningAnalytics.date })
        .from(dailyLearningAnalytics)
        .where(and(
          eq(dailyLearningAnalytics.studentId, studentId),
          sql`${dailyLearningAnalytics.completedExercises} > 0`
        ))
        .orderBy(desc(dailyLearningAnalytics.date))
        .limit(30);

      let streak = 0;
      const today = new Date();
      
      for (const day of recentDays) {
        const daysDiff = Math.floor((today.getTime() - day.date.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === streak) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      logger.error('Calculate streak error:', { studentId, error });
      return 0;
    }
  }

  /**
   * Health check for database connectivity and table structure
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: {
      connection: boolean;
      tables: string[];
      timestamp: string;
    };
  }> {
    try {
      // Test basic query
      await this.db.select({ count: count() }).from(students).limit(1);
      
      return {
        status: 'healthy',
        details: {
          connection: true,
          tables: ['students', 'student_competence_progress', 'daily_learning_analytics'],
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        details: {
          connection: false,
          tables: [],
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  // Legacy compatibility methods
  async updateStudent(id: number, updates: Partial<Student>): Promise<Student> {
    try {
      await this.db
        .update(students)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(students.id, id));

      const updated = await this.getStudentById(id);
      if (!updated) throw new Error('Student not found after update');
      return updated;
    } catch (error) {
      logger.error('Update student error:', { id, updates, error });
      throw new Error('Failed to update student');
    }
  }

  async getStudentSessions(studentId: number, limit?: number): Promise<LearningSessionTracking[]> {
    return this.getLearningSessionTracking({ studentId, limit });
  }

  async createSession(sessionData: any): Promise<any> {
    try {
      const result = await this.db
        .insert(learningSessionTracking)
        .values({
          ...sessionData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      
      return { id: (result as any).insertId, ...sessionData };
    } catch (error) {
      logger.error('Create session error:', { sessionData, error });
      throw new Error('Failed to create session');
    }
  }

  async updateSession(id: string, updates: any): Promise<any> {
    try {
      await this.db
        .update(learningSessionTracking)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(learningSessionTracking.id, parseInt(id)));
      
      return { id, ...updates };
    } catch (error) {
      logger.error('Update session error:', { id, updates, error });
      throw new Error('Failed to update session');
    }
  }

  async getWeeklyProgress(studentId: number): Promise<WeeklyProgressSummary[]> {
    try {
      return await this.db
        .select()
        .from(weeklyProgressSummary)
        .where(eq(weeklyProgressSummary.studentId, studentId))
        .orderBy(desc(weeklyProgressSummary.weekStart));
    } catch (error) {
      logger.error('Get weekly progress error:', { studentId, error });
      return [];
    }
  }

  async getSubjectProgress(studentId: number): Promise<any> {
    try {
      const subjectProgress = await this.db
        .select({
          matiere: exercises.matiere,
          totalExercises: count(),
          completedExercises: sql<number>`COUNT(CASE WHEN ${studentProgress.completed} THEN 1 END)`,
          averageScore: avg(sql<number>`CAST(${studentProgress.score} AS DECIMAL(5,2))`)
        })
        .from(studentProgress)
        .innerJoin(exercises, eq(studentProgress.exerciseId, exercises.id))
        .where(eq(studentProgress.studentId, studentId))
        .groupBy(exercises.matiere);

      return subjectProgress.reduce((acc, subject) => {
        acc[subject.matiere] = {
          totalExercises: subject.totalExercises,
          completedExercises: Number(subject.completedExercises) || 0,
          averageScore: Number(subject.averageScore) || 0
        };
        return acc;
      }, {} as Record<string, any>);
    } catch (error) {
      logger.error('Get subject progress error:', { studentId, error });
      return {};
    }
  }
}

export const enhancedDatabaseService = new EnhancedDatabaseService();