"use strict";
/**
 * Advanced Analytics Service for Educational Platform
 * Provides comprehensive learning analytics, progress tracking, and insights
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = void 0;
const connection_1 = require("../db/connection");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const logger_1 = require("../utils/logger");
class AnalyticsService {
    constructor() {
        this.db = (0, connection_1.getDatabase)();
    }
    /**
     * Get comprehensive learning insights for platform overview
     */
    async getLearningInsights(timeframe = 'month') {
        try {
            const startDate = this.getStartDate(timeframe);
            // Get basic metrics
            const [totalStudentsResult] = await this.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.students);
            const [totalExercisesResult] = await this.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.exercises);
            // Get active students (those with progress in timeframe)
            const [activeStudentsResult] = await this.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.studentProgress)
                .where((0, drizzle_orm_1.gte)(schema_1.studentProgress.createdAt, startDate));
            // Get completed exercises in timeframe
            const [completedExercisesResult] = await this.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.studentProgress)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.studentProgress.completed, true), (0, drizzle_orm_1.gte)(schema_1.studentProgress.createdAt, startDate)));
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
                studentId: schema_1.studentProgress.studentId,
                completionRate: (0, drizzle_orm_1.sql) `(COUNT(CASE WHEN ${schema_1.studentProgress.completed} THEN 1 END) * 100.0 / COUNT(*))`,
                averageScore: (0, drizzle_orm_1.avg)((0, drizzle_orm_1.sql) `CAST(${schema_1.studentProgress.score} AS DECIMAL(5,2))`),
                totalXP: (0, drizzle_orm_1.sum)((0, drizzle_orm_1.sql) `COALESCE(SUM(10), 0)`)
            })
                .from(schema_1.studentProgress)
                .where((0, drizzle_orm_1.gte)(schema_1.studentProgress.createdAt, startDate))
                .groupBy(schema_1.studentProgress.studentId)
                .having((0, drizzle_orm_1.sql) `COUNT(*) >= 5`)
                .orderBy((0, drizzle_orm_1.desc)((0, drizzle_orm_1.sql) `(COUNT(CASE WHEN ${schema_1.studentProgress.completed} THEN 1 END) * 100.0 / COUNT(*))`))
                .limit(10);
            // Get student details for top performers
            const topPerformingStudents = await Promise.all(topStudents.map(async (student) => {
                const [studentDetails] = await this.db
                    .select()
                    .from(schema_1.students)
                    .where((0, drizzle_orm_1.eq)(schema_1.students.id, student.studentId));
                return {
                    student: studentDetails,
                    completionRate: Number(student.completionRate) || 0,
                    averageScore: Number(student.averageScore) || 0,
                    totalXP: Number(student.totalXP) || 0
                };
            }));
            // Subject analysis
            const subjectAnalysis = await this.db
                .select({
                subject: schema_1.exercises.matiere,
                exerciseCount: (0, drizzle_orm_1.count)(),
                averageScore: (0, drizzle_orm_1.avg)((0, drizzle_orm_1.sql) `CAST(${schema_1.studentProgress.score} AS DECIMAL(5,2))`),
                completionRate: (0, drizzle_orm_1.sql) `(COUNT(CASE WHEN ${schema_1.studentProgress.completed} THEN 1 END) * 100.0 / COUNT(*))`
            })
                .from(schema_1.exercises)
                .leftJoin(schema_1.studentProgress, (0, drizzle_orm_1.eq)(schema_1.exercises.id, schema_1.studentProgress.exerciseId))
                .where((0, drizzle_orm_1.gte)(schema_1.studentProgress.createdAt, startDate))
                .groupBy(schema_1.exercises.matiere);
            // Difficulty analysis
            const difficultyAnalysis = await this.db
                .select({
                difficulty: schema_1.exercises.difficulte,
                exerciseCount: (0, drizzle_orm_1.count)(),
                averageScore: (0, drizzle_orm_1.avg)((0, drizzle_orm_1.sql) `CAST(${schema_1.studentProgress.score} AS DECIMAL(5,2))`),
                averageTime: (0, drizzle_orm_1.avg)(schema_1.studentProgress.timeSpent)
            })
                .from(schema_1.exercises)
                .leftJoin(schema_1.studentProgress, (0, drizzle_orm_1.eq)(schema_1.exercises.id, schema_1.studentProgress.exerciseId))
                .where((0, drizzle_orm_1.gte)(schema_1.studentProgress.createdAt, startDate))
                .groupBy(schema_1.exercises.difficulte);
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
        }
        catch (error) {
            logger_1.logger.error('Error getting learning insights:', error);
            throw new Error('Failed to generate learning insights');
        }
    }
    /**
     * Get detailed analytics for a specific student
     */
    async getStudentAnalytics(studentId) {
        try {
            // Get student details
            const [student] = await this.db
                .select()
                .from(schema_1.students)
                .where((0, drizzle_orm_1.eq)(schema_1.students.id, studentId));
            if (!student) {
                throw new Error('Student not found');
            }
            // Get basic progress metrics
            const [progressMetrics] = await this.db
                .select({
                totalExercises: (0, drizzle_orm_1.count)(),
                completedExercises: (0, drizzle_orm_1.sql) `COUNT(CASE WHEN ${schema_1.studentProgress.completed} THEN 1 END)`,
                averageScore: (0, drizzle_orm_1.avg)((0, drizzle_orm_1.sql) `CAST(${schema_1.studentProgress.score} AS DECIMAL(5,2))`),
                totalTimeSpent: (0, drizzle_orm_1.sum)(schema_1.studentProgress.timeSpent),
                xpEarned: (0, drizzle_orm_1.sum)((0, drizzle_orm_1.sql) `COALESCE(SUM(10), 0)`)
            })
                .from(schema_1.studentProgress)
                .where((0, drizzle_orm_1.eq)(schema_1.studentProgress.studentId, studentId));
            const totalExercises = progressMetrics.totalExercises || 0;
            const completedExercises = Number(progressMetrics.completedExercises) || 0;
            const completionRate = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;
            const averageScore = Number(progressMetrics.averageScore) || 0;
            const totalTimeSpent = Number(progressMetrics.totalTimeSpent) || 0;
            const xpEarned = Number(progressMetrics.xpEarned) || 0;
            // Get competence progress
            const competenceProgress = await this.db
                .select()
                .from(schema_1.studentCompetenceProgress)
                .where((0, drizzle_orm_1.eq)(schema_1.studentCompetenceProgress.studentId, studentId));
            // Get recent daily analytics
            const recentActivity = await this.db
                .select()
                .from(schema_1.dailyLearningAnalytics)
                .where((0, drizzle_orm_1.eq)(schema_1.dailyLearningAnalytics.studentId, studentId))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.dailyLearningAnalytics.date))
                .limit(30);
            // Get achievements
            const achievements = await this.db
                .select()
                .from(schema_1.studentAchievements)
                .where((0, drizzle_orm_1.eq)(schema_1.studentAchievements.studentId, studentId))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.studentAchievements.unlockedAt));
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
                    masteryLevel: cp.masteryLevel,
                    progress: (cp.successfulAttempts / Math.max(cp.totalAttempts, 1)) * 100
                })),
                recentActivity: recentActivity.map(activity => ({
                    date: activity.date,
                    exercisesCompleted: activity.completedExercises,
                    timeSpent: activity.totalTimeMinutes,
                    averageScore: Number(activity.averageScore) || 0
                })),
                achievements: achievements.map(achievement => ({
                    title: achievement.title,
                    description: achievement.description || '',
                    earnedAt: achievement.unlockedAt,
                    xpReward: achievement.xpReward
                }))
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting student analytics:', { studentId, error });
            throw new Error('Failed to generate student analytics');
        }
    }
    /**
     * Update daily analytics for a student
     */
    async updateDailyAnalytics(studentId, date) {
        try {
            const dateStr = date.toISOString().split('T')[0];
            // Calculate daily metrics
            const [dailyMetrics] = await this.db
                .select({
                totalExercises: (0, drizzle_orm_1.count)(),
                completedExercises: (0, drizzle_orm_1.sql) `COUNT(CASE WHEN ${schema_1.studentProgress.completed} THEN 1 END)`,
                totalTimeMinutes: (0, drizzle_orm_1.sql) `ROUND(SUM(${schema_1.studentProgress.timeSpent}) / 60)`,
                averageScore: (0, drizzle_orm_1.avg)((0, drizzle_orm_1.sql) `CAST(${schema_1.studentProgress.score} AS DECIMAL(5,2))`),
                competencesWorked: (0, drizzle_orm_1.sql) `COUNT(DISTINCT ${schema_1.studentProgress.competenceCode})`
            })
                .from(schema_1.studentProgress)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.studentProgress.studentId, studentId), (0, drizzle_orm_1.sql) `DATE(${schema_1.studentProgress.createdAt}) = ${dateStr}`));
            // Insert or update daily analytics
            await this.db
                .insert(schema_1.dailyLearningAnalytics)
                .values({
                studentId,
                date: new Date(dateStr),
                totalExercises: dailyMetrics.totalExercises || 0,
                completedExercises: Number(dailyMetrics.completedExercises) || 0,
                totalTimeMinutes: Number(dailyMetrics.totalTimeMinutes) || 0,
                averageScore: Number(dailyMetrics.averageScore)?.toFixed(2) || '0.00',
                competencesWorked: Number(dailyMetrics.competencesWorked) || 0
            });
            logger_1.logger.debug('Daily analytics updated', { studentId, date: dateStr });
        }
        catch (error) {
            logger_1.logger.error('Error updating daily analytics:', { studentId, date, error });
        }
    }
    /**
     * Calculate current learning streak for student
     */
    async calculateCurrentStreak(studentId) {
        try {
            const recentDays = await this.db
                .select({ date: schema_1.dailyLearningAnalytics.date })
                .from(schema_1.dailyLearningAnalytics)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.dailyLearningAnalytics.studentId, studentId), (0, drizzle_orm_1.sql) `${schema_1.dailyLearningAnalytics.completedExercises} > 0`))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.dailyLearningAnalytics.date))
                .limit(30);
            let streak = 0;
            const today = new Date();
            for (const day of recentDays) {
                const daysDiff = Math.floor((today.getTime() - day.date.getTime()) / (1000 * 60 * 60 * 24));
                if (daysDiff === streak) {
                    streak++;
                }
                else {
                    break;
                }
            }
            return streak;
        }
        catch (error) {
            logger_1.logger.error('Error calculating streak:', { studentId, error });
            return 0;
        }
    }
    /**
     * Helper method to get start date based on timeframe
     */
    getStartDate(timeframe) {
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
exports.analyticsService = new AnalyticsService();
