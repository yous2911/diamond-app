"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const drizzle_orm_1 = require("drizzle-orm");
const schema_mysql_cp2025_1 = require("../db/schema-mysql-cp2025");
const connection_1 = require("../db/connection");
async function sessionsRoutes(fastify) {
    const db = (0, connection_1.getDatabase)();
    // POST /api/sessions/start - Start learning session
    fastify.post('/start', {
        preHandler: [fastify.authenticate],
        schema: {
            body: {
                type: 'object',
                properties: {
                    studentId: { type: 'number' },
                    competencesPlanned: {
                        type: 'array',
                        items: { type: 'string' }
                    }
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const { studentId: bodyStudentId, competencesPlanned = [] } = request.body;
                const user = request.user;
                // Use authenticated user's ID if not provided in body
                const studentId = bodyStudentId || user.studentId;
                // Verify student access
                if (user.studentId !== studentId) {
                    return reply.status(403).send({
                        success: false,
                        error: {
                            message: 'Accès non autorisé',
                            code: 'FORBIDDEN'
                        }
                    });
                }
                // Check if there's already an active session for this student
                const activeSessions = await db
                    .select()
                    .from(schema_mysql_cp2025_1.learningSessions)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.learningSessions.studentId, studentId), (0, drizzle_orm_1.sql) `${schema_mysql_cp2025_1.learningSessions.endedAt} IS NULL`))
                    .limit(1);
                if (activeSessions.length > 0) {
                    return reply.status(400).send({
                        success: false,
                        error: {
                            message: 'Une session est déjà active',
                            code: 'SESSION_ALREADY_ACTIVE',
                            data: {
                                sessionId: activeSessions[0].id,
                                startedAt: activeSessions[0].startedAt
                            }
                        }
                    });
                }
                // Create new learning session
                const sessionResult = await db
                    .insert(schema_mysql_cp2025_1.learningSessions)
                    .values({
                    studentId,
                    startedAt: new Date(),
                    exercisesCompleted: 0,
                    totalXpGained: 0,
                    performanceScore: null,
                    sessionDuration: 0,
                    competencesWorked: JSON.stringify(competencesPlanned)
                });
                // Get the created session
                const newSession = await db
                    .select()
                    .from(schema_mysql_cp2025_1.learningSessions)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.learningSessions.studentId, studentId), (0, drizzle_orm_1.sql) `${schema_mysql_cp2025_1.learningSessions.endedAt} IS NULL`))
                    .orderBy((0, drizzle_orm_1.desc)(schema_mysql_cp2025_1.learningSessions.id))
                    .limit(1);
                return reply.send({
                    success: true,
                    data: {
                        session: newSession[0],
                        message: 'Session démarrée avec succès'
                    }
                });
            }
            catch (error) {
                console.error('Start session error:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        message: 'Erreur lors du démarrage de la session',
                        code: 'START_SESSION_ERROR'
                    }
                });
            }
        }
    });
    // POST /api/sessions/:id/end - End learning session
    fastify.post('/:id/end', {
        preHandler: [fastify.authenticate],
        schema: {
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string' }
                }
            },
            body: {
                type: 'object',
                properties: {
                    summary: {
                        type: 'object',
                        properties: {
                            exercisesCompleted: { type: 'number' },
                            totalXpGained: { type: 'number' },
                            averageScore: { type: 'number' },
                            competencesWorked: {
                                type: 'array',
                                items: { type: 'string' }
                            }
                        }
                    }
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const { id: sessionId } = request.params;
                const { summary = {} } = request.body;
                const user = request.user;
                // Get session and verify ownership
                const session = await db
                    .select()
                    .from(schema_mysql_cp2025_1.learningSessions)
                    .where((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.learningSessions.id, parseInt(sessionId)))
                    .limit(1);
                if (session.length === 0) {
                    return reply.status(404).send({
                        success: false,
                        error: {
                            message: 'Session introuvable',
                            code: 'SESSION_NOT_FOUND'
                        }
                    });
                }
                if (session[0].studentId !== user.studentId) {
                    return reply.status(403).send({
                        success: false,
                        error: {
                            message: 'Accès non autorisé',
                            code: 'FORBIDDEN'
                        }
                    });
                }
                if (session[0].endedAt) {
                    return reply.status(400).send({
                        success: false,
                        error: {
                            message: 'Session déjà terminée',
                            code: 'SESSION_ALREADY_ENDED'
                        }
                    });
                }
                // Calculate session metrics from exercise results
                const exerciseResultsData = await db
                    .select({
                    totalExercises: (0, drizzle_orm_1.sql) `COUNT(*)`,
                    totalXp: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_mysql_cp2025_1.exerciseResults.isCorrect} THEN 5 ELSE 1 END)`,
                    averageScore: (0, drizzle_orm_1.sql) `AVG(CASE WHEN ${schema_mysql_cp2025_1.exerciseResults.isCorrect} THEN 100 ELSE 0 END)`,
                    totalTimeSpent: (0, drizzle_orm_1.sql) `SUM(${schema_mysql_cp2025_1.exerciseResults.timeSpent})`
                })
                    .from(schema_mysql_cp2025_1.exerciseResults)
                    .where((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.exerciseResults.sessionId, parseInt(sessionId)))
                    .groupBy(schema_mysql_cp2025_1.exerciseResults.sessionId);
                const sessionMetrics = exerciseResultsData[0] || {
                    totalExercises: 0,
                    totalXp: 0,
                    averageScore: 0,
                    totalTimeSpent: 0
                };
                // Calculate session duration
                const startTime = new Date(session[0].startedAt).getTime();
                const endTime = Date.now();
                const sessionDuration = Math.floor((endTime - startTime) / 1000); // in seconds
                // Update session with end data
                await db
                    .update(schema_mysql_cp2025_1.learningSessions)
                    .set({
                    endedAt: new Date(),
                    exercisesCompleted: summary.exercisesCompleted || sessionMetrics.totalExercises,
                    totalXpGained: summary.totalXpGained || sessionMetrics.totalXp,
                    performanceScore: (summary.averageScore || sessionMetrics.averageScore)?.toString(),
                    sessionDuration,
                    competencesWorked: summary.competencesWorked
                        ? JSON.stringify(summary.competencesWorked)
                        : session[0].competencesWorked
                })
                    .where((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.learningSessions.id, parseInt(sessionId)));
                // Update student's total XP and stats
                await db.execute((0, drizzle_orm_1.sql) `
          UPDATE students 
          SET 
            total_xp = total_xp + ${sessionMetrics.totalXp},
            last_login = NOW(),
            updated_at = NOW()
          WHERE id = ${user.studentId}
        `);
                // Update student stats
                await db.execute((0, drizzle_orm_1.sql) `
          UPDATE student_stats 
          SET 
            total_exercises_completed = total_exercises_completed + ${sessionMetrics.totalExercises},
            total_correct_answers = total_correct_answers + (
              SELECT COUNT(*) FROM exercise_results 
              WHERE session_id = ${parseInt(sessionId)} AND is_correct = true
            ),
            total_time_spent = total_time_spent + ${sessionDuration},
            last_activity = NOW(),
            updated_at = NOW()
          WHERE student_id = ${user.studentId}
        `);
                // Get updated session
                const updatedSession = await db
                    .select()
                    .from(schema_mysql_cp2025_1.learningSessions)
                    .where((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.learningSessions.id, parseInt(sessionId)))
                    .limit(1);
                return reply.send({
                    success: true,
                    data: {
                        session: updatedSession[0],
                        metrics: {
                            duration: sessionDuration,
                            exercisesCompleted: sessionMetrics.totalExercises,
                            xpGained: sessionMetrics.totalXp,
                            averageScore: Math.round(sessionMetrics.averageScore),
                            timeSpent: sessionDuration
                        },
                        message: 'Session terminée avec succès'
                    }
                });
            }
            catch (error) {
                console.error('End session error:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        message: 'Erreur lors de la fin de session',
                        code: 'END_SESSION_ERROR'
                    }
                });
            }
        }
    });
    // GET /api/sessions/:id - Get session details
    fastify.get('/:id', {
        preHandler: [fastify.authenticate],
        schema: {
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string' }
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const { id: sessionId } = request.params;
                const user = request.user;
                // Get session with exercise results
                const sessionData = await db
                    .select()
                    .from(schema_mysql_cp2025_1.learningSessions)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.learningSessions.id, parseInt(sessionId)), (0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.learningSessions.studentId, user.studentId)))
                    .limit(1);
                if (sessionData.length === 0) {
                    return reply.status(404).send({
                        success: false,
                        error: {
                            message: 'Session introuvable',
                            code: 'SESSION_NOT_FOUND'
                        }
                    });
                }
                const session = sessionData[0];
                // Get exercise results for this session
                const exerciseResultsData = await db
                    .select({
                    id: schema_mysql_cp2025_1.exerciseResults.id,
                    exerciseId: schema_mysql_cp2025_1.exerciseResults.exerciseId,
                    competenceId: schema_mysql_cp2025_1.exerciseResults.competenceId,
                    isCorrect: schema_mysql_cp2025_1.exerciseResults.isCorrect,
                    timeSpent: schema_mysql_cp2025_1.exerciseResults.timeSpent,
                    hintsUsed: schema_mysql_cp2025_1.exerciseResults.hintsUsed,
                    supermemoQuality: schema_mysql_cp2025_1.exerciseResults.supermemoQuality,
                    answerGiven: schema_mysql_cp2025_1.exerciseResults.answerGiven,
                    createdAt: schema_mysql_cp2025_1.exerciseResults.createdAt,
                    competenceCode: schema_mysql_cp2025_1.competencesCp.code,
                    competenceName: schema_mysql_cp2025_1.competencesCp.nom
                })
                    .from(schema_mysql_cp2025_1.exerciseResults)
                    .leftJoin(schema_mysql_cp2025_1.competencesCp, (0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.exerciseResults.competenceId, schema_mysql_cp2025_1.competencesCp.id))
                    .where((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.exerciseResults.sessionId, parseInt(sessionId)))
                    .orderBy(schema_mysql_cp2025_1.exerciseResults.createdAt);
                return reply.send({
                    success: true,
                    data: {
                        session,
                        exerciseResults: exerciseResultsData,
                        summary: {
                            totalExercises: exerciseResultsData.length,
                            correctAnswers: exerciseResultsData.filter(r => r.isCorrect).length,
                            totalTimeSpent: exerciseResultsData.reduce((sum, r) => sum + (r.timeSpent || 0), 0),
                            averageScore: exerciseResultsData.length > 0
                                ? Math.round(exerciseResultsData.filter(r => r.isCorrect).length / exerciseResultsData.length * 100)
                                : 0,
                            competencesWorked: [...new Set(exerciseResultsData.map(r => r.competenceCode).filter(Boolean))]
                        }
                    }
                });
            }
            catch (error) {
                console.error('Get session error:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        message: 'Erreur lors de la récupération de la session',
                        code: 'GET_SESSION_ERROR'
                    }
                });
            }
        }
    });
    // GET /api/sessions/student/:studentId - Get student's sessions
    fastify.get('/student/:studentId', {
        preHandler: [fastify.authenticate],
        schema: {
            params: {
                type: 'object',
                required: ['studentId'],
                properties: {
                    studentId: { type: 'string' }
                }
            },
            querystring: {
                type: 'object',
                properties: {
                    limit: { type: 'number', default: 10 },
                    offset: { type: 'number', default: 0 },
                    status: { type: 'string', enum: ['active', 'completed', 'all'] }
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const { studentId } = request.params;
                const { limit = 10, offset = 0, status = 'all' } = request.query;
                const user = request.user;
                // Verify student access
                if (user.studentId !== parseInt(studentId)) {
                    return reply.status(403).send({
                        success: false,
                        error: {
                            message: 'Accès non autorisé',
                            code: 'FORBIDDEN'
                        }
                    });
                }
                // Build query with status filter
                let baseQuery = db
                    .select()
                    .from(schema_mysql_cp2025_1.learningSessions);
                let query;
                if (status === 'active') {
                    query = baseQuery.where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.learningSessions.studentId, parseInt(studentId)), (0, drizzle_orm_1.sql) `${schema_mysql_cp2025_1.learningSessions.endedAt} IS NULL`));
                }
                else if (status === 'completed') {
                    query = baseQuery.where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.learningSessions.studentId, parseInt(studentId)), (0, drizzle_orm_1.sql) `${schema_mysql_cp2025_1.learningSessions.endedAt} IS NOT NULL`));
                }
                else {
                    query = baseQuery.where((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.learningSessions.studentId, parseInt(studentId)));
                }
                const sessions = await query
                    .orderBy((0, drizzle_orm_1.desc)(schema_mysql_cp2025_1.learningSessions.startedAt))
                    .limit(limit)
                    .offset(offset);
                // Get summary statistics
                const totalSessions = await db
                    .select({ count: (0, drizzle_orm_1.sql) `COUNT(*)` })
                    .from(schema_mysql_cp2025_1.learningSessions)
                    .where((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.learningSessions.studentId, parseInt(studentId)));
                const activeSessions = await db
                    .select({ count: (0, drizzle_orm_1.sql) `COUNT(*)` })
                    .from(schema_mysql_cp2025_1.learningSessions)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.learningSessions.studentId, parseInt(studentId)), (0, drizzle_orm_1.sql) `${schema_mysql_cp2025_1.learningSessions.endedAt} IS NULL`));
                return reply.send({
                    success: true,
                    data: {
                        sessions,
                        pagination: {
                            limit,
                            offset,
                            total: totalSessions[0].count
                        },
                        summary: {
                            totalSessions: totalSessions[0].count,
                            activeSessions: activeSessions[0].count,
                            completedSessions: totalSessions[0].count - activeSessions[0].count
                        }
                    }
                });
            }
            catch (error) {
                console.error('Get student sessions error:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        message: 'Erreur lors de la récupération des sessions',
                        code: 'GET_STUDENT_SESSIONS_ERROR'
                    }
                });
            }
        }
    });
    // GET /api/sessions/active - Get current active session
    fastify.get('/active', {
        preHandler: [fastify.authenticate],
        handler: async (request, reply) => {
            try {
                const user = request.user;
                // Get active session for authenticated user
                const activeSession = await db
                    .select()
                    .from(schema_mysql_cp2025_1.learningSessions)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_mysql_cp2025_1.learningSessions.studentId, user.studentId), (0, drizzle_orm_1.sql) `${schema_mysql_cp2025_1.learningSessions.endedAt} IS NULL`))
                    .orderBy((0, drizzle_orm_1.desc)(schema_mysql_cp2025_1.learningSessions.startedAt))
                    .limit(1);
                if (activeSession.length === 0) {
                    return reply.send({
                        success: true,
                        data: {
                            hasActiveSession: false,
                            session: null
                        }
                    });
                }
                const session = activeSession[0];
                // Calculate current session duration
                const startTime = new Date(session.startedAt).getTime();
                const currentTime = Date.now();
                const currentDuration = Math.floor((currentTime - startTime) / 1000);
                return reply.send({
                    success: true,
                    data: {
                        hasActiveSession: true,
                        session: {
                            ...session,
                            currentDuration
                        }
                    }
                });
            }
            catch (error) {
                console.error('Get active session error:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        message: 'Erreur lors de la récupération de la session active',
                        code: 'GET_ACTIVE_SESSION_ERROR'
                    }
                });
            }
        }
    });
}
exports.default = sessionsRoutes;
