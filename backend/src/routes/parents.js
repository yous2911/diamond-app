"use strict";
/**
 * PARENT DASHBOARD API ROUTES
 * Provides comprehensive analytics and insights for parents
 * Integrates with existing SuperMemo, XP, and competency tracking systems
 */
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const drizzle_orm_1 = require("drizzle-orm");
const connection_js_1 = require("../db/connection.js");
const schema_js_1 = require("../db/schema.js");
// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================
const GetChildrenSchema = zod_1.z.object({
    parentId: zod_1.z.number().int().positive()
});
const GetChildAnalyticsSchema = zod_1.z.object({
    childId: zod_1.z.number().int().positive(),
    timeframe: zod_1.z.enum(['week', 'month', 'year']).default('week')
});
const GetSuperMemoStatsSchema = zod_1.z.object({
    childId: zod_1.z.number().int().positive(),
    days: zod_1.z.number().int().min(1).max(365).default(30)
});
// =============================================================================
// PARENT DASHBOARD ROUTES
// =============================================================================
const parentsRoutes = async (fastify) => {
    // Get all children for a parent
    fastify.get('/children/:parentId', {
        schema: {
            params: GetChildrenSchema,
            response: {
                200: zod_1.z.array(zod_1.z.object({
                    id: zod_1.z.number(),
                    name: zod_1.z.string(),
                    age: zod_1.z.number(),
                    level: zod_1.z.string(),
                    avatar: zod_1.z.string(),
                    totalXP: zod_1.z.number(),
                    currentStreak: zod_1.z.number(),
                    completedExercises: zod_1.z.number(),
                    masteredCompetencies: zod_1.z.number(),
                    currentLevel: zod_1.z.number(),
                    lastActivity: zod_1.z.string()
                }))
            }
        }
    }, async (request, reply) => {
        try {
            const { parentId } = request.params;
            // Get all children for the parent through the relationship table
            const children = await connection_js_1.db
                .select({
                id: schema_js_1.students.id,
                prenom: schema_js_1.students.prenom,
                nom: schema_js_1.students.nom,
                dateNaissance: schema_js_1.students.dateNaissance,
                niveau: schema_js_1.students.niveauActuel,
                totalXP: schema_js_1.students.xp,
                currentStreak: schema_js_1.students.serieJours,
                currentLevel: schema_js_1.students.xp, // Calculate level from XP
                lastLogin: schema_js_1.students.dernierAcces
            })
                .from(schema_js_1.students)
                .innerJoin(schema_js_1.parentStudentRelations, (0, drizzle_orm_1.eq)(schema_js_1.students.id, schema_js_1.parentStudentRelations.studentId))
                .where((0, drizzle_orm_1.eq)(schema_js_1.parentStudentRelations.parentId, parentId));
            // For each child, get additional stats
            const childrenWithStats = await Promise.all(children.map(async (child) => {
                // Get completed exercises count
                const [exerciseStats] = await connection_js_1.db
                    .select({ count: (0, drizzle_orm_1.count)(schema_js_1.studentProgress.id) })
                    .from(schema_js_1.studentProgress)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.studentProgress.studentId, child.id), (0, drizzle_orm_1.eq)(schema_js_1.studentProgress.completed, true)));
                // Get mastered competencies count
                const [competencyStats] = await connection_js_1.db
                    .select({ count: (0, drizzle_orm_1.count)(schema_js_1.studentCompetenceProgress.id) })
                    .from(schema_js_1.studentCompetenceProgress)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.studentCompetenceProgress.studentId, child.id), (0, drizzle_orm_1.eq)(schema_js_1.studentCompetenceProgress.masteryLevel, 'maitrise')));
                // Calculate age from date of birth
                const age = child.dateNaissance
                    ? Math.floor((Date.now() - new Date(child.dateNaissance).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                    : 7;
                return {
                    id: child.id,
                    name: `${child.prenom} ${child.nom}`,
                    age,
                    level: child.niveau,
                    avatar: '👧', // Default avatar, could be stored in DB
                    totalXP: child.totalXP || 0,
                    currentStreak: child.currentStreak || 0,
                    completedExercises: exerciseStats.count || 0,
                    masteredCompetencies: competencyStats.count || 0,
                    currentLevel: child.currentLevel || 1,
                    lastActivity: child.lastLogin?.toISOString() || new Date().toISOString()
                };
            }));
            return reply.code(200).send(childrenWithStats);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            fastify.log.error({ err }, 'Error fetching children');
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });
    // Get detailed analytics for a specific child
    fastify.get('/analytics/:childId', {
        schema: {
            params: zod_1.z.object({ childId: zod_1.z.string() }),
            querystring: zod_1.z.object({
                timeframe: zod_1.z.enum(['week', 'month', 'year']).default('week')
            }),
            response: {
                200: zod_1.z.object({
                    weeklyProgress: zod_1.z.array(zod_1.z.number()),
                    recentAchievements: zod_1.z.array(zod_1.z.object({
                        id: zod_1.z.number(),
                        title: zod_1.z.string(),
                        icon: zod_1.z.string(),
                        date: zod_1.z.string(),
                        color: zod_1.z.string()
                    })),
                    competencyProgress: zod_1.z.array(zod_1.z.object({
                        domain: zod_1.z.string(),
                        progress: zod_1.z.number(),
                        total: zod_1.z.number(),
                        mastered: zod_1.z.number()
                    })),
                    learningPattern: zod_1.z.object({
                        bestTime: zod_1.z.string(),
                        averageSession: zod_1.z.string(),
                        preferredSubject: zod_1.z.string(),
                        difficultyTrend: zod_1.z.string()
                    })
                })
            }
        }
    }, async (request, reply) => {
        try {
            const childId = parseInt(request.params.childId);
            const { timeframe } = request.query;
            // Calculate date range based on timeframe
            const now = new Date();
            const startDate = new Date();
            switch (timeframe) {
                case 'week':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(now.getMonth() - 1);
                    break;
                case 'year':
                    startDate.setFullYear(now.getFullYear() - 1);
                    break;
            }
            // Get weekly progress (7 days of data)
            const weeklyProgress = [];
            for (let i = 6; i >= 0; i--) {
                const dayStart = new Date();
                dayStart.setDate(now.getDate() - i);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(dayStart);
                dayEnd.setHours(23, 59, 59, 999);
                // Get exercises completed by this student on this day
                const completedExercises = await connection_js_1.db
                    .select({
                    exerciseId: schema_js_1.studentProgress.exerciseId,
                    averageScore: schema_js_1.studentProgress.averageScore,
                    completedAt: schema_js_1.studentProgress.completedAt
                })
                    .from(schema_js_1.studentProgress)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.studentProgress.studentId, childId), (0, drizzle_orm_1.eq)(schema_js_1.studentProgress.completed, true), (0, drizzle_orm_1.gte)(schema_js_1.studentProgress.completedAt || schema_js_1.studentProgress.updatedAt, dayStart), (0, drizzle_orm_1.lte)(schema_js_1.studentProgress.completedAt || schema_js_1.studentProgress.updatedAt, dayEnd)));
                const dayStats = {
                    count: completedExercises.length,
                    avgScore: completedExercises.length > 0
                        ? completedExercises.reduce((sum, e) => sum + parseFloat((e.averageScore ?? 0).toString()), 0) / completedExercises.length
                        : 0
                };
                // Convert to percentage (assuming 100% is 10 exercises with 90%+ score)
                const score = dayStats.avgScore || 0;
                const exerciseCount = dayStats.count || 0;
                const progressPercent = Math.min(100, (exerciseCount * (score / 100)) * 10);
                weeklyProgress.push(Math.round(progressPercent));
            }
            // Get recent achievements
            const achievements = await connection_js_1.db
                .select({
                id: schema_js_1.studentAchievements.id,
                achievementType: schema_js_1.studentAchievements.achievementType,
                title: schema_js_1.studentAchievements.title,
                description: schema_js_1.studentAchievements.description,
                earnedAt: schema_js_1.studentAchievements.unlockedAt
            })
                .from(schema_js_1.studentAchievements)
                .where((0, drizzle_orm_1.eq)(schema_js_1.studentAchievements.studentId, childId))
                .orderBy((0, drizzle_orm_1.desc)(schema_js_1.studentAchievements.unlockedAt))
                .limit(5);
            const recentAchievements = achievements.map((ach, index) => ({
                id: ach.id,
                title: ach.title || (ach.achievementType === 'streak' ? 'Série de jours' :
                    ach.achievementType === 'level_up' ? 'Niveau supérieur!' :
                        ach.achievementType === 'competency_master' ? 'Compétence maîtrisée' :
                            'Récompense spéciale'),
                description: ach.description || 'Achievement débloqué',
                icon: ach.achievementType === 'streak' ? '🔥' :
                    ach.achievementType === 'level_up' ? '⭐' :
                        ach.achievementType === 'competency_master' ? '🎯' : '🏆',
                date: ach.earnedAt.toISOString(),
                color: ['bg-blue-500', 'bg-orange-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500'][index % 5]
            }));
            // Get competency progress by domain
            const competencyProgress = await connection_js_1.db
                .select({
                competencyCode: schema_js_1.studentCompetenceProgress.competenceCode,
                masteryLevel: schema_js_1.studentCompetenceProgress.masteryLevel,
                practiceCount: schema_js_1.studentCompetenceProgress.progressPercent
            })
                .from(schema_js_1.studentCompetenceProgress)
                .where((0, drizzle_orm_1.eq)(schema_js_1.studentCompetenceProgress.studentId, childId));
            // Group by domain (first 2 characters of competency code)
            const domainStats = {};
            competencyProgress.forEach(comp => {
                const domain = comp.competencyCode.substring(0, 2);
                const domainName = domain === 'FR' ? 'Français' :
                    domain === 'MA' ? 'Mathématiques' :
                        'Découverte du Monde';
                if (!domainStats[domainName]) {
                    domainStats[domainName] = { total: 0, mastered: 0, avgMastery: 0 };
                }
                // Convert masteryLevel string to number (decouverte=0, apprentissage=0.33, maitrise=0.66, expertise=1.0)
                const masteryLevelMap = {
                    'decouverte': 0,
                    'apprentissage': 0.33,
                    'maitrise': 0.66,
                    'expertise': 1.0
                };
                const masteryValue = masteryLevelMap[comp.masteryLevel || 'decouverte'] || 0;
                domainStats[domainName].total++;
                domainStats[domainName].avgMastery += masteryValue;
                if (masteryValue >= 0.8) {
                    domainStats[domainName].mastered++;
                }
            });
            const competencyData = Object.entries(domainStats).map(([domain, stats]) => ({
                domain,
                progress: Math.round((stats.avgMastery / stats.total) * 100),
                total: stats.total,
                mastered: stats.mastered
            }));
            // Calculate learning patterns
            // Note: sessions table only has id, studentId, expiresAt, createdAt
            // We'll use createdAt as session start and expiresAt as session end
            const sessionData = await connection_js_1.db
                .select({
                id: schema_js_1.sessions.id,
                createdAt: schema_js_1.sessions.createdAt,
                expiresAt: schema_js_1.sessions.expiresAt
            })
                .from(schema_js_1.sessions)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.sessions.studentId, childId), (0, drizzle_orm_1.gte)(schema_js_1.sessions.createdAt, startDate)));
            // Calculate average duration from createdAt and expiresAt
            const totalDuration = sessionData.reduce((sum, session) => {
                if (session.expiresAt && session.createdAt) {
                    return sum + (session.expiresAt.getTime() - session.createdAt.getTime());
                }
                return sum;
            }, 0);
            const avgDurationMs = sessionData.length > 0 ? totalDuration / sessionData.length : 0;
            const averageSessionMinutes = Math.round(avgDurationMs / 60000) || 15;
            const sessionStats = {
                avgDuration: avgDurationMs,
                totalSessions: sessionData.length
            };
            return reply.code(200).send({
                weeklyProgress,
                recentAchievements,
                competencyProgress: competencyData,
                learningPattern: {
                    bestTime: 'Matin (9h-11h)', // Could be calculated from session data
                    averageSession: `${averageSessionMinutes} min`,
                    preferredSubject: competencyData.length > 0 ? competencyData[0].domain : 'Mathématiques',
                    difficultyTrend: 'Progressive'
                }
            });
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            fastify.log.error({ err }, 'Error fetching child analytics');
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });
    // Get SuperMemo algorithm performance stats
    fastify.get('/supermemo/:childId', {
        schema: {
            params: zod_1.z.object({ childId: zod_1.z.string() }),
            querystring: zod_1.z.object({
                days: zod_1.z.string().optional().transform(val => val ? parseInt(val) : 30)
            }),
            response: {
                200: zod_1.z.object({
                    retention: zod_1.z.number(),
                    averageInterval: zod_1.z.number(),
                    stabilityIndex: zod_1.z.number(),
                    retrievalStrength: zod_1.z.number(),
                    totalReviews: zod_1.z.number(),
                    successRate: zod_1.z.number()
                })
            }
        }
    }, async (request, reply) => {
        try {
            const childId = parseInt(request.params.childId);
            const days = request.query.days || 30;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            // Get SuperMemo performance data from studentProgress
            const progressData = await connection_js_1.db
                .select({
                averageScore: schema_js_1.studentProgress.averageScore,
                exerciseId: schema_js_1.studentProgress.exerciseId,
                completedAt: schema_js_1.studentProgress.completedAt
            })
                .from(schema_js_1.studentProgress)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.studentProgress.studentId, childId), (0, drizzle_orm_1.eq)(schema_js_1.studentProgress.completed, true), (0, drizzle_orm_1.gte)(schema_js_1.studentProgress.completedAt || schema_js_1.studentProgress.updatedAt, startDate)));
            const superMemoStats = {
                avgScore: progressData.length > 0
                    ? progressData.reduce((sum, p) => sum + parseFloat((p.averageScore ?? 0).toString()), 0) / progressData.length
                    : 0,
                totalExercises: progressData.length,
                avgDifficulty: 0, // Not available in studentProgress
                successCount: progressData.length // All completed exercises are considered successful
            };
            const retention = superMemoStats.avgScore || 85;
            const totalReviews = superMemoStats.totalExercises || 0;
            const successRate = totalReviews > 0 ?
                (Number(superMemoStats.successCount) / totalReviews) * 100 : 0;
            return reply.code(200).send({
                retention: Math.round(retention * 10) / 10,
                averageInterval: 4.8, // Mock data - would calculate from SuperMemo intervals
                stabilityIndex: 8.7, // Mock data - would calculate from memory stability
                retrievalStrength: Math.round((retention / 100) * 100) / 100,
                totalReviews,
                successRate: Math.round(successRate * 10) / 10
            });
        }
        catch (error) {
            fastify.log.error('Error fetching SuperMemo stats:', error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });
    // Get detailed progress report (for exports, emails, etc.)
    fastify.get('/report/:childId', {
        schema: {
            params: zod_1.z.object({ childId: zod_1.z.string() }),
            querystring: zod_1.z.object({
                format: zod_1.z.enum(['json', 'pdf', 'email']).default('json'),
                period: zod_1.z.enum(['week', 'month', 'quarter']).default('month')
            })
        }
    }, async (request, reply) => {
        try {
            const childId = parseInt(request.params.childId);
            const { format, period } = request.query;
            // This would generate comprehensive reports
            // For now, return structured data that could be used for PDF generation or email
            const reportData = {
                childId,
                period,
                generatedAt: new Date().toISOString(),
                summary: {
                    totalLearningTime: '12h 30min',
                    exercisesCompleted: 89,
                    competenciesImproved: 15,
                    averageScore: 87.5,
                    streakRecord: 12
                },
                achievements: [
                    { type: 'Consistency', description: '7 days in a row' },
                    { type: 'Mastery', description: 'CP Maths completed' },
                    { type: 'Progress', description: 'Level 8 reached' }
                ],
                recommendations: [
                    'Continue focus on reading comprehension',
                    'Introduce more challenging math problems',
                    'Great progress in vocabulary building'
                ]
            };
            return reply.code(200).send(reportData);
        }
        catch (error) {
            fastify.log.error('Error generating report:', error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });
};
exports.default = parentsRoutes;
