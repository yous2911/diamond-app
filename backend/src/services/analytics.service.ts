/**
 * Advanced Analytics Service for Educational Platform
 * Provides comprehensive learning analytics, progress tracking, and insights
 */

import { getDatabase } from '../db/connection';
import { 
  students, 
  exercises, 
  studentProgress,
  dailyLearningAnalytics,
  weeklyProgressSummary,
  studentCompetenceProgress,
  learningSessionTracking,
  exercisePerformanceAnalytics,
  studentAchievements,
  type Student,
  type Exercise,
  type StudentProgress,
  type DailyLearningAnalytics,
  type WeeklyProgressSummary,
  type StudentCompetenceProgress,
  type LearningSessionTracking,
  type ExercisePerformanceAnalytics,
  MasteryLevels
} from '../db/schema';
import { eq, and, desc, asc, sql, count, sum, avg, between, gte, lte, inArray } from 'drizzle-orm';
import { logger } from '../utils/logger';

export interface LearningInsights {
  totalStudents: number;
  activeStudents: number;
  totalExercises: number;
  completedExercises: number;
  averageCompletionRate: number;
  topPerformingStudents: Array<{
    student: Student;
    completionRate: number;
    averageScore: number;
    totalXP: number;
  }>;
  subjectAnalysis: Array<{
    subject: string;
    exerciseCount: number;
    averageScore: number;
    completionRate: number;
  }>;
  difficultyAnalysis: Array<{
    difficulty: string;
    exerciseCount: number;
    averageScore: number;
    averageTime: number;
  }>;
}

export interface StudentAnalytics {
  student: Student;
  totalExercises: number;
  completedExercises: number;
  completionRate: number;
  averageScore: number;
  totalTimeSpent: number;
  xpEarned: number;
  currentStreak: number;
  competenceProgress: Array<{
    competenceCode: string;
    masteryLevel: string;
    progress: number;
  }>;
  recentActivity: Array<{
    date: Date;
    exercisesCompleted: number;
    timeSpent: number;
    averageScore: number;
  }>;
  achievements: Array<{
    title: string;
    description: string;
    earnedAt: Date;
    xpReward: number;
  }>;
}

export interface CompetenceAnalytics {
  competenceCode: string;
  totalStudents: number;
  masteryDistribution: {
    decouverte: number;
    apprentissage: number;
    maitrise: number;
    expertise: number;
  };
  averageProgressTime: number;
  successRate: number;
  commonDifficulties: string[];
}

class AnalyticsService {
  private db = getDatabase();

  /**
   * Get comprehensive learning insights for platform overview
   */
  async getLearningInsights(timeframe: 'week' | 'month' | 'year' = 'month'): Promise<LearningInsights> {
    try {
      const startDate = this.getStartDate(timeframe);
      
      // Get basic metrics
      const [totalStudentsResult] = await this.db
        .select({ count: count() })
        .from(students);

      const [totalExercisesResult] = await this.db
        .select({ count: count() })
        .from(exercises);

      // Get active students (those with progress in timeframe)
      const [activeStudentsResult] = await this.db
        .select({ count: count() })
        .from(studentProgress)
        .where(gte(studentProgress.createdAt, startDate));

      // Get completed exercises in timeframe
      const [completedExercisesResult] = await this.db
        .select({ count: count() })
        .from(studentProgress)
        .where(and(
          eq(studentProgress.completed, true),
          gte(studentProgress.createdAt, startDate)
        ));

      // Calculate completion rate
      const totalStudents = totalStudentsResult.count;
      const totalExercises = totalExercisesResult.count;
      const activeStudents = activeStudentsResult.count;
      const completedExercises = completedExercisesResult.count;
      
      const averageCompletionRate = totalExercises > 0 
        ? (completedExercises / (totalExercises * Math.max(activeStudents, 1))) * 100 
        : 0;

      // Get top performing students
      const topStudents = await this.db
        .select({
          studentId: studentProgress.studentId,
          completionRate: sql<number>`(COUNT(CASE WHEN ${studentProgress.completed} THEN 1 END) * 100.0 / COUNT(*))`,
          averageScore: avg(studentProgress.averageScore),
          totalXP: sum(sql<number>`COALESCE(SUM(10), 0)`)
        })
        .from(studentProgress)
        .where(gte(studentProgress.createdAt, startDate))
        .groupBy(studentProgress.studentId)
        .having(sql`COUNT(*) >= 5`)
        .orderBy(desc(sql`(COUNT(CASE WHEN ${studentProgress.completed} THEN 1 END) * 100.0 / COUNT(*))`))
        .limit(10);

      // Get student details for top performers
      const topPerformingStudents = await Promise.all(
        topStudents.map(async (student) => {
          const [studentDetails] = await this.db
            .select()
            .from(students)
            .where(eq(students.id, student.studentId));

          return {
            student: studentDetails,
            completionRate: Number(student.completionRate) || 0,
            averageScore: Number(student.averageScore) || 0,
            totalXP: Number(student.totalXP) || 0
          };
        })
      );

      // Subject analysis
      const subjectAnalysis = await this.db
        .select({
          subject: exercises.matiere,
          exerciseCount: count(),
          averageScore: avg(studentProgress.averageScore),
          completionRate: sql<number>`(COUNT(CASE WHEN ${studentProgress.completed} THEN 1 END) * 100.0 / COUNT(*))`
        })
        .from(exercises)
        .leftJoin(studentProgress, eq(exercises.id, studentProgress.exerciseId))
        .where(gte(studentProgress.createdAt, startDate))
        .groupBy(exercises.matiere);

      // Difficulty analysis
      const difficultyAnalysis = await this.db
        .select({
          difficulty: exercises.difficulte,
          exerciseCount: count(),
          averageScore: avg(studentProgress.averageScore),
          averageTime: avg(studentProgress.timeSpent)
        })
        .from(exercises)
        .leftJoin(studentProgress, eq(exercises.id, studentProgress.exerciseId))
        .where(gte(studentProgress.createdAt, startDate))
        .groupBy(exercises.difficulte);

      return {
        totalStudents,
        activeStudents,
        totalExercises,
        completedExercises,
        averageCompletionRate,
        topPerformingStudents,
        subjectAnalysis: subjectAnalysis.map(s => ({
          subject: s.subject,
          exerciseCount: s.exerciseCount,
          averageScore: Number(s.averageScore) || 0,
          completionRate: Number(s.completionRate) || 0
        })),
        difficultyAnalysis: difficultyAnalysis.map(d => ({
          difficulty: d.difficulty,
          exerciseCount: d.exerciseCount,
          averageScore: Number(d.averageScore) || 0,
          averageTime: Number(d.averageTime) || 0
        }))
      };

    } catch (error: unknown) {
      logger.error('Error getting learning insights:', error);
      throw new Error('Failed to generate learning insights');
    }
  }

  /**
   * Get detailed analytics for a specific student
   */
  async getStudentAnalytics(studentId: number): Promise<StudentAnalytics> {
    try {
      // Get student details
      const [student] = await this.db
        .select()
        .from(students)
        .where(eq(students.id, studentId));

      if (!student) {
        throw new Error('Student not found');
      }

      // Get basic progress metrics
      const [progressMetrics] = await this.db
        .select({
          totalExercises: count(),
          completedExercises: sql<number>`COUNT(CASE WHEN ${studentProgress.completed} THEN 1 END)`,
          averageScore: avg(studentProgress.averageScore),
          totalTimeSpent: sum(studentProgress.timeSpent),
          xpEarned: sum(sql<number>`COALESCE(SUM(10), 0)`)
        })
        .from(studentProgress)
        .where(eq(studentProgress.studentId, studentId));

      const totalExercises = progressMetrics.totalExercises || 0;
      const completedExercises = Number(progressMetrics.completedExercises) || 0;
      const completionRate = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;
      const averageScore = Number(progressMetrics.averageScore) || 0;
      const totalTimeSpent = Number(progressMetrics.totalTimeSpent) || 0;
      const xpEarned = Number(progressMetrics.xpEarned) || 0;

      // Get competence progress
      const competenceProgress = await this.db
        .select()
        .from(studentCompetenceProgress)
        .where(eq(studentCompetenceProgress.studentId, studentId));

      // Get recent daily analytics
      const recentActivity = await this.db
        .select()
        .from(dailyLearningAnalytics)
        .where(eq(dailyLearningAnalytics.studentId, studentId))
        .orderBy(desc(dailyLearningAnalytics.date))
        .limit(30);

      // Get achievements
      const achievements = await this.db
        .select()
        .from(studentAchievements)
        .where(eq(studentAchievements.studentId, studentId))
        .orderBy(desc(studentAchievements.unlockedAt));

      // Calculate current streak
      const currentStreak = await this.calculateCurrentStreak(studentId);

      return {
        student,
        totalExercises,
        completedExercises,
        completionRate,
        averageScore,
        totalTimeSpent,
        xpEarned,
        currentStreak,
        competenceProgress: competenceProgress.map(cp => ({
          competenceCode: cp.competenceCode,
          masteryLevel: cp.masteryLevel || 'decouverte',
          progress: ((cp.successfulAttempts || 0) / Math.max(cp.totalAttempts || 1, 1)) * 100
        })),
        recentActivity: recentActivity.map(activity => ({
          date: activity.date,
          exercisesCompleted: activity.completedExercises || 0,
          timeSpent: activity.totalTimeMinutes || 0,
          averageScore: Number(activity.averageScore) || 0
        })),
        achievements: achievements.map(achievement => ({
          title: achievement.title,
          description: achievement.description || '',
          earnedAt: achievement.unlockedAt,
          xpReward: achievement.xpReward || 0
        }))
      };

    } catch (error: unknown) {
      logger.error('Error getting student analytics:', { studentId, error });
      throw new Error('Failed to generate student analytics');
    }
  }

  /**
   * Update daily analytics for a student
   */
  async updateDailyAnalytics(studentId: number, date: Date): Promise<void> {
    try {
      const dateStr = date.toISOString().split('T')[0];

      // Calculate daily metrics
      const [dailyMetrics] = await this.db
        .select({
          totalExercises: count(),
          completedExercises: sql<number>`COUNT(CASE WHEN ${studentProgress.completed} THEN 1 END)`,
          totalTimeMinutes: sql<number>`ROUND(SUM(${studentProgress.timeSpent}) / 60)`,
          averageScore: avg(studentProgress.averageScore),
          competencesWorked: sql<number>`COUNT(DISTINCT ${studentProgress.competenceCode})`
        })
        .from(studentProgress)
        .where(and(
          eq(studentProgress.studentId, studentId),
          sql`DATE(${studentProgress.createdAt}) = ${dateStr}`
        ));

      // Insert or update daily analytics
      await this.db
        .insert(dailyLearningAnalytics)
        .values({
          studentId,
          date: new Date(dateStr),
          totalExercises: dailyMetrics.totalExercises || 0,
          completedExercises: Number(dailyMetrics.completedExercises) || 0,
          totalTimeMinutes: Number(dailyMetrics.totalTimeMinutes) || 0,
          averageScore: Number(dailyMetrics.averageScore)?.toFixed(2) || '0.00',
          competencesWorked: Number(dailyMetrics.competencesWorked) || 0
        })
;

      logger.debug('Daily analytics updated', { studentId, date: dateStr });

    } catch (error: unknown) {
      logger.error('Error updating daily analytics:', { studentId, date, error });
    }
  }

  /**
   * Calculate current learning streak for student
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
      logger.error('Error calculating streak:', { studentId, error });
      return 0;
    }
  }

  /**
   * Helper method to get start date based on timeframe
   */
  private getStartDate(timeframe: 'week' | 'month' | 'year'): Date {
    const now = new Date();
    switch (timeframe) {
      case 'week':
        now.setDate(now.getDate() - 7);
        break;
      case 'month':
        now.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        now.setFullYear(now.getFullYear() - 1);
        break;
    }
    return now;
  }
}

export const analyticsService = new AnalyticsService();