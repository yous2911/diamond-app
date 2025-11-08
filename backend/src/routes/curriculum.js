"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("../db/connection");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const curriculum_schema_1 = require("../schemas/curriculum.schema");
const SUPPORTED_LEVELS = [
    { id: 'cp', name: 'CP', displayName: 'Cours Préparatoire', order: 1 },
    { id: 'ce1', name: 'CE1', displayName: 'Cours Élémentaire 1', order: 2 },
    { id: 'ce2', name: 'CE2', displayName: 'Cours Élémentaire 2', order: 3 },
    { id: 'cm1', name: 'CM1', displayName: 'Cours Moyen 1', order: 4 },
    { id: 'cm2', name: 'CM2', displayName: 'Cours Moyen 2', order: 5 },
    { id: 'cp-ce1', name: 'CP-CE1', displayName: 'Bridge CP-CE1', order: 1.5 }
];
const curriculumPlugin = async (fastify, opts) => {
    // Get exercises by subject (for frontend compatibility)
    fastify.get('/subjects/exercises', {
        handler: async (request, reply) => {
            try {
                // Get all exercises grouped by type (since we don't have matiere field)
                const exercisesData = await connection_1.db
                    .select({
                    id: schema_1.exercises.id,
                    titre: schema_1.exercises.titre,
                    description: schema_1.exercises.description,
                    type: schema_1.exercises.typeExercice,
                    difficulte: schema_1.exercises.difficulte,
                    xp: schema_1.exercises.xp,
                    configuration: schema_1.exercises.configuration,
                    createdAt: schema_1.exercises.createdAt,
                    updatedAt: schema_1.exercises.updatedAt
                })
                    .from(schema_1.exercises)
                    .orderBy(schema_1.exercises.typeExercice, schema_1.exercises.difficulte);
                // Return flat array of exercises for frontend compatibility
                return reply.send({
                    success: true,
                    data: exercisesData,
                    message: 'Exercices par matière récupérés avec succès'
                });
            }
            catch (error) {
                fastify.log.error('Get exercises by subject error:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        message: 'Erreur lors de la récupération des exercices par matière',
                        code: 'GET_EXERCISES_BY_SUBJECT_ERROR'
                    }
                });
            }
        }
    });
    // Get all supported levels
    fastify.get('/levels', {
        schema: curriculum_schema_1.curriculumSchemas.getLevels,
        handler: async (request, reply) => {
            try {
                // Get levels from database with counts (using modules table instead)
                const levelsData = await connection_1.db
                    .select({
                    niveau: schema_1.modules.niveau,
                    count: (0, drizzle_orm_1.sql) `COUNT(DISTINCT ${schema_1.modules.matiere})`
                })
                    .from(schema_1.modules)
                    .groupBy(schema_1.modules.niveau);
                // Merge with supported levels configuration
                const enrichedLevels = SUPPORTED_LEVELS.map(level => {
                    const dbLevel = levelsData.find(l => l.niveau.toLowerCase() === level.id);
                    return {
                        ...level,
                        subjectsCount: dbLevel?.count || 0,
                        available: !!dbLevel
                    };
                });
                return reply.send({
                    success: true,
                    data: enrichedLevels,
                    message: 'Niveaux disponibles récupérés'
                });
            }
            catch (error) {
                fastify.log.error('Get levels error:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        message: 'Erreur lors de la récupération des niveaux',
                        code: 'GET_LEVELS_ERROR'
                    }
                });
            }
        }
    });
    // Get curriculum for a specific level
    fastify.get('/:level', {
        schema: curriculum_schema_1.curriculumSchemas.getCurriculumByLevel,
        handler: async (request, reply) => {
            try {
                const { level } = request.params;
                const { subject } = request.query;
                // Validate level
                const supportedLevel = SUPPORTED_LEVELS.find(l => l.id === level.toLowerCase());
                if (!supportedLevel) {
                    return reply.status(404).send({
                        success: false,
                        error: {
                            message: `Niveau ${level} non supporté`,
                            code: 'INVALID_LEVEL',
                            supportedLevels: SUPPORTED_LEVELS.map(l => l.id)
                        }
                    });
                }
                // Build query conditions (using modules table instead)
                const conditions = [
                    (0, drizzle_orm_1.eq)(schema_1.modules.niveau, supportedLevel.name)
                ];
                if (subject) {
                    conditions.push((0, drizzle_orm_1.eq)(schema_1.modules.matiere, subject.toUpperCase()));
                }
                // Get curriculum data from modules table
                const curriculumData = await connection_1.db
                    .select({
                    niveau: schema_1.modules.niveau,
                    matiere: schema_1.modules.matiere,
                    moduleId: schema_1.modules.id,
                    exercicesCount: (0, drizzle_orm_1.sql) `COUNT(*)`
                })
                    .from(schema_1.modules)
                    .where((0, drizzle_orm_1.eq)(schema_1.modules.niveau, supportedLevel.name))
                    .groupBy(schema_1.modules.matiere, schema_1.modules.id);
                // Get modules for this level
                const modulesData = await connection_1.db
                    .select()
                    .from(schema_1.modules)
                    .where((0, drizzle_orm_1.eq)(schema_1.modules.niveau, supportedLevel.name));
                return reply.send({
                    success: true,
                    data: {
                        level: supportedLevel,
                        curriculum: {
                            subjects: curriculumData,
                            modules: modulesData
                        },
                        totalExercises: curriculumData.reduce((acc, curr) => acc + curr.exercicesCount, 0),
                        lastUpdated: new Date().toISOString()
                    },
                    message: `Programme ${supportedLevel.displayName} récupéré`
                });
            }
            catch (error) {
                fastify.log.error('Get curriculum error:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        message: 'Erreur lors de la récupération du programme',
                        code: 'GET_CURRICULUM_ERROR'
                    }
                });
            }
        }
    });
    // Get subjects for a specific level
    fastify.get('/:level/subjects', {
        schema: curriculum_schema_1.curriculumSchemas.getSubjectsByLevel,
        handler: async (request, reply) => {
            try {
                const { level } = request.params;
                const subjects = await connection_1.db
                    .select({
                    nom: schema_1.modules.matiere,
                    exercicesCount: (0, drizzle_orm_1.sql) `COUNT(*)`
                })
                    .from(schema_1.modules)
                    .where((0, drizzle_orm_1.eq)(schema_1.modules.niveau, level.toUpperCase()))
                    .groupBy(schema_1.modules.matiere);
                return reply.send({
                    success: true,
                    data: subjects.map(s => ({
                        id: s.nom,
                        nom: s.nom,
                        exercicesCount: s.exercicesCount
                    })),
                    message: `Matières pour ${level} récupérées`
                });
            }
            catch (error) {
                fastify.log.error('Get subjects error:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        message: 'Erreur lors de la récupération des matières',
                        code: 'GET_SUBJECTS_ERROR'
                    }
                });
            }
        }
    });
    // Get exercises for a specific level
    fastify.get('/:level/exercises', {
        schema: curriculum_schema_1.curriculumSchemas.getExercisesByLevel,
        handler: async (request, reply) => {
            try {
                const { level } = request.params;
                const { subject, difficulty, type, limit = 20, offset = 0 } = request.query;
                // Build query conditions (exercises don't have niveau/matiere, so we'll get all exercises)
                const conditions = [];
                if (difficulty) {
                    conditions.push((0, drizzle_orm_1.eq)(schema_1.exercises.difficulte, difficulty.toUpperCase()));
                }
                // Get exercises with pagination (all exercises since they don't have level/subject)
                const exercisesData = await connection_1.db
                    .select()
                    .from(schema_1.exercises)
                    .limit(limit)
                    .offset(offset);
                // Get total count
                const countResult = await connection_1.db
                    .select({ count: (0, drizzle_orm_1.sql) `COUNT(*)` })
                    .from(schema_1.exercises);
                const totalCount = countResult[0]?.count || 0;
                return reply.send({
                    success: true,
                    data: {
                        exercises: exercisesData,
                        pagination: {
                            total: totalCount,
                            limit,
                            offset,
                            hasMore: offset + limit < totalCount
                        }
                    },
                    message: `Exercices pour ${level} récupérés`
                });
            }
            catch (error) {
                fastify.log.error('Get exercises error:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        message: 'Erreur lors de la récupération des exercices',
                        code: 'GET_EXERCISES_ERROR'
                    }
                });
            }
        }
    });
    // Get statistics across all levels
    fastify.get('/statistics', {
        schema: curriculum_schema_1.curriculumSchemas.getStatistics,
        handler: async (request, reply) => {
            try {
                // Get statistics from modules table (since exercises don't have niveau/matiere)
                const stats = await connection_1.db
                    .select({
                    level: schema_1.modules.niveau,
                    subjectsCount: (0, drizzle_orm_1.sql) `COUNT(DISTINCT ${schema_1.modules.matiere})`,
                    exercisesCount: (0, drizzle_orm_1.sql) `COUNT(*)`
                })
                    .from(schema_1.modules)
                    .groupBy(schema_1.modules.niveau);
                // Get exercise type distribution (using type field from exercises)
                const exerciseTypes = await connection_1.db
                    .select({
                    type: schema_1.exercises.typeExercice,
                    count: (0, drizzle_orm_1.sql) `COUNT(*)`
                })
                    .from(schema_1.exercises)
                    .groupBy(schema_1.exercises.typeExercice);
                // Get difficulty distribution
                const difficultyDistribution = await connection_1.db
                    .select({
                    difficulty: schema_1.exercises.difficulte,
                    count: (0, drizzle_orm_1.sql) `COUNT(*)`
                })
                    .from(schema_1.exercises)
                    .groupBy(schema_1.exercises.difficulte);
                return reply.send({
                    success: true,
                    data: {
                        levelStatistics: stats,
                        exerciseTypes,
                        difficultyDistribution,
                        totalLevels: SUPPORTED_LEVELS.length,
                        lastUpdated: new Date().toISOString()
                    },
                    message: 'Statistiques du programme récupérées'
                });
            }
            catch (error) {
                fastify.log.error('Get statistics error:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        message: 'Erreur lors de la récupération des statistiques',
                        code: 'GET_STATISTICS_ERROR'
                    }
                });
            }
        }
    });
};
exports.default = curriculumPlugin;
