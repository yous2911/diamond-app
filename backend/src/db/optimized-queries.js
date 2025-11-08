"use strict";
/**
 * Optimized Database Queries for RevEd Kids Backend
 * Implements N+1 problem prevention, efficient joins, and query optimization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendedExercises = exports.batchUpdateProgress = exports.getLearningAnalytics = exports.getStudentsNeedingRevision = exports.getActiveSessions = exports.getCompetenceProgressSummary = exports.getExercisesWithStats = exports.getStudentWithProgress = exports.optimizedQueries = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const connection_1 = require("./connection");
const schema_1 = require("./schema");
const logger_1 = require("../utils/logger");
class OptimizedQueries {
    /**
     * Get student with all related data in a single optimized query
     * Prevents N+1 problem by using JOIN instead of multiple queries
     */
    async getStudentWithProgress(studentId) {
        const startTime = Date.now();
        try {
            // Single query with LEFT JOINs to get all related data
            const result = await connection_1.db
                .select({
                // Student fields
                student: schema_1.students,
                // Progress fields
                progress: schema_1.studentProgress,
                // Exercise fields (for current exercises)
                exercise: schema_1.exercises,
                // Learning path fields
                learningPath: schema_1.studentLearningPath,
            })
                .from(schema_1.students)
                .leftJoin(schema_1.studentProgress, (0, drizzle_orm_1.eq)(schema_1.students.id, schema_1.studentProgress.studentId))
                .leftJoin(schema_1.exercises, (0, drizzle_orm_1.eq)(schema_1.studentProgress.exerciseId, schema_1.exercises.id))
                .leftJoin(schema_1.studentLearningPath, (0, drizzle_orm_1.eq)(schema_1.students.id, schema_1.studentLearningPath.studentId))
                .where((0, drizzle_orm_1.eq)(schema_1.students.id, studentId));
            if (result.length === 0)
                return null;
            // Group results to prevent data duplication
            const student = result[0].student;
            const progressMap = new Map();
            const exerciseMap = new Map();
            const learningPathMap = new Map();
            result.forEach(row => {
                if (row.progress && !progressMap.has(row.progress.id)) {
                    progressMap.set(row.progress.id, row.progress);
                }
                if (row.exercise && !exerciseMap.has(row.exercise.id)) {
                    exerciseMap.set(row.exercise.id, row.exercise);
                }
                if (row.learningPath && !learningPathMap.has(row.learningPath.id)) {
                    learningPathMap.set(row.learningPath.id, row.learningPath);
                }
            });
            const queryTime = Date.now() - startTime;
            logger_1.logger.debug('Student with progress query completed', {
                studentId,
                queryTime,
                progressCount: progressMap.size,
                exerciseCount: exerciseMap.size,
                learningPathCount: learningPathMap.size
            });
            return {
                student,
                progress: Array.from(progressMap.values()),
                currentExercises: Array.from(exerciseMap.values()),
                learningPath: Array.from(learningPathMap.values()),
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get student with progress', { studentId, error });
            throw error;
        }
    }
    /**
     * Get exercises with completion statistics
     * Uses efficient aggregation to prevent multiple queries
     */
    async getExercisesWithStats(filters = {}, options = {}) {
        const startTime = Date.now();
        try {
            const { limit = 50, offset = 0 } = options;
            // Build WHERE conditions
            const conditions = [];
            if (filters.matiere)
                conditions.push((0, drizzle_orm_1.eq)(schema_1.exercises.matiere, filters.matiere));
            if (filters.niveau)
                conditions.push((0, drizzle_orm_1.eq)(schema_1.exercises.niveau, filters.niveau));
            if (filters.difficulte)
                conditions.push((0, drizzle_orm_1.eq)(schema_1.exercises.difficulte, filters.difficulte));
            if (filters.estActif !== undefined)
                conditions.push((0, drizzle_orm_1.eq)(schema_1.exercises.estActif, filters.estActif));
            // Single query with aggregation to get exercises and their stats
            const result = await connection_1.db
                .select({
                exercise: schema_1.exercises,
                totalStudents: (0, drizzle_orm_1.sql) `COUNT(DISTINCT ${schema_1.studentProgress.studentId})`,
                completedStudents: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.studentProgress.completed} = 1 THEN 1 ELSE 0 END)`,
                totalAttempts: (0, drizzle_orm_1.sql) `SUM(${schema_1.studentProgress.totalAttempts})`,
                averageScore: (0, drizzle_orm_1.sql) `AVG(${schema_1.studentProgress.averageScore})`,
            })
                .from(schema_1.exercises)
                .leftJoin(schema_1.studentProgress, (0, drizzle_orm_1.eq)(schema_1.exercises.id, schema_1.studentProgress.exerciseId))
                .where((0, drizzle_orm_1.and)(...conditions))
                .groupBy(schema_1.exercises.id)
                .limit(limit)
                .offset(offset)
                .orderBy((0, drizzle_orm_1.desc)(schema_1.exercises.createdAt));
            const exercisesWithStats = result.map(row => ({
                exercise: row.exercise,
                completionRate: row.totalStudents > 0 ? (row.completedStudents / row.totalStudents) * 100 : 0,
                averageScore: row.averageScore || 0,
                totalAttempts: row.totalAttempts || 0,
            }));
            const queryTime = Date.now() - startTime;
            logger_1.logger.debug('Exercises with stats query completed', {
                queryTime,
                resultCount: exercisesWithStats.length,
                filters
            });
            return exercisesWithStats;
        }
        catch (error) {
            logger_1.logger.error('Failed to get exercises with stats', { filters, error });
            throw error;
        }
    }
    /**
     * Get students' progress summary for a specific competence
     * Optimized for dashboard analytics
     */
    async getCompetenceProgressSummary(competenceCode, studentIds) {
        const startTime = Date.now();
        try {
            // Build conditions
            const conditions = [(0, drizzle_orm_1.eq)(schema_1.studentProgress.competenceCode, competenceCode)];
            if (studentIds && studentIds.length > 0) {
                conditions.push((0, drizzle_orm_1.inArray)(schema_1.studentProgress.studentId, studentIds));
            }
            const result = await connection_1.db
                .select({
                studentId: schema_1.students.id,
                studentName: (0, drizzle_orm_1.sql) `CONCAT(${schema_1.students.prenom}, ' ', ${schema_1.students.nom})`,
                totalExercises: (0, drizzle_orm_1.sql) `COUNT(${schema_1.studentProgress.id})`,
                completedExercises: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.studentProgress.completed} = 1 THEN 1 ELSE 0 END)`,
                averageScore: (0, drizzle_orm_1.sql) `AVG(${schema_1.studentProgress.averageScore})`,
                bestMasteryLevel: (0, drizzle_orm_1.sql) `MAX(${schema_1.studentProgress.masteryLevel})`,
                lastActivity: (0, drizzle_orm_1.sql) `MAX(${schema_1.studentProgress.lastAttemptAt})`,
            })
                .from(schema_1.studentProgress)
                .innerJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.studentProgress.studentId, schema_1.students.id))
                .where((0, drizzle_orm_1.and)(...conditions))
                .groupBy(schema_1.students.id, schema_1.students.prenom, schema_1.students.nom)
                .orderBy((0, drizzle_orm_1.desc)((0, drizzle_orm_1.sql) `AVG(${schema_1.studentProgress.averageScore})`));
            const summary = result.map(row => ({
                studentId: row.studentId,
                studentName: row.studentName,
                totalExercises: row.totalExercises,
                completedExercises: row.completedExercises,
                averageScore: row.averageScore || 0,
                masteryLevel: row.bestMasteryLevel || 'not_started',
                lastActivity: row.lastActivity,
            }));
            const queryTime = Date.now() - startTime;
            logger_1.logger.debug('Competence progress summary query completed', {
                competenceCode,
                queryTime,
                resultCount: summary.length
            });
            return summary;
        }
        catch (error) {
            logger_1.logger.error('Failed to get competence progress summary', { competenceCode, error });
            throw error;
        }
    }
    /**
     * Get active sessions with student information
     * Optimized for session management
     */
    async getActiveSessions(limit = 100) {
        const startTime = Date.now();
        try {
            const result = await connection_1.db
                .select({
                session: schema_1.sessions,
                student: {
                    id: schema_1.students.id,
                    prenom: schema_1.students.prenom,
                    nom: schema_1.students.nom,
                    niveauActuel: schema_1.students.niveauActuel,
                }
            })
                .from(schema_1.sessions)
                .innerJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.sessions.studentId, schema_1.students.id))
                .where((0, drizzle_orm_1.gt)(schema_1.sessions.expiresAt, new Date()))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.sessions.createdAt))
                .limit(limit);
            const queryTime = Date.now() - startTime;
            logger_1.logger.debug('Active sessions query completed', {
                queryTime,
                sessionCount: result.length
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to get active sessions', { error });
            throw error;
        }
    }
    /**
     * Get students requiring revision (spaced repetition)
     * Optimized for educational scheduling
     */
    async getStudentsNeedingRevision(date = new Date()) {
        const startTime = Date.now();
        try {
            const result = await connection_1.db
                .select({
                studentId: schema_1.students.id,
                studentName: (0, drizzle_orm_1.sql) `CONCAT(${schema_1.students.prenom}, ' ', ${schema_1.students.nom})`,
                exerciseId: schema_1.exercises.id,
                exerciseTitle: schema_1.exercises.titre,
                competenceCode: schema_1.studentProgress.competenceCode,
                scheduledAt: schema_1.studentProgress.reviewScheduledAt,
                masteryLevel: schema_1.studentProgress.masteryLevel,
                lastAttempt: schema_1.studentProgress.lastAttemptAt,
            })
                .from(schema_1.studentProgress)
                .innerJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.studentProgress.studentId, schema_1.students.id))
                .innerJoin(schema_1.exercises, (0, drizzle_orm_1.eq)(schema_1.studentProgress.exerciseId, schema_1.exercises.id))
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.studentProgress.needsReview, true), (0, drizzle_orm_1.or)((0, drizzle_orm_1.isNull)(schema_1.studentProgress.reviewScheduledAt), (0, drizzle_orm_1.lte)(schema_1.studentProgress.reviewScheduledAt, date)), (0, drizzle_orm_1.eq)(schema_1.exercises.estActif, true)))
                .orderBy((0, drizzle_orm_1.asc)(schema_1.studentProgress.reviewScheduledAt), (0, drizzle_orm_1.desc)(schema_1.studentProgress.lastAttemptAt));
            // Calculate priority based on mastery level and time since last attempt
            const studentsWithPriority = result.map(row => {
                let priority = 'medium';
                const daysSinceLastAttempt = row.lastAttempt
                    ? Math.floor((date.getTime() - row.lastAttempt.getTime()) / (1000 * 60 * 60 * 24))
                    : 999;
                if (row.masteryLevel === 'en_cours' && daysSinceLastAttempt > 7) {
                    priority = 'high';
                }
                else if (row.masteryLevel === 'maitrise' && daysSinceLastAttempt > 30) {
                    priority = 'high';
                }
                else if (daysSinceLastAttempt > 14) {
                    priority = 'medium';
                }
                else {
                    priority = 'low';
                }
                return {
                    studentId: row.studentId,
                    studentName: row.studentName,
                    exerciseId: row.exerciseId,
                    exerciseTitle: row.exerciseTitle,
                    competenceCode: row.competenceCode,
                    scheduledAt: row.scheduledAt,
                    priority,
                };
            });
            const queryTime = Date.now() - startTime;
            logger_1.logger.debug('Students needing revision query completed', {
                queryTime,
                resultCount: studentsWithPriority.length
            });
            return studentsWithPriority;
        }
        catch (error) {
            logger_1.logger.error('Failed to get students needing revision', { error });
            throw error;
        }
    }
    /**
     * Get learning analytics for dashboard
     * Highly optimized aggregation query
     */
    async getLearningAnalytics(studentId, dateRange) {
        const startTime = Date.now();
        try {
            // Build date condition
            const dateCondition = dateRange
                ? (0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_1.studentProgress.lastAttemptAt, dateRange.start), (0, drizzle_orm_1.lte)(schema_1.studentProgress.lastAttemptAt, dateRange.end))
                : undefined;
            const studentCondition = studentId ? (0, drizzle_orm_1.eq)(schema_1.studentProgress.studentId, studentId) : undefined;
            const whereCondition = (0, drizzle_orm_1.and)(dateCondition, studentCondition);
            // Parallel execution of multiple analytics queries
            const [overallStats, competenceStats, activityStats] = await Promise.all([
                // Overall statistics
                connection_1.db
                    .select({
                    totalStudents: (0, drizzle_orm_1.sql) `COUNT(DISTINCT ${schema_1.studentProgress.studentId})`,
                    totalExercises: (0, drizzle_orm_1.sql) `COUNT(DISTINCT ${schema_1.studentProgress.exerciseId})`,
                    completedExercises: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.studentProgress.completed} = 1 THEN 1 ELSE 0 END)`,
                    totalAttempts: (0, drizzle_orm_1.sql) `SUM(${schema_1.studentProgress.totalAttempts})`,
                    averageScore: (0, drizzle_orm_1.sql) `AVG(${schema_1.studentProgress.averageScore})`,
                    activeStudents: (0, drizzle_orm_1.sql) `COUNT(DISTINCT CASE WHEN ${schema_1.studentProgress.lastAttemptAt} >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN ${schema_1.studentProgress.studentId} END)`,
                })
                    .from(schema_1.studentProgress)
                    .where(whereCondition),
                // Top competences
                connection_1.db
                    .select({
                    competenceCode: schema_1.studentProgress.competenceCode,
                    completionRate: (0, drizzle_orm_1.sql) `(SUM(CASE WHEN ${schema_1.studentProgress.completed} = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*))`,
                    averageScore: (0, drizzle_orm_1.sql) `AVG(${schema_1.studentProgress.averageScore})`,
                    studentCount: (0, drizzle_orm_1.sql) `COUNT(DISTINCT ${schema_1.studentProgress.studentId})`,
                })
                    .from(schema_1.studentProgress)
                    .where(whereCondition)
                    .groupBy(schema_1.studentProgress.competenceCode)
                    .orderBy((0, drizzle_orm_1.desc)((0, drizzle_orm_1.sql) `AVG(${schema_1.studentProgress.averageScore})`))
                    .limit(10),
                // Activity trend (last 30 days)
                connection_1.db
                    .select({
                    date: (0, drizzle_orm_1.sql) `DATE(${schema_1.studentProgress.lastAttemptAt})`,
                    completions: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.studentProgress.completed} = 1 THEN 1 ELSE 0 END)`,
                    averageScore: (0, drizzle_orm_1.sql) `AVG(${schema_1.studentProgress.averageScore})`,
                })
                    .from(schema_1.studentProgress)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_1.studentProgress.lastAttemptAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), studentCondition))
                    .groupBy((0, drizzle_orm_1.sql) `DATE(${schema_1.studentProgress.lastAttemptAt})`)
                    .orderBy((0, drizzle_orm_1.asc)((0, drizzle_orm_1.sql) `DATE(${schema_1.studentProgress.lastAttemptAt})`))
            ]);
            const overall = overallStats[0] || {};
            const completionRate = (overall.totalAttempts || 0) > 0
                ? ((overall.completedExercises || 0) / (overall.totalAttempts || 0)) * 100
                : 0;
            const result = {
                totalStudents: overall.totalStudents || 0,
                totalExercises: overall.totalExercises || 0,
                completionRate,
                averageScore: overall.averageScore || 0,
                activeStudents: overall.activeStudents || 0,
                topCompetences: competenceStats,
                activityTrend: activityStats,
            };
            const queryTime = Date.now() - startTime;
            logger_1.logger.debug('Learning analytics query completed', {
                queryTime,
                studentId,
                totalStudents: result.totalStudents
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to get learning analytics', { studentId, error });
            throw error;
        }
    }
    /**
     * Batch update student progress to prevent N+1 problem
     */
    async batchUpdateProgress(updates) {
        const startTime = Date.now();
        try {
            // Use batch insert/update for efficiency
            const updatePromises = updates.map(update => connection_1.db
                .update(schema_1.studentProgress)
                .set({
                averageScore: (0, drizzle_orm_1.sql) `(${schema_1.studentProgress.averageScore} * ${schema_1.studentProgress.totalAttempts} + ${update.score}) / (${schema_1.studentProgress.totalAttempts} + 1)`,
                bestScore: (0, drizzle_orm_1.sql) `GREATEST(${schema_1.studentProgress.bestScore}, ${update.score})`,
                totalAttempts: (0, drizzle_orm_1.sql) `${schema_1.studentProgress.totalAttempts} + 1`,
                successfulAttempts: (0, drizzle_orm_1.sql) `${schema_1.studentProgress.successfulAttempts} + ${update.completed ? 1 : 0}`,
                totalTimeSpent: (0, drizzle_orm_1.sql) `${schema_1.studentProgress.totalTimeSpent} + ${update.timeSpent}`,
                completed: update.completed,
                lastAttemptAt: new Date(),
                updatedAt: new Date(),
            })
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.studentProgress.studentId, update.studentId), (0, drizzle_orm_1.eq)(schema_1.studentProgress.exerciseId, update.exerciseId))));
            await Promise.all(updatePromises);
            const queryTime = Date.now() - startTime;
            logger_1.logger.info('Batch progress update completed', {
                queryTime,
                updateCount: updates.length
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to batch update progress', { updateCount: updates.length, error });
            throw error;
        }
    }
    /**
     * Get recommended exercises for a student
     * Uses intelligent algorithm based on progress and learning path
     */
    async getRecommendedExercises(studentId, limit = 10) {
        const startTime = Date.now();
        try {
            // Complex query to get personalized exercise recommendations
            const result = await connection_1.db
                .select({
                exercise: schema_1.exercises,
                currentProgress: schema_1.studentProgress.masteryLevel,
                competenceProgress: (0, drizzle_orm_1.sql) `
            COALESCE(
              (SELECT AVG(sp2.progress_percent) 
               FROM student_progress sp2 
               WHERE sp2.student_id = ${studentId} 
               AND sp2.competence_code = ${schema_1.exercises.competenceCode}), 
              0
            )
          `,
                learningPathStatus: (0, drizzle_orm_1.sql) `
            COALESCE(
              (SELECT slp.status 
               FROM student_learning_path slp 
               WHERE slp.student_id = ${studentId} 
               AND slp.competence_code = ${schema_1.exercises.competenceCode}), 
              'available'
            )
          `,
                isCompleted: (0, drizzle_orm_1.sql) `
            COALESCE(
              (SELECT sp.completed 
               FROM student_progress sp 
               WHERE sp.student_id = ${studentId} 
               AND sp.exercise_id = ${schema_1.exercises.id}), 
              false
            )
          `,
            })
                .from(schema_1.exercises)
                .leftJoin(schema_1.studentProgress, (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.studentProgress.exerciseId, schema_1.exercises.id), (0, drizzle_orm_1.eq)(schema_1.studentProgress.studentId, studentId)))
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.exercises.estActif, true), (0, drizzle_orm_1.or)((0, drizzle_orm_1.isNull)(schema_1.studentProgress.completed), (0, drizzle_orm_1.eq)(schema_1.studentProgress.completed, false))))
                .limit(limit * 3) // Get more for filtering
                .orderBy((0, drizzle_orm_1.asc)(schema_1.exercises.ordre));
            // Calculate recommendation scores
            const recommendations = result
                .map(row => {
                let score = 50; // Base score
                let reason = 'Standard recommendation';
                // Boost score based on learning path
                if (row.learningPathStatus === 'in_progress') {
                    score += 30;
                    reason = 'Currently in learning path';
                }
                else if (row.learningPathStatus === 'available') {
                    score += 10;
                    reason = 'Available in learning path';
                }
                // Boost based on competence progress
                if (row.competenceProgress > 0 && row.competenceProgress < 100) {
                    score += 20;
                    reason = 'Continuing competence development';
                }
                // Penalize if too advanced
                if (row.competenceProgress < 30 && row.exercise.difficulte === 'maitrise') {
                    score -= 25;
                    reason = 'Too advanced for current level';
                }
                // Boost recent competences
                if (row.competenceProgress > 70) {
                    score += 15;
                    reason = 'Near mastery - good for reinforcement';
                }
                return {
                    exercise: row.exercise,
                    recommendationScore: score,
                    reason,
                };
            })
                .sort((a, b) => b.recommendationScore - a.recommendationScore)
                .slice(0, limit);
            const queryTime = Date.now() - startTime;
            logger_1.logger.debug('Recommended exercises query completed', {
                studentId,
                queryTime,
                resultCount: recommendations.length
            });
            return recommendations;
        }
        catch (error) {
            logger_1.logger.error('Failed to get recommended exercises', { studentId, error });
            throw error;
        }
    }
}
// Export singleton instance
exports.optimizedQueries = new OptimizedQueries();
// Export individual query methods for convenience
exports.getStudentWithProgress = exports.optimizedQueries.getStudentWithProgress, exports.getExercisesWithStats = exports.optimizedQueries.getExercisesWithStats, exports.getCompetenceProgressSummary = exports.optimizedQueries.getCompetenceProgressSummary, exports.getActiveSessions = exports.optimizedQueries.getActiveSessions, exports.getStudentsNeedingRevision = exports.optimizedQueries.getStudentsNeedingRevision, exports.getLearningAnalytics = exports.optimizedQueries.getLearningAnalytics, exports.batchUpdateProgress = exports.optimizedQueries.batchUpdateProgress, exports.getRecommendedExercises = exports.optimizedQueries.getRecommendedExercises;
