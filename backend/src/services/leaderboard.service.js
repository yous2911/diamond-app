"use strict";
/**
 * 🏆 Advanced Leaderboard Service
 *
 * Features:
 * - Real-time rankings across multiple categories
 * - Weekly/Monthly competitions
 * - Badge system with rarities
 * - Streak tracking and rewards
 * - Class-based and global leaderboards
 * - Performance analytics
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaderboardService = exports.LeaderboardService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const connection_1 = require("../db/connection");
const schema_1 = require("../db/schema");
const logger_1 = require("../utils/logger");
class LeaderboardService {
    /**
     * 🏆 Get leaderboard for specific type and category
     */
    async getLeaderboard(type = 'global', category = 'points', options = {}) {
        const { limit = 50, classId, studentId, period } = options;
        try {
            // Build query conditions
            const conditions = [
                (0, drizzle_orm_1.eq)(schema_1.leaderboards.type, type),
                (0, drizzle_orm_1.eq)(schema_1.leaderboards.category, category)
            ];
            if (classId && type === 'class') {
                conditions.push((0, drizzle_orm_1.eq)(schema_1.leaderboards.classId, classId));
            }
            if (period) {
                conditions.push((0, drizzle_orm_1.eq)(schema_1.leaderboards.period, period));
            }
            // Get leaderboard entries with student info
            const entries = await connection_1.db
                .select({
                leaderboard: schema_1.leaderboards,
                student: {
                    id: schema_1.students.id,
                    prenom: schema_1.students.prenom,
                    nom: schema_1.students.nom,
                    mascotteType: schema_1.students.mascotteType,
                    mascotteColor: schema_1.students.mascotteColor,
                    niveauScolaire: schema_1.students.niveauScolaire
                }
            })
                .from(schema_1.leaderboards)
                .innerJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.leaderboards.studentId, schema_1.students.id))
                .where((0, drizzle_orm_1.and)(...conditions))
                .orderBy((0, drizzle_orm_1.asc)(schema_1.leaderboards.rank))
                .limit(limit);
            // Get badges for all students in leaderboard
            const studentIds = entries.map(entry => entry.student.id);
            const badges = studentIds.length > 0
                ? await connection_1.db
                    .select()
                    .from(schema_1.studentBadges)
                    .where((0, drizzle_orm_1.inArray)(schema_1.studentBadges.studentId, studentIds))
                : [];
            // Get streaks if available
            const streakData = studentIds.length > 0
                ? await connection_1.db
                    .select({
                    studentId: schema_1.streaks.studentId,
                    currentStreak: schema_1.streaks.currentStreak
                })
                    .from(schema_1.streaks)
                    .where((0, drizzle_orm_1.inArray)(schema_1.streaks.studentId, studentIds))
                : [];
            // Format entries
            const formattedEntries = entries.map(entry => {
                const studentBadges = badges.filter(badge => badge.studentId === entry.student.id);
                const streak = streakData.find(s => s.studentId === entry.student.id);
                return {
                    studentId: entry.leaderboard.studentId,
                    rank: entry.leaderboard.rank,
                    score: entry.leaderboard.score,
                    previousRank: entry.leaderboard.previousRank || undefined,
                    rankChange: entry.leaderboard.rankChange,
                    student: entry.student,
                    badges: studentBadges,
                    streak: streak?.currentStreak,
                    metadata: entry.leaderboard.metadata
                };
            });
            // Calculate stats
            const totalParticipants = await connection_1.db
                .select({ count: (0, drizzle_orm_1.sql) `COUNT(*)` })
                .from(schema_1.leaderboards)
                .where((0, drizzle_orm_1.and)(...conditions));
            const avgScore = await connection_1.db
                .select({ avg: (0, drizzle_orm_1.sql) `AVG(${schema_1.leaderboards.score})` })
                .from(schema_1.leaderboards)
                .where((0, drizzle_orm_1.and)(...conditions));
            const stats = {
                totalParticipants: Number(totalParticipants[0]?.count) || 0,
                averageScore: Math.round(Number(avgScore[0]?.avg) || 0),
                topScore: formattedEntries[0]?.score || 0
            };
            // Add user-specific stats if studentId provided
            if (studentId) {
                const userEntry = formattedEntries.find(entry => entry.studentId === studentId);
                if (userEntry) {
                    stats.userRank = userEntry.rank;
                    stats.userScore = userEntry.score;
                    stats.percentile = Math.round(((stats.totalParticipants - userEntry.rank + 1) / stats.totalParticipants) * 100);
                }
            }
            return { entries: formattedEntries, stats };
        }
        catch (error) {
            logger_1.logger.error('Error fetching leaderboard:', { type, category, error: error.message });
            return { entries: [], stats: { totalParticipants: 0, averageScore: 0, topScore: 0 } };
        }
    }
    /**
     * 📊 Update leaderboard rankings for all categories
     */
    async updateAllLeaderboards() {
        try {
            logger_1.logger.info('🚀 Starting leaderboard update process');
            // Update different leaderboard types
            await Promise.all([
                this.updateGlobalLeaderboards(),
                this.updateWeeklyLeaderboards(),
                this.updateMonthlyLeaderboards(),
            ]);
            // Update badges after rankings
            await this.updateBadges();
            logger_1.logger.info('✅ All leaderboards updated successfully');
        }
        catch (error) {
            logger_1.logger.error('❌ Error updating leaderboards:', { error: error.message });
            throw error;
        }
    }
    /**
     * 🌍 Update global leaderboards
     */
    async updateGlobalLeaderboards() {
        // Points Leaderboard
        await this.updateLeaderboardCategory('global', 'points', `
      SELECT 
        s.id as studentId,
        s.totalPoints as score,
        NULL as classId
      FROM students s
      WHERE s.totalPoints > 0
      ORDER BY s.totalPoints DESC
    `);
        // Streak Leaderboard
        await this.updateLeaderboardCategory('global', 'streak', `
      SELECT 
        st.studentId,
        st.currentStreak as score,
        NULL as classId
      FROM streaks st
      INNER JOIN students s ON s.id = st.studentId
      WHERE st.currentStreak > 0
      ORDER BY st.currentStreak DESC, st.longestStreak DESC
    `);
        // Exercises Completed Leaderboard
        await this.updateLeaderboardCategory('global', 'exercises', `
      SELECT 
        sp.studentId,
        COUNT(DISTINCT sp.exerciseId) as score,
        NULL as classId
      FROM student_progress sp
      WHERE sp.completed = 1
      GROUP BY sp.studentId
      ORDER BY score DESC
    `);
        // Accuracy Leaderboard  
        await this.updateLeaderboardCategory('global', 'accuracy', `
      SELECT 
        sp.studentId,
        ROUND(AVG(sp.averageScore), 2) * 100 as score,
        NULL as classId
      FROM student_progress sp
      WHERE sp.averageScore > 0
      GROUP BY sp.studentId
      HAVING COUNT(sp.id) >= 5
      ORDER BY score DESC
    `);
    }
    /**
     * 📅 Update weekly leaderboards
     */
    async updateWeeklyLeaderboards() {
        const weekPeriod = this.getCurrentWeekPeriod();
        // Weekly points (from exercises completed this week)
        await this.updateLeaderboardCategory('weekly', 'points', `
      SELECT 
        sp.studentId,
        SUM(e.pointsRecompense) as score,
        NULL as classId
      FROM student_progress sp
      INNER JOIN exercises e ON e.id = sp.exerciseId
      WHERE sp.completed = 1 
        AND sp.completedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY sp.studentId
      ORDER BY score DESC
    `, weekPeriod);
        // Weekly exercises
        await this.updateLeaderboardCategory('weekly', 'exercises', `
      SELECT 
        sp.studentId,
        COUNT(DISTINCT sp.exerciseId) as score,
        NULL as classId
      FROM student_progress sp
      WHERE sp.completed = 1 
        AND sp.completedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY sp.studentId
      ORDER BY score DESC
    `, weekPeriod);
    }
    /**
     * 📅 Update monthly leaderboards
     */
    async updateMonthlyLeaderboards() {
        const monthPeriod = this.getCurrentMonthPeriod();
        // Monthly points
        await this.updateLeaderboardCategory('monthly', 'points', `
      SELECT 
        sp.studentId,
        SUM(e.pointsRecompense) as score,
        NULL as classId
      FROM student_progress sp
      INNER JOIN exercises e ON e.id = sp.exerciseId
      WHERE sp.completed = 1 
        AND sp.completedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY sp.studentId
      ORDER BY score DESC
    `, monthPeriod);
        // Monthly exercises
        await this.updateLeaderboardCategory('monthly', 'exercises', `
      SELECT 
        sp.studentId,
        COUNT(DISTINCT sp.exerciseId) as score,
        NULL as classId
      FROM student_progress sp
      WHERE sp.completed = 1 
        AND sp.completedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY sp.studentId
      ORDER BY score DESC
    `, monthPeriod);
    }
    /**
     * 🔄 Update specific leaderboard category
     */
    async updateLeaderboardCategory(type, category, query, period) {
        try {
            // Execute raw query to get rankings
            const results = await connection_1.db.execute(drizzle_orm_1.sql.raw(query));
            if (!results || results.length === 0) {
                return;
            }
            // Save previous rankings for rank change calculation
            const existingEntries = await connection_1.db
                .select()
                .from(schema_1.leaderboards)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.leaderboards.type, type), (0, drizzle_orm_1.eq)(schema_1.leaderboards.category, category), period ? (0, drizzle_orm_1.eq)(schema_1.leaderboards.period, period) : (0, drizzle_orm_1.sql) `1=1`));
            const previousRanks = new Map(existingEntries.map(entry => [entry.studentId, entry.rank]));
            // Clear existing entries for this category
            await connection_1.db
                .delete(schema_1.leaderboards)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.leaderboards.type, type), (0, drizzle_orm_1.eq)(schema_1.leaderboards.category, category), period ? (0, drizzle_orm_1.eq)(schema_1.leaderboards.period, period) : (0, drizzle_orm_1.sql) `1=1`));
            // Insert new rankings
            const newEntries = results.map((result, index) => {
                const rank = index + 1;
                const previousRank = previousRanks.get(result.studentId);
                const rankChange = previousRank ? previousRank - rank : 0;
                return {
                    type,
                    category,
                    studentId: result.studentId,
                    score: result.score,
                    rank,
                    previousRank,
                    rankChange,
                    period,
                    classId: result.classId || null,
                    metadata: {}
                };
            });
            if (newEntries.length > 0) {
                await connection_1.db.insert(schema_1.leaderboards).values(newEntries);
                logger_1.logger.info(`Updated ${type} ${category} leaderboard: ${newEntries.length} entries`);
            }
        }
        catch (error) {
            logger_1.logger.error(`Error updating ${type} ${category} leaderboard:`, { error: error.message });
        }
    }
    /**
     * 🏅 Badge System - Update badges based on achievements
     */
    async updateBadges() {
        try {
            const badgeDefinitions = this.getBadgeDefinitions();
            // Get all students
            const allStudents = await connection_1.db.select().from(schema_1.students);
            for (const student of allStudents) {
                await this.updateStudentBadges(student.id, badgeDefinitions);
            }
            logger_1.logger.info('✅ All badges updated');
        }
        catch (error) {
            logger_1.logger.error('❌ Error updating badges:', { error: error.message });
        }
    }
    /**
     * 🎖️ Update badges for a specific student
     */
    async updateStudentBadges(studentId, badgeDefinitions) {
        try {
            // Get student stats for badge evaluation
            const stats = await this.getStudentStats(studentId);
            for (const badge of badgeDefinitions) {
                const shouldHaveBadge = badge.criteria(stats);
                const hasBadge = await this.studentHasBadge(studentId, badge.type);
                if (shouldHaveBadge && !hasBadge) {
                    // Award new badge
                    await connection_1.db.insert(schema_1.studentBadges).values({
                        studentId,
                        badgeType: badge.type,
                        title: badge.title,
                        description: badge.description,
                        icon: badge.icon,
                        rarity: badge.rarity,
                        metadata: {}
                    });
                    logger_1.logger.info(`🏅 Badge awarded: ${badge.title} to student ${studentId}`);
                }
            }
        }
        catch (error) {
            logger_1.logger.error(`Error updating badges for student ${studentId}:`, { error: error.message });
        }
    }
    /**
     * 📈 Get comprehensive student stats for badge evaluation
     */
    async getStudentStats(studentId) {
        try {
            // Get basic student info
            const student = await connection_1.db
                .select()
                .from(schema_1.students)
                .where((0, drizzle_orm_1.eq)(schema_1.students.id, studentId))
                .limit(1);
            if (student.length === 0)
                return {};
            // Get streak info
            const streak = await connection_1.db
                .select()
                .from(schema_1.streaks)
                .where((0, drizzle_orm_1.eq)(schema_1.streaks.studentId, studentId))
                .limit(1);
            // Get progress stats
            const progressStats = await connection_1.db
                .select({
                totalExercises: (0, drizzle_orm_1.sql) `COUNT(*)`,
                completedExercises: (0, drizzle_orm_1.sql) `SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END)`,
                averageScore: (0, drizzle_orm_1.sql) `AVG(averageScore)`,
                totalTimeSpent: (0, drizzle_orm_1.sql) `SUM(totalTimeSpent)`
            })
                .from(schema_1.studentProgress)
                .where((0, drizzle_orm_1.eq)(schema_1.studentProgress.studentId, studentId));
            // Get leaderboard positions
            const leaderboardPositions = await connection_1.db
                .select()
                .from(schema_1.leaderboards)
                .where((0, drizzle_orm_1.eq)(schema_1.leaderboards.studentId, studentId));
            return {
                student: student[0],
                streak: streak[0],
                progress: progressStats[0],
                leaderboardPositions,
                totalPoints: student[0].totalPoints,
                currentStreak: streak[0]?.currentStreak || 0,
                longestStreak: streak[0]?.longestStreak || 0,
                completionRate: progressStats[0] ?
                    (Number(progressStats[0].completedExercises) / Number(progressStats[0].totalExercises)) * 100 : 0
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting student stats for ${studentId}:`, { error: error.message });
            return {};
        }
    }
    /**
     * 🏅 Badge Definitions - Criteria for earning badges
     */
    getBadgeDefinitions() {
        return [
            {
                type: 'first_place_global',
                title: '👑 Champion Mondial',
                description: 'Numéro 1 du classement mondial !',
                icon: '👑',
                rarity: 'legendary',
                criteria: (stats) => stats.leaderboardPositions?.some((pos) => pos.type === 'global' && pos.rank === 1)
            },
            {
                type: 'top_10_global',
                title: '🏆 Top 10 Mondial',
                description: 'Parmi les 10 meilleurs au monde !',
                icon: '🏆',
                rarity: 'epic',
                criteria: (stats) => stats.leaderboardPositions?.some((pos) => pos.type === 'global' && pos.rank <= 10)
            },
            {
                type: 'streak_master_7',
                title: '🔥 Maître des Séries - 7 jours',
                description: '7 jours consécutifs d\'apprentissage !',
                icon: '🔥',
                rarity: 'rare',
                criteria: (stats) => stats.currentStreak >= 7
            },
            {
                type: 'streak_master_30',
                title: '⚡ Légende des Séries - 30 jours',
                description: '30 jours consécutifs ! Incroyable !',
                icon: '⚡',
                rarity: 'legendary',
                criteria: (stats) => stats.currentStreak >= 30
            },
            {
                type: 'speed_demon',
                title: '💨 Démon de Vitesse',
                description: '50 exercices complétés en une semaine !',
                icon: '💨',
                rarity: 'epic',
                criteria: (stats) => {
                    // This would need weekly exercise count logic
                    return false; // Placeholder
                }
            },
            {
                type: 'perfectionist',
                title: '⭐ Perfectionniste',
                description: '95%+ de précision sur 50+ exercices !',
                icon: '⭐',
                rarity: 'epic',
                criteria: (stats) => stats.completionRate >= 95 &&
                    Number(stats.progress?.completedExercises) >= 50
            },
            {
                type: 'dedicated_learner',
                title: '📚 Apprenant Dévoué',
                description: '100 exercices complétés !',
                icon: '📚',
                rarity: 'rare',
                criteria: (stats) => Number(stats.progress?.completedExercises) >= 100
            },
            {
                type: 'point_collector',
                title: '💎 Collectionneur de Points',
                description: '1000 points accumulés !',
                icon: '💎',
                rarity: 'rare',
                criteria: (stats) => stats.totalPoints >= 1000
            }
        ];
    }
    /**
     * 🔍 Check if student has specific badge
     */
    async studentHasBadge(studentId, badgeType) {
        const existing = await connection_1.db
            .select()
            .from(schema_1.studentBadges)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.studentBadges.studentId, studentId), (0, drizzle_orm_1.eq)(schema_1.studentBadges.badgeType, badgeType)))
            .limit(1);
        return existing.length > 0;
    }
    /**
     * 📅 Utility functions for periods
     */
    getCurrentWeekPeriod() {
        const now = new Date();
        const year = now.getFullYear();
        const weekNumber = this.getWeekNumber(now);
        return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
    }
    getCurrentMonthPeriod() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        return `${year}-${month.toString().padStart(2, '0')}`;
    }
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
        return weekNo;
    }
    /**
     * 🏆 Get student's rank and position in specific leaderboard
     */
    async getStudentRank(studentId, type = 'global', category = 'points') {
        try {
            const entry = await connection_1.db
                .select()
                .from(schema_1.leaderboards)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.leaderboards.studentId, studentId), (0, drizzle_orm_1.eq)(schema_1.leaderboards.type, type), (0, drizzle_orm_1.eq)(schema_1.leaderboards.category, category)))
                .limit(1);
            if (entry.length === 0)
                return null;
            const totalParticipants = await connection_1.db
                .select({ count: (0, drizzle_orm_1.sql) `COUNT(*)` })
                .from(schema_1.leaderboards)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.leaderboards.type, type), (0, drizzle_orm_1.eq)(schema_1.leaderboards.category, category)));
            return {
                rank: entry[0].rank,
                score: entry[0].score,
                totalParticipants: Number(totalParticipants[0]?.count) || 0
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting student rank:', { studentId, type, category, error: error.message });
            return null;
        }
    }
    /**
     * 🎯 Get user-centric leaderboard view (user + nearby competitors)
     */
    async getUserCentricLeaderboard(studentId, type = 'global', category = 'points', range = 3) {
        try {
            const studentRank = await this.getStudentRank(studentId, type, category);
            if (!studentRank) {
                return {
                    userEntry: null,
                    competitors: [],
                    context: {
                        totalParticipants: 0,
                        userRank: 0,
                        percentile: 0,
                        beatingCount: 0
                    }
                };
            }
            const startRank = Math.max(1, studentRank.rank - range);
            const endRank = studentRank.rank + range;
            // Get the leaderboard section around the user
            const conditions = [
                (0, drizzle_orm_1.eq)(schema_1.leaderboards.type, type),
                (0, drizzle_orm_1.eq)(schema_1.leaderboards.category, category),
                (0, drizzle_orm_1.gte)(schema_1.leaderboards.rank, startRank),
                (0, drizzle_orm_1.lte)(schema_1.leaderboards.rank, endRank)
            ];
            const entries = await connection_1.db
                .select({
                leaderboard: schema_1.leaderboards,
                student: {
                    id: schema_1.students.id,
                    prenom: schema_1.students.prenom,
                    nom: schema_1.students.nom,
                    mascotteType: schema_1.students.mascotteType,
                    mascotteColor: schema_1.students.mascotteColor,
                    niveauScolaire: schema_1.students.niveauScolaire
                }
            })
                .from(schema_1.leaderboards)
                .innerJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.leaderboards.studentId, schema_1.students.id))
                .where((0, drizzle_orm_1.and)(...conditions))
                .orderBy((0, drizzle_orm_1.asc)(schema_1.leaderboards.rank));
            // Get badges for all students
            const studentIds = entries.map(entry => entry.student.id);
            const badges = studentIds.length > 0
                ? await connection_1.db
                    .select()
                    .from(schema_1.studentBadges)
                    .where((0, drizzle_orm_1.inArray)(schema_1.studentBadges.studentId, studentIds))
                : [];
            // Format entries
            const formattedEntries = entries.map(entry => {
                const studentBadges = badges.filter(badge => badge.studentId === entry.student.id);
                return {
                    studentId: entry.leaderboard.studentId,
                    rank: entry.leaderboard.rank,
                    score: entry.leaderboard.score,
                    previousRank: entry.leaderboard.previousRank || undefined,
                    rankChange: entry.leaderboard.rankChange,
                    student: entry.student,
                    badges: studentBadges,
                    metadata: entry.leaderboard.metadata
                };
            });
            const userEntry = formattedEntries.find(entry => entry.studentId === studentId) || null;
            const competitors = formattedEntries.filter(entry => entry.studentId !== studentId);
            // Find next target (person directly above user)
            const nextTarget = formattedEntries.find(entry => entry.rank === studentRank.rank - 1);
            // Calculate context
            const percentile = Math.round(((studentRank.totalParticipants - studentRank.rank + 1) / studentRank.totalParticipants) * 100);
            const beatingCount = studentRank.totalParticipants - studentRank.rank;
            return {
                userEntry,
                competitors,
                context: {
                    totalParticipants: studentRank.totalParticipants,
                    userRank: studentRank.rank,
                    percentile,
                    beatingCount,
                    nextTarget
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting user-centric leaderboard:', { studentId, error: error.message });
            return {
                userEntry: null,
                competitors: [],
                context: {
                    totalParticipants: 0,
                    userRank: 0,
                    percentile: 0,
                    beatingCount: 0
                }
            };
        }
    }
    /**
     * 🎯 Get nearby competitors (students close in ranking)
     */
    async getNearbyCompetitors(studentId, type = 'global', category = 'points', range = 5) {
        try {
            const studentRank = await this.getStudentRank(studentId, type, category);
            if (!studentRank)
                return [];
            const startRank = Math.max(1, studentRank.rank - range);
            const endRank = studentRank.rank + range;
            const { entries } = await this.getLeaderboard(type, category, {
                studentId
            });
            return entries.filter(entry => entry.rank >= startRank && entry.rank <= endRank);
        }
        catch (error) {
            logger_1.logger.error('Error getting nearby competitors:', { studentId, error: error.message });
            return [];
        }
    }
}
exports.LeaderboardService = LeaderboardService;
// Export singleton instance
exports.leaderboardService = new LeaderboardService();
