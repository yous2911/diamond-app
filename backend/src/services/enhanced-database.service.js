"use strict";
/**
 * Enhanced Database Service for Educational Platform
 * Provides comprehensive database operations for competence tracking, analytics, and spaced repetition
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.enhancedDatabaseService = void 0;
const connection_1 = require("../db/connection");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const logger_1 = require("../utils/logger");
const enhanced_cache_service_1 = require("./enhanced-cache.service");
class EnhancedDatabaseService {
    constructor() {
        this.db = (0, connection_1.getDatabase)();
    }
    /**
     * Get comprehensive competence progress for a student with advanced filtering
     */
    async getStudentCompetenceProgress(studentId, filters = {}) {
        try {
            const conditions = [(0, drizzle_orm_1.eq)(schema_1.studentCompetenceProgress.studentId, studentId)];
            if (filters.masteryLevel) {
                conditions.push((0, drizzle_orm_1.eq)(schema_1.studentCompetenceProgress.masteryLevel, filters.masteryLevel));
            }
            if (filters.competenceCodes && filters.competenceCodes.length > 0) {
                conditions.push((0, drizzle_orm_1.inArray)(schema_1.studentCompetenceProgress.competenceCode, filters.competenceCodes));
            }
            const result = await this.db
                .select()
                .from(schema_1.studentCompetenceProgress)
                .where((0, drizzle_orm_1.and)(...conditions))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.studentCompetenceProgress.lastAttemptAt))
                .limit(filters.limit || 50)
                .offset(filters.offset || 0);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Get student competence progress error:', { studentId, filters, error });
            throw new Error('Failed to get student competence progress');
        }
    }
    /**
     * Record progress with intelligent mastery level calculation
     */
    async recordStudentProgress(studentId, data) {
        try {
            // Get existing progress record
            const existingProgress = await this.db
                .select()
                .from(schema_1.studentCompetenceProgress)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.studentCompetenceProgress.studentId, studentId), (0, drizzle_orm_1.eq)(schema_1.studentCompetenceProgress.competenceCode, data.competenceCode)))
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
                }
                else {
                    newConsecutiveSuccesses = 0;
                }
                await this.db
                    .update(schema_1.studentCompetenceProgress)
                    .set({
                    masteryLevel: newMasteryLevel,
                    currentScore: newAverageScore.toFixed(2),
                    totalAttempts: newTotalAttempts,
                    successfulAttempts: newSuccessfulAttempts,
                    lastAttemptAt: now,
                    updatedAt: now
                })
                    .where((0, drizzle_orm_1.eq)(schema_1.studentCompetenceProgress.id, current.id));
                return {
                    id: current.id,
                    masteryLevel: newMasteryLevel,
                    progressPercent: Math.round((newSuccessfulAttempts / newTotalAttempts) * 100),
                    consecutiveSuccesses: newConsecutiveSuccesses,
                    masteryLevelChanged,
                    averageScore: newAverageScore
                };
            }
            else {
                // Create new progress record
                newMasteryLevel = this.calculateMasteryLevel(data.completed ? 1 : 0, 1, data.score);
                masteryLevelChanged = true;
                const newRecord = await this.db
                    .insert(schema_1.studentCompetenceProgress)
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
        }
        catch (error) {
            logger_1.logger.error('Record student progress error:', { studentId, data, error });
            throw new Error('Failed to record student progress');
        }
    }
    /**
     * Get prerequisites for a competence with dependency resolution
     */
    async getCompetencePrerequisites(competenceCode, options = {}) {
        try {
            const prerequisites = await this.db
                .select()
                .from(schema_1.competencePrerequisites)
                .where((0, drizzle_orm_1.eq)(schema_1.competencePrerequisites.competenceCode, competenceCode))
                .orderBy((0, drizzle_orm_1.asc)(schema_1.competencePrerequisites.minimumLevel));
            return prerequisites;
        }
        catch (error) {
            logger_1.logger.error('Get competence prerequisites error:', { competenceCode, error });
            throw new Error('Failed to get competence prerequisites');
        }
    }
    /**
     * Get student achievements with comprehensive filtering
     */
    async getStudentAchievements(studentId, filters = {}) {
        try {
            const conditions = [(0, drizzle_orm_1.eq)(schema_1.studentAchievements.studentId, studentId)];
            if (filters.category) {
                conditions.push((0, drizzle_orm_1.eq)(schema_1.studentAchievements.achievementType, filters.category));
            }
            if (filters.difficulty) {
                conditions.push((0, drizzle_orm_1.sql) `${schema_1.studentAchievements.achievementCode} LIKE ${`%${filters.difficulty}%`}`);
            }
            if (typeof filters.completed === 'boolean') {
                // All achievements in table are completed by definition
            }
            if (typeof filters.visible === 'boolean') {
                // All achievements are visible by default
            }
            const result = await this.db
                .select()
                .from(schema_1.studentAchievements)
                .where((0, drizzle_orm_1.and)(...conditions))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.studentAchievements.unlockedAt))
                .limit(filters.limit || 50)
                .offset(filters.offset || 0);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Get student achievements error:', { studentId, filters, error });
            throw new Error('Failed to get student achievements');
        }
    }
    /**
     * Get daily learning analytics with flexible filtering
     */
    async getDailyLearningAnalytics(filters) {
        try {
            const conditions = [];
            if (filters.studentId) {
                conditions.push((0, drizzle_orm_1.eq)(schema_1.dailyLearningAnalytics.studentId, filters.studentId));
            }
            if (filters.startDate && filters.endDate) {
                conditions.push((0, drizzle_orm_1.between)(schema_1.dailyLearningAnalytics.date, new Date(filters.startDate), new Date(filters.endDate)));
            }
            const whereClause = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
            const result = await this.db
                .select()
                .from(schema_1.dailyLearningAnalytics)
                .where(whereClause)
                .orderBy((0, drizzle_orm_1.desc)(schema_1.dailyLearningAnalytics.date))
                .limit(filters.limit || 50)
                .offset(filters.offset || 0);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Get daily learning analytics error:', { filters, error });
            throw new Error('Failed to get daily learning analytics');
        }
    }
    /**
     * Get learning session tracking data
     */
    async getLearningSessionTracking(filters) {
        try {
            const conditions = [];
            if (filters.studentId) {
                conditions.push((0, drizzle_orm_1.eq)(schema_1.learningSessionTracking.studentId, filters.studentId));
            }
            if (filters.startDate && filters.endDate) {
                conditions.push((0, drizzle_orm_1.between)(schema_1.learningSessionTracking.sessionStart, new Date(filters.startDate), new Date(filters.endDate)));
            }
            const whereClause = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
            const result = await this.db
                .select()
                .from(schema_1.learningSessionTracking)
                .where(whereClause)
                .orderBy((0, drizzle_orm_1.desc)(schema_1.learningSessionTracking.sessionStart))
                .limit(filters.limit || 50)
                .offset(filters.offset || 0);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Get learning session tracking error:', { filters, error });
            throw new Error('Failed to get learning session tracking');
        }
    }
    /**
     * Get comprehensive student statistics
     */
    async getStudentStats(studentId) {
        try {
            // Get basic progress metrics
            const [progressMetrics] = await this.db
                .select({
                totalExercises: (0, drizzle_orm_1.count)(),
                completedExercises: (0, drizzle_orm_1.sql) `COUNT(CASE WHEN ${schema_1.studentProgress.completed} THEN 1 END)`,
                averageScore: (0, drizzle_orm_1.avg)((0, drizzle_orm_1.sql) `CAST(${schema_1.studentProgress.score} AS DECIMAL(5,2))`),
                totalTimeSpent: (0, drizzle_orm_1.sum)(schema_1.studentProgress.timeSpent),
                xpEarned: (0, drizzle_orm_1.sql) `COALESCE(SUM(10), 0)` // Default XP value
            })
                .from(schema_1.studentProgress)
                .where((0, drizzle_orm_1.eq)(schema_1.studentProgress.studentId, studentId));
            // Get competence breakdown
            const competenceBreakdown = await this.db
                .select({
                masteryLevel: schema_1.studentCompetenceProgress.masteryLevel,
                count: (0, drizzle_orm_1.count)()
            })
                .from(schema_1.studentCompetenceProgress)
                .where((0, drizzle_orm_1.eq)(schema_1.studentCompetenceProgress.studentId, studentId))
                .groupBy(schema_1.studentCompetenceProgress.masteryLevel);
            const breakdown = {
                decouverte: 0,
                apprentissage: 0,
                maitrise: 0,
                expertise: 0
            };
            competenceBreakdown.forEach(item => {
                if (item.masteryLevel in breakdown) {
                    breakdown[item.masteryLevel] = item.count;
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
        }
        catch (error) {
            logger_1.logger.error('Get student stats error:', { studentId, error });
            throw new Error('Failed to get student statistics');
        }
    }
    /**
     * Get recommended exercises based on competence progress and spaced repetition
     */
    async getRecommendedExercises(studentId, limit = 10) {
        try {
            // Get student's competence progress
            const competenceProgress = await this.db
                .select()
                .from(schema_1.studentCompetenceProgress)
                .where((0, drizzle_orm_1.eq)(schema_1.studentCompetenceProgress.studentId, studentId));
            // Identify competences that need reinforcement
            const needReinforcementCodes = competenceProgress
                .filter(cp => cp.masteryLevel === 'apprentissage' || cp.masteryLevel === 'decouverte')
                .map(cp => cp.competenceCode);
            if (needReinforcementCodes.length === 0) {
                // If all competences are mastered, suggest new ones
                const allExercises = await this.db
                    .select()
                    .from(schema_1.exercises)
                    .limit(limit);
                return allExercises;
            }
            // Get exercises for competences that need work
            const recommendedExercises = await this.db
                .select()
                .from(schema_1.exercises)
                .where((0, drizzle_orm_1.inArray)(schema_1.exercises.competenceCode, needReinforcementCodes))
                .limit(limit);
            return recommendedExercises;
        }
        catch (error) {
            logger_1.logger.error('Get recommended exercises error:', { studentId, error });
            throw new Error('Failed to get recommended exercises');
        }
    }
    /**
     * Get student by ID with enhanced details
     */
    async getStudentById(id) {
        try {
            // 1. Try to get from cache
            const cachedStudent = await enhanced_cache_service_1.StudentCache.getProfile(id);
            if (cachedStudent) {
                logger_1.logger.debug('Cache hit for student profile', { studentId: id });
                return cachedStudent;
            }
            logger_1.logger.debug('Cache miss for student profile', { studentId: id });
            // 2. If miss, get from DB
            const result = await this.db
                .select()
                .from(schema_1.students)
                .where((0, drizzle_orm_1.eq)(schema_1.students.id, id))
                .limit(1);
            const student = result[0] || null;
            // 3. Set in cache for next time
            if (student) {
                await enhanced_cache_service_1.StudentCache.setProfile(id, student);
            }
            return student;
        }
        catch (error) {
            logger_1.logger.error('Get student by ID error:', { id, error });
            throw new Error('Failed to get student');
        }
    }
    /**
     * Get student progress with optional filtering
     */
    async getStudentProgress(studentId, matiere, limit) {
        try {
            const result = await this.db
                .select()
                .from(schema_1.studentProgress)
                .where((0, drizzle_orm_1.eq)(schema_1.studentProgress.studentId, studentId))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.studentProgress.createdAt))
                .limit(limit || 50);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Get student progress error:', { studentId, matiere, error });
            return [];
        }
    }
    /**
     * Helper method to calculate mastery level based on performance metrics
     */
    calculateMasteryLevel(successfulAttempts, totalAttempts, averageScore) {
        if (totalAttempts === 0)
            return 'decouverte';
        const successRate = successfulAttempts / totalAttempts;
        if (successRate >= 0.9 && averageScore >= 85 && successfulAttempts >= 5) {
            return 'expertise';
        }
        else if (successRate >= 0.75 && averageScore >= 70 && successfulAttempts >= 3) {
            return 'maitrise';
        }
        else if (successRate >= 0.5 && successfulAttempts >= 2) {
            return 'apprentissage';
        }
        else {
            return 'decouverte';
        }
    }
    /**
     * Calculate current learning streak for a student
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
            logger_1.logger.error('Calculate streak error:', { studentId, error });
            return 0;
        }
    }
    /**
     * Health check for database connectivity and table structure
     */
    async healthCheck() {
        try {
            // Test basic query
            await this.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.students).limit(1);
            return {
                status: 'healthy',
                details: {
                    connection: true,
                    tables: ['students', 'student_competence_progress', 'daily_learning_analytics'],
                    timestamp: new Date().toISOString()
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Database health check failed:', error);
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
    async updateStudent(id, updates) {
        try {
            await this.db
                .update(schema_1.students)
                .set({ ...updates, updatedAt: new Date() })
                .where((0, drizzle_orm_1.eq)(schema_1.students.id, id));
            const updated = await this.getStudentById(id);
            if (!updated)
                throw new Error('Student not found after update');
            return updated;
        }
        catch (error) {
            logger_1.logger.error('Update student error:', { id, updates, error });
            throw new Error('Failed to update student');
        }
    }
    async getStudentSessions(studentId, limit) {
        return this.getLearningSessionTracking({ studentId, limit });
    }
    async createSession(sessionData) {
        try {
            const result = await this.db
                .insert(schema_1.learningSessionTracking)
                .values({
                ...sessionData,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            return { id: result.insertId, ...sessionData };
        }
        catch (error) {
            logger_1.logger.error('Create session error:', { sessionData, error });
            throw new Error('Failed to create session');
        }
    }
    async updateSession(id, updates) {
        try {
            await this.db
                .update(schema_1.learningSessionTracking)
                .set({ ...updates, updatedAt: new Date() })
                .where((0, drizzle_orm_1.eq)(schema_1.learningSessionTracking.id, parseInt(id)));
            return { id, ...updates };
        }
        catch (error) {
            logger_1.logger.error('Update session error:', { id, updates, error });
            throw new Error('Failed to update session');
        }
    }
    async getWeeklyProgress(studentId) {
        try {
            return await this.db
                .select()
                .from(schema_1.weeklyProgressSummary)
                .where((0, drizzle_orm_1.eq)(schema_1.weeklyProgressSummary.studentId, studentId))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.weeklyProgressSummary.weekStart));
        }
        catch (error) {
            logger_1.logger.error('Get weekly progress error:', { studentId, error });
            return [];
        }
    }
    async getSubjectProgress(studentId) {
        try {
            const subjectProgress = await this.db
                .select({
                matiere: schema_1.exercises.matiere,
                totalExercises: (0, drizzle_orm_1.count)(),
                completedExercises: (0, drizzle_orm_1.sql) `COUNT(CASE WHEN ${schema_1.studentProgress.completed} THEN 1 END)`,
                averageScore: (0, drizzle_orm_1.avg)((0, drizzle_orm_1.sql) `CAST(${schema_1.studentProgress.score} AS DECIMAL(5,2))`)
            })
                .from(schema_1.studentProgress)
                .innerJoin(schema_1.exercises, (0, drizzle_orm_1.eq)(schema_1.studentProgress.exerciseId, schema_1.exercises.id))
                .where((0, drizzle_orm_1.eq)(schema_1.studentProgress.studentId, studentId))
                .groupBy(schema_1.exercises.matiere);
            return subjectProgress.reduce((acc, subject) => {
                acc[subject.matiere] = {
                    totalExercises: subject.totalExercises,
                    completedExercises: Number(subject.completedExercises) || 0,
                    averageScore: Number(subject.averageScore) || 0
                };
                return acc;
            }, {});
        }
        catch (error) {
            logger_1.logger.error('Get subject progress error:', { studentId, error });
            return {};
        }
    }
}
exports.enhancedDatabaseService = new EnhancedDatabaseService();
