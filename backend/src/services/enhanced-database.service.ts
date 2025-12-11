/**
 * Enhanced Database Service for Educational Platform
 * Provides comprehensive database operations for competence tracking, analytics, and spaced repetition
 */

import { getDatabase } from '../db/connection';
import { students, exercises, studentProgress, studentCompetenceProgress, competencePrerequisites, dailyLearningAnalytics, weeklyProgressSummary, learningSessionTracking, studentAchievements, spacedRepetition, competencePrerequisites as CompetencePrerequisite, type Exercise, type Student, type StudentCompetenceProgress, type StudentProgress, type DailyLearningAnalytics, type LearningSessionTracking, type WeeklyProgressSummary } from '../db/schema';
import { eq, and, desc, asc, sql, count, sum, avg, between, inArray, or, isNull, lte } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { StudentCache } from './enhanced-cache.service';
import { SuperMemoService, type ExerciseResponse } from './supermemo.service';

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
  hintsUsed?: number;
  confidence?: number;
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
    } catch (error: unknown) {
      logger.error('Get student competence progress error:', { studentId, filters, error });
      throw new Error('Failed to get student competence progress');
    }
  }

  /**
   * Record progress with intelligent mastery level calculation and SuperMemo-2 integration
   */
  async recordStudentProgress(studentId: number, data: ProgressRecordingData): Promise<{
    id: number;
    masteryLevel: string;
    progressPercent: number;
    consecutiveSuccesses: number;
    masteryLevelChanged: boolean;
    averageScore: number;
    superMemoUpdated?: boolean;
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
      let superMemoUpdated = false;

      // ===================================================================
      // SUPERMEMO-2 INTEGRATION: Calculate quality and update spaced repetition
      // ===================================================================
      if (data.exerciseId && data.difficultyLevel !== undefined) {
        try {
          // Prepare exercise response for SuperMemo quality calculation
          const exerciseResponse: ExerciseResponse = {
            studentId,
            competenceId: 0, // Not used in quality calculation
            isCorrect: data.completed && data.score >= 70,
            timeSpent: data.timeSpent,
            hintsUsed: data.hintsUsed || 0,
            difficulty: data.difficultyLevel,
            confidence: data.confidence
          };

          // Calculate quality score (0-5)
          const quality = SuperMemoService.calculateQuality(exerciseResponse);

          // Get or create SuperMemo card
          const [existingCard] = await this.db
            .select()
            .from(spacedRepetition)
            .where(and(
              eq(spacedRepetition.studentId, studentId),
              eq(spacedRepetition.exerciseId, data.exerciseId),
              eq(spacedRepetition.competenceCode, data.competenceCode)
            ))
            .limit(1);

          let superMemoCard: Partial<{
            easinessFactor: number;
            repetitionNumber: number;
            interval: number;
            nextReview: Date;
            lastReview: Date;
            quality: number;
          }>;

          if (existingCard) {
            superMemoCard = {
              easinessFactor: Number(existingCard.easinessFactor) || 2.5,
              repetitionNumber: existingCard.repetitionNumber || 0,
              interval: existingCard.intervalDays || 1,
              nextReview: existingCard.nextReviewDate ? new Date(existingCard.nextReviewDate) : new Date(),
              lastReview: existingCard.lastReviewDate ? new Date(existingCard.lastReviewDate) : new Date(),
              quality: quality
            };
          } else {
            // New card - initialize with defaults
            superMemoCard = {
              easinessFactor: 2.5,
              repetitionNumber: 0,
              interval: 1,
              nextReview: new Date(),
              lastReview: new Date(),
              quality: quality
            };
          }

          // Calculate next review using SuperMemo-2 algorithm
          const superMemoResult = SuperMemoService.calculateNextReview(superMemoCard, quality);

          // Update or create spaced repetition record
          if (existingCard) {
            await this.db
              .update(spacedRepetition)
              .set({
                easinessFactor: superMemoResult.easinessFactor.toString(),
                repetitionNumber: superMemoResult.repetitionNumber,
                intervalDays: superMemoResult.interval,
                nextReviewDate: superMemoResult.nextReviewDate,
                lastReviewDate: now,
                correctAnswers: sql`${spacedRepetition.correctAnswers} + ${exerciseResponse.isCorrect ? 1 : 0}`,
                totalReviews: sql`${spacedRepetition.totalReviews} + 1`,
                averageResponseTime: sql`ROUND((${spacedRepetition.averageResponseTime} * ${spacedRepetition.totalReviews} + ${data.timeSpent}) / (${spacedRepetition.totalReviews} + 1))`,
                priority: superMemoResult.difficulty === 'very_hard' ? 'high' : 
                         superMemoResult.difficulty === 'hard' ? 'medium' : 'normal',
                updatedAt: now
              })
              .where(eq(spacedRepetition.id, existingCard.id));
          } else {
            // Create new spaced repetition card
            await this.db
              .insert(spacedRepetition)
              .values({
                studentId,
                exerciseId: data.exerciseId,
                competenceCode: data.competenceCode,
                easinessFactor: superMemoResult.easinessFactor.toString(),
                repetitionNumber: superMemoResult.repetitionNumber,
                intervalDays: superMemoResult.interval,
                nextReviewDate: superMemoResult.nextReviewDate,
                lastReviewDate: now,
                correctAnswers: exerciseResponse.isCorrect ? 1 : 0,
                totalReviews: 1,
                averageResponseTime: data.timeSpent,
                priority: superMemoResult.difficulty === 'very_hard' ? 'high' : 
                         superMemoResult.difficulty === 'hard' ? 'medium' : 'normal',
                isActive: true
              });
          }

          superMemoUpdated = true;
          logger.debug('SuperMemo card updated', { 
            studentId, 
            exerciseId: data.exerciseId, 
            quality, 
            nextReview: superMemoResult.nextReviewDate,
            easinessFactor: superMemoResult.easinessFactor
          });
        } catch (superMemoError: unknown) {
          // Log but don't fail the entire progress recording
          logger.warn('SuperMemo update failed, continuing with progress recording', { 
            err: superMemoError, 
            studentId, 
            exerciseId: data.exerciseId 
          });
        }
      }

      if (existingProgress.length > 0) {
        // Update existing progress
        const current = existingProgress[0];
        const newTotalAttempts = current?.totalAttempts + (data?.attempts || 1);
        const newSuccessfulAttempts = current?.successfulAttempts + (data?.completed ? 1 : 0);
        const newAverageScore = Number((((Number(current?.currentScore) || 0) * current?.totalAttempts) + data?.score) / newTotalAttempts);
        
        // Calculate new mastery level
        const oldMasteryLevel = current?.masteryLevel;
        newMasteryLevel = this.calculateMasteryLevel(newSuccessfulAttempts, newTotalAttempts, newAverageScore);
        masteryLevelChanged = oldMasteryLevel !== newMasteryLevel;

        // Calculate consecutive successes from recent attempts
        let newConsecutiveSuccesses = 0;
        
        if (data.completed && data.score >= 70) {
          const recentSuccessRate = newSuccessfulAttempts / newTotalAttempts;
          if (recentSuccessRate >= 0.8) {
            newConsecutiveSuccesses = Math.min(newSuccessfulAttempts, 10);
          } else {
            newConsecutiveSuccesses = 1;
          }
        } else {
          newConsecutiveSuccesses = 0;
        }

        if (!current || !current.id) {
          throw new Error('Current competence progress not found');
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
          averageScore: newAverageScore,
          superMemoUpdated
        };

      } else {
        // Create new progress record
        newMasteryLevel = this.calculateMasteryLevel(data.completed ? 1 : 0, 1, data.score);
        masteryLevelChanged = true;

        const _newRecord = await this.db
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
          id: 0,
          masteryLevel: newMasteryLevel,
          progressPercent: data.completed ? Math.round(data.score) : 0,
          consecutiveSuccesses: (data.completed && data.score >= 70) ? 1 : 0,
          masteryLevelChanged,
          averageScore: data.score,
          superMemoUpdated
        };
      }
    } catch (error: unknown) {
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
  ): Promise<any[]> {
    try {
      const prerequisites = await this.db
        .select()
        .from(competencePrerequisites)
        .where(eq(competencePrerequisites.competenceCode, competenceCode))
        .orderBy(asc(competencePrerequisites.minimumLevel));

      return prerequisites;
    } catch (error: unknown) {
      logger.error('Get competence prerequisites error:', { competenceCode, error });
      throw new Error('Failed to get competence prerequisites');
    }
  }

  /**
   * Get student achievements with comprehensive filtering
   */
  async getStudentAchievements(studentId: number, filters: AchievementFilters = {}): Promise<typeof studentAchievements.$inferSelect[]> {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
          averageScore: avg(sql<number>`CAST(${studentProgress.averageScore} AS DECIMAL(5,2))`),
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
        if (item.masteryLevel && item.masteryLevel in breakdown) {
          breakdown[item.masteryLevel as keyof typeof breakdown] = item.count;
        }
      });

      const totalExercises = progressMetrics?.totalExercises || 0;
      const completedExercises = Number(progressMetrics?.completedExercises) || 0;

      return {
        totalExercises,
        completedExercises,
        completionRate: totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0,
        averageScore: Number(progressMetrics?.averageScore) || 0,
        totalTimeSpent: Number(progressMetrics?.totalTimeSpent) || 0,
        xpEarned: Number(progressMetrics?.xpEarned) || 0,
        streakDays: await this.calculateCurrentStreak(studentId),
        masteredCompetences: breakdown.expertise + breakdown.maitrise,
        competenceBreakdown: breakdown
      };
    } catch (error: unknown) {
      logger.error('Get student stats error:', { studentId, error });
      throw new Error('Failed to get student statistics');
    }
  }

  /**
   * Get recommended exercises based on competence progress, spaced repetition, and prerequisites
   */
  async getRecommendedExercises(studentId: number, limit: number = 10): Promise<Exercise[]> {
    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // ===================================================================
      // PRIORITY 1: SuperMemo cards due for review (nextReviewDate <= today)
      // ===================================================================
      const dueCards = await this.db
        .select({
          exerciseId: spacedRepetition.exerciseId,
          priority: spacedRepetition.priority,
          easinessFactor: spacedRepetition.easinessFactor,
          nextReviewDate: spacedRepetition.nextReviewDate
        })
        .from(spacedRepetition)
        .where(and(
          eq(spacedRepetition.studentId, studentId),
          eq(spacedRepetition.isActive, true),
          or(
            isNull(spacedRepetition.nextReviewDate),
            lte(spacedRepetition.nextReviewDate, now)
          )
        ))
        .orderBy(
          desc(sql`CASE 
            WHEN ${spacedRepetition.priority} = 'high' THEN 1 
            WHEN ${spacedRepetition.priority} = 'medium' THEN 2 
            ELSE 3 
          END`),
          asc(spacedRepetition.nextReviewDate)
        )
        .limit(limit);

      if (dueCards.length > 0) {
        const dueExerciseIds = dueCards.map(card => card.exerciseId);
        const dueExercises = await this.db
          .select()
          .from(exercises)
          .where(inArray(exercises.id, dueExerciseIds))
          .limit(limit);

        if (dueExercises.length > 0) {
          logger.debug('Returning SuperMemo due exercises', { count: dueExercises.length, studentId });
          return dueExercises;
        }
      }

      // ===================================================================
      // PRIORITY 2: Competences that need reinforcement (apprentissage/decouverte)
      // ===================================================================
      const competenceProgress = await this.db
        .select()
        .from(studentCompetenceProgress)
        .where(eq(studentCompetenceProgress.studentId, studentId));

      // Identify competences that need reinforcement
      const needReinforcementCodes = competenceProgress
        .filter(cp => cp.masteryLevel === 'apprentissage' || cp.masteryLevel === 'decouverte')
        .map(cp => cp.competenceCode);

      if (needReinforcementCodes.length > 0) {
        // Check prerequisites before recommending
        const availableCompetences: string[] = [];
        
        for (const code of needReinforcementCodes) {
          const prerequisites = await this.getCompetencePrerequisites(code);
          
          if (prerequisites.length === 0) {
            // No prerequisites, available immediately
            availableCompetences.push(code);
          } else {
            // Check if all prerequisites are met
            const prerequisiteCodes = prerequisites.map(p => p.prerequisiteCode).filter(Boolean) as string[];
            const studentPrereqProgress = competenceProgress.filter(cp => 
              prerequisiteCodes.includes(cp.competenceCode) && 
              (cp.masteryLevel === 'maitrise' || cp.masteryLevel === 'expertise')
            );
            
            if (studentPrereqProgress.length === prerequisiteCodes.length) {
              // All prerequisites met
              availableCompetences.push(code);
            }
          }
        }

        if (availableCompetences.length > 0) {
          // Get exercises for available competences
          const recommendedExercises = await this.db
            .select()
            .from(exercises)
            .where(inArray(exercises.competenceCode, availableCompetences))
            .orderBy(sql`RAND()`)
            .limit(limit);

          if (recommendedExercises.length > 0) {
            logger.debug('Returning exercises for competences needing reinforcement', { 
              count: recommendedExercises.length, 
              competences: availableCompetences,
              studentId 
            });
            return recommendedExercises;
          }
        }
      }

      // ===================================================================
      // PRIORITY 3: New competences (if all current ones are mastered)
      // ===================================================================
      const allExercises = await this.db
        .select()
        .from(exercises)
        .orderBy(sql`RAND()`)
        .limit(limit);

      logger.debug('Returning new exercises (all competences mastered)', { count: allExercises.length, studentId });
      return allExercises;
    } catch (error: unknown) {
      logger.error('Get recommended exercises error:', { studentId, error });
      throw new Error('Failed to get recommended exercises');
    }
  }

  /**
   * Get student by ID with enhanced details
   */
  async getStudentById(id: number): Promise<Student | null> {
    try {
      // 1. Try to get from cache
      const cachedStudent = await StudentCache.getProfile(id);
      if (cachedStudent) {
        logger.debug('Cache hit for student profile', { studentId: id });
        return cachedStudent as Student;
      }

      logger.debug('Cache miss for student profile', { studentId: id });
      // 2. If miss, get from DB
      const result = await this.db
        .select()
        .from(students)
        .where(eq(students.id, id))
        .limit(1);
      
      const student = result[0] || null;

      // 3. Set in cache for next time
      if (student) {
        await StudentCache.setProfile(id, student);
      }

      return student;
    } catch (error: unknown) {
      logger.error('Get student by ID error:', { id, error });
      throw new Error('Failed to get student');
    }
  }

  /**
   * Get student progress with optional filtering
   */
  async getStudentProgress(studentId: number, matiere?: string, limit?: number): Promise<StudentProgress[]> {
    try {
      const result = await this.db
        .select()
        .from(studentProgress)
        .where(eq(studentProgress.studentId, studentId))
        .orderBy(desc(studentProgress.createdAt))
        .limit(limit || 50);

      return result;
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      logger.error('Database health check failed', { err: error });
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
          averageScore: avg(sql<number>`CAST(${studentProgress.averageScore} AS DECIMAL(5,2))`)
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
    } catch (error: unknown) {
      logger.error('Get subject progress error:', { studentId, error });
      return {};
    }
  }
}

export const enhancedDatabaseService = new EnhancedDatabaseService();
export const databaseService = enhancedDatabaseService; // Alias for backward compatibility