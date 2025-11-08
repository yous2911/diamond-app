"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
async function legacyExercisesRoutes(fastify) {
    // Get all exercises with filtering
    fastify.get('/', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    niveau: { type: 'string' },
                    matiere: { type: 'string' },
                    difficulty_level: { type: 'number' },
                    limit: { type: 'number', default: 20 },
                    offset: { type: 'number', default: 0 }
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const { niveau, matiere, difficulty_level, limit = 20, offset = 0 } = request.query;
                // Create database connection
                const connection = await promise_1.default.createConnection({
                    host: 'localhost',
                    user: 'root',
                    password: 'thisisREALLYIT29!',
                    database: 'reved_kids'
                });
                // Build query
                let query = 'SELECT * FROM exercises WHERE 1=1';
                const params = [];
                if (niveau) {
                    query += ' AND niveau = ?';
                    params.push(niveau);
                }
                if (matiere) {
                    query += ' AND matiere = ?';
                    params.push(matiere);
                }
                if (difficulty_level) {
                    query += ' AND difficulty_level = ?';
                    params.push(difficulty_level);
                }
                query += ' ORDER BY id LIMIT ? OFFSET ?';
                params.push(limit, offset);
                const [exercises] = await connection.execute(query, params);
                // Get total count
                let countQuery = 'SELECT COUNT(*) as total FROM exercises WHERE 1=1';
                const countParams = [];
                if (niveau) {
                    countQuery += ' AND niveau = ?';
                    countParams.push(niveau);
                }
                if (matiere) {
                    countQuery += ' AND matiere = ?';
                    countParams.push(matiere);
                }
                if (difficulty_level) {
                    countQuery += ' AND difficulty_level = ?';
                    countParams.push(difficulty_level);
                }
                const [countResult] = await connection.execute(countQuery, countParams);
                const total = countResult[0].total;
                await connection.end();
                return reply.send({
                    success: true,
                    data: {
                        items: exercises,
                        total,
                        page: Math.floor(offset / limit) + 1,
                        limit,
                        hasMore: offset + limit < total
                    }
                });
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                fastify.log.error({ err }, 'Get legacy exercises error');
                return reply.status(500).send({
                    success: false,
                    error: {
                        message: 'Erreur lors de la récupération des exercices',
                        code: 'GET_LEGACY_EXERCISES_ERROR',
                    },
                });
            }
        }
    });
    // Get exercises by level
    fastify.get('/by-level/:level', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    level: { type: 'string' }
                },
                required: ['level']
            },
            querystring: {
                type: 'object',
                properties: {
                    matiere: { type: 'string' },
                    type: { type: 'string' },
                    difficulty: { type: 'string' },
                    limit: { type: 'number', default: 10 }
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const { level } = request.params;
                const { matiere, type, difficulty, limit = 10 } = request.query;
                const connection = await promise_1.default.createConnection({
                    host: 'localhost',
                    user: 'root',
                    password: 'thisisREALLYIT29!',
                    database: 'reved_kids'
                });
                let query = 'SELECT * FROM exercises WHERE niveau = ?';
                const params = [level];
                if (matiere) {
                    query += ' AND matiere = ?';
                    params.push(matiere);
                }
                query += ' ORDER BY RAND() LIMIT ?';
                params.push(limit);
                const [exercises] = await connection.execute(query, params);
                await connection.end();
                return reply.send({
                    success: true,
                    data: exercises
                });
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                fastify.log.error({ err }, 'Get exercises by level error');
                return reply.status(500).send({
                    success: false,
                    error: {
                        message: 'Erreur lors de la récupération des exercices par niveau',
                        code: 'GET_EXERCISES_BY_LEVEL_ERROR',
                    },
                });
            }
        }
    });
    // Get random exercises
    fastify.get('/random/:level', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    level: { type: 'string' }
                },
                required: ['level']
            },
            querystring: {
                type: 'object',
                properties: {
                    count: { type: 'number', default: 5 },
                    matiere: { type: 'string' }
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const { level } = request.params;
                const { count = 5, matiere } = request.query;
                const connection = await promise_1.default.createConnection({
                    host: 'localhost',
                    user: 'root',
                    password: 'thisisREALLYIT29!',
                    database: 'reved_kids'
                });
                let query = 'SELECT * FROM exercises WHERE niveau = ?';
                const params = [level];
                if (matiere) {
                    query += ' AND matiere = ?';
                    params.push(matiere);
                }
                query += ' ORDER BY RAND() LIMIT ?';
                params.push(count);
                const [exercises] = await connection.execute(query, params);
                await connection.end();
                return reply.send({
                    success: true,
                    data: exercises
                });
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                fastify.log.error({ err }, 'Get random exercises error');
                return reply.status(500).send({
                    success: false,
                    error: {
                        message: 'Erreur lors de la récupération des exercices aléatoires',
                        code: 'GET_RANDOM_EXERCISES_ERROR',
                    },
                });
            }
        }
    });
    // Get exercise by ID
    fastify.get('/:id', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'number' }
                },
                required: ['id']
            }
        },
        handler: async (request, reply) => {
            try {
                const { id } = request.params;
                const connection = await promise_1.default.createConnection({
                    host: 'localhost',
                    user: 'root',
                    password: 'thisisREALLYIT29!',
                    database: 'reved_kids'
                });
                const [exercises] = await connection.execute('SELECT * FROM exercises WHERE id = ?', [id]);
                await connection.end();
                if (exercises.length === 0) {
                    return reply.status(404).send({
                        success: false,
                        error: {
                            message: 'Exercice non trouvé',
                            code: 'EXERCISE_NOT_FOUND',
                        },
                    });
                }
                return reply.send({
                    success: true,
                    data: exercises[0]
                });
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                fastify.log.error({ err }, 'Get exercise by ID error');
                return reply.status(500).send({
                    success: false,
                    error: {
                        message: 'Erreur lors de la récupération de l\'exercice',
                        code: 'GET_EXERCISE_ERROR',
                    },
                });
            }
        }
    });
    // Get exercise statistics
    fastify.get('/stats/overview', {
        handler: async (request, reply) => {
            try {
                const connection = await promise_1.default.createConnection({
                    host: 'localhost',
                    user: 'root',
                    password: 'thisisREALLYIT29!',
                    database: 'reved_kids'
                });
                // Get total count
                const [totalResult] = await connection.execute('SELECT COUNT(*) as total FROM exercises');
                const total = totalResult[0].total;
                // Get count by level
                const [levelResult] = await connection.execute(`
          SELECT niveau, COUNT(*) as count 
          FROM exercises 
          GROUP BY niveau 
          ORDER BY niveau
        `);
                // Get count by subject
                const [subjectResult] = await connection.execute(`
          SELECT matiere, COUNT(*) as count 
          FROM exercises 
          GROUP BY matiere 
          ORDER BY matiere
        `);
                // Get count by difficulty
                const [difficultyResult] = await connection.execute(`
          SELECT difficulty_level, COUNT(*) as count 
          FROM exercises 
          GROUP BY difficulty_level 
          ORDER BY difficulty_level
        `);
                await connection.end();
                return reply.send({
                    success: true,
                    data: {
                        total,
                        byLevel: levelResult,
                        bySubject: subjectResult,
                        byDifficulty: difficultyResult
                    }
                });
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                fastify.log.error({ err }, 'Get exercise stats error');
                return reply.status(500).send({
                    success: false,
                    error: {
                        message: 'Erreur lors de la récupération des statistiques',
                        code: 'GET_EXERCISE_STATS_ERROR',
                    },
                });
            }
        }
    });
}
exports.default = legacyExercisesRoutes;
