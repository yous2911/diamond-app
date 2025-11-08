"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const enhanced_database_service_js_1 = require("../services/enhanced-database.service.js");
const competencies_service_js_1 = require("../services/competencies.service.js");
const competence_schema_js_1 = require("../schemas/competence.schema.js");
async function competencesRoutes(fastify) {
    // GET /api/competences - List all competencies with optional filtering
    fastify.get('/', { schema: competence_schema_js_1.GetCompetenciesSchema }, async (request, reply) => {
        try {
            const filters = request.query;
            const cacheKey = competencies_service_js_1.competenciesService.generateListCacheKey(filters);
            let competencies;
            try {
                const cached = await fastify.redis.get(cacheKey);
                if (cached) {
                    competencies = JSON.parse(cached);
                    return reply.send({ success: true, data: competencies, cached: true });
                }
            }
            catch (redisError) {
                fastify.log.warn('Redis cache miss or error');
            }
            competencies = await competencies_service_js_1.competenciesService.getCompetenciesList(fastify.db, filters);
            try {
                await fastify.redis.setex(cacheKey, 300, JSON.stringify(competencies));
            }
            catch (redisError) {
                fastify.log.warn('Redis cache set error');
            }
            reply.send({ success: true, data: competencies, cached: false });
        }
        catch (error) {
            fastify.log.error('Error listing competencies');
            reply.status(500).send({
                success: false,
                error: { message: 'Failed to list competencies', code: 'COMPETENCIES_LIST_ERROR' }
            });
        }
    });
    // GET /api/competences/:code - Get specific competency with JSON content
    fastify.get('/:code', { schema: competence_schema_js_1.GetCompetenceSchema }, async (request, reply) => {
        try {
            const { code } = request.params;
            const cacheKey = competencies_service_js_1.competenciesService.generateItemCacheKey(code);
            let competency;
            try {
                const cached = await fastify.redis.get(cacheKey);
                if (cached) {
                    competency = JSON.parse(cached);
                    return reply.send({ success: true, data: competency, cached: true });
                }
            }
            catch (redisError) {
                fastify.log.warn('Redis cache miss or error');
            }
            competency = await competencies_service_js_1.competenciesService.getCompetencyWithContent(fastify.db, code);
            if (!competency) {
                return reply.status(404).send({
                    success: false,
                    error: { message: 'Competency not found', code: 'COMPETENCY_NOT_FOUND' }
                });
            }
            try {
                await fastify.redis.setex(cacheKey, 300, JSON.stringify(competency));
            }
            catch (redisError) {
                fastify.log.warn('Redis cache set error');
            }
            reply.send({ success: true, data: competency, cached: false });
        }
        catch (error) {
            fastify.log.error('Error getting competency');
            reply.status(500).send({
                success: false,
                error: { message: 'Failed to get competency', code: 'COMPETENCY_GET_ERROR' }
            });
        }
    });
    // GET /api/competences/:code/prerequisites - Get prerequisites for a competence
    fastify.get('/:code/prerequisites', { schema: competence_schema_js_1.GetPrerequisitesSchema }, async (request, reply) => {
        try {
            const { code: competenceCode } = request.params;
            const { includePrerequisiteDetails, studentId, depth } = request.query;
            const prerequisites = await enhanced_database_service_js_1.enhancedDatabaseService.getCompetencePrerequisites(competenceCode, {
                includeDetails: includePrerequisiteDetails,
                depth
            });
            let studentProgressData = null;
            if (studentId) {
                const prerequisiteCodes = prerequisites.map(p => p.prerequisiteCode);
                studentProgressData = await enhanced_database_service_js_1.enhancedDatabaseService.getStudentCompetenceProgress(studentId, {
                    competenceCodes: prerequisiteCodes
                });
            }
            const prerequisiteTree = await Promise.all(prerequisites.map(async (prereq) => {
                const studentProgress = studentProgressData?.find((sp) => sp.competenceCode === prereq.prerequisiteCode);
                return {
                    id: prereq.id,
                    competenceCode: competenceCode,
                    prerequisiteCode: prereq.prerequisiteCode,
                    isRequired: true,
                    weight: 1,
                    minimumLevel: prereq.minimumLevel,
                    studentProgress: studentProgress ? {
                        masteryLevel: studentProgress.masteryLevel,
                        currentScore: parseFloat(studentProgress.currentScore.toString()),
                        totalAttempts: studentProgress.totalAttempts,
                        successfulAttempts: studentProgress.successfulAttempts,
                        lastAttemptAt: studentProgress.lastAttemptAt
                    } : null
                };
            }));
            const readinessAnalysis = {
                totalPrerequisites: prerequisites.length,
                requiredPrerequisites: prerequisites.length,
                studentReadiness: studentProgressData ? {
                    requiredMet: prerequisites.every(p => {
                        const progress = studentProgressData?.find((sp) => sp.competenceCode === p.prerequisiteCode);
                        return progress && progress.masteryLevel !== 'decouverte';
                    }),
                    readinessScore: calculateReadinessScore(prerequisites, studentProgressData),
                    blockers: prerequisites
                        .filter(p => {
                        const progress = studentProgressData?.find((sp) => sp.competenceCode === p.prerequisiteCode);
                        return !progress || progress.masteryLevel === 'decouverte';
                    })
                        .map(p => p.prerequisiteCode)
                } : null
            };
            reply.send({
                success: true,
                data: {
                    competenceCode,
                    prerequisites: prerequisiteTree,
                    analysis: readinessAnalysis,
                    metadata: {
                        depth,
                        includeDetails: includePrerequisiteDetails,
                        studentAnalyzed: !!studentId
                    }
                }
            });
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            fastify.log.error({ err }, 'Error getting competence prerequisites');
            reply.status(500).send({
                success: false,
                error: {
                    message: 'Failed to get competence prerequisites',
                    code: 'COMPETENCE_PREREQUISITES_ERROR'
                }
            });
        }
    });
    // GET /api/competences/:code/progress - Get competence progress
    fastify.get('/:code/progress', { schema: competence_schema_js_1.GetProgressSchema }, async (request, reply) => {
        try {
            const { code: competenceCode } = request.params;
            const { studentId } = request.query;
            if (studentId) {
                const progress = await enhanced_database_service_js_1.enhancedDatabaseService.getStudentCompetenceProgress(studentId, {
                    competenceCodes: [competenceCode]
                });
                const studentProgress = progress.find(p => p.competenceCode === competenceCode);
                if (!studentProgress) {
                    return reply.status(404).send({
                        success: false,
                        error: {
                            message: 'No progress found for this competence',
                            code: 'PROGRESS_NOT_FOUND'
                        }
                    });
                }
                reply.send({
                    success: true,
                    data: {
                        competenceCode,
                        studentId,
                        progress: {
                            masteryLevel: studentProgress.masteryLevel,
                            currentScore: parseFloat((studentProgress.currentScore ?? 0).toString()),
                            totalAttempts: studentProgress.totalAttempts,
                            successfulAttempts: studentProgress.successfulAttempts,
                            lastAttemptAt: studentProgress.lastAttemptAt,
                            createdAt: studentProgress.createdAt,
                            updatedAt: studentProgress.updatedAt
                        }
                    }
                });
            }
            else {
                reply.send({
                    success: true,
                    data: {
                        competenceCode,
                        message: 'Bulk progress endpoint not implemented yet'
                    }
                });
            }
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            fastify.log.error({ err }, 'Error getting competence progress');
            reply.status(500).send({
                success: false,
                error: {
                    message: 'Failed to get competence progress',
                    code: 'COMPETENCE_PROGRESS_ERROR'
                }
            });
        }
    });
}
exports.default = competencesRoutes;
// Helper function to calculate readiness score
function calculateReadinessScore(prerequisites, studentProgress) {
    if (!studentProgress || studentProgress.length === 0) {
        return 0;
    }
    let totalWeight = 0;
    let achievedWeight = 0;
    prerequisites.forEach(prereq => {
        const weight = parseFloat((prereq.weight || 1).toString());
        totalWeight += weight;
        const progress = studentProgress.find((p) => p.competenceCode === prereq.prerequisiteCode);
        if (progress && progress.masteryLevel !== 'decouverte') {
            // Give partial credit based on mastery level
            const masteryLevel = progress.masteryLevel;
            const masteryMultiplier = {
                'decouverte': 0,
                'apprentissage': 0.4,
                'maitrise': 0.8,
                'expertise': 1.0
            };
            const multiplier = masteryMultiplier[masteryLevel] || 0;
            achievedWeight += weight * multiplier;
        }
    });
    return totalWeight > 0 ? Math.round((achievedWeight / totalWeight) * 100) : 0;
}
