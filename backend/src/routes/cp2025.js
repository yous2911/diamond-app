"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cp2025_service_1 = require("../services/cp2025.service");
async function cp2025Routes(fastify) {
    const service = new cp2025_service_1.CP2025Service();
    fastify.get('/exercises', async (request, reply) => {
        try {
            const exercises = await service.getAllExercises();
            return reply.send({
                success: true,
                data: { exercises },
            });
        }
        catch (error) {
            return reply.status(500).send({
                success: false,
                error: { message: 'Failed to fetch exercises' },
            });
        }
    });
    fastify.get('/statistics', async (request, reply) => {
        try {
            const stats = await service.getExerciseStatistics();
            return reply.send({
                success: true,
                data: { statistics: stats },
            });
        }
        catch (error) {
            return reply.status(500).send({
                success: false,
                error: { message: 'Failed to fetch statistics' },
            });
        }
    });
}
exports.default = cp2025Routes;
