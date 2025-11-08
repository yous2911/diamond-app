"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/plugins/monitoring.ts
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const monitoringPlugin = async (fastify) => {
    // Performance metrics
    const metrics = {
        requests: { total: 0, errors: 0 },
        responseTime: { sum: 0, count: 0 },
        startTime: Date.now(),
    };
    // Request tracking
    fastify.addHook('onRequest', async (request) => {
        request.startTime = Date.now();
        metrics.requests.total++;
    });
    fastify.addHook('onResponse', async (request, reply) => {
        if (request.startTime) {
            const responseTime = Date.now() - request.startTime;
            metrics.responseTime.sum += responseTime;
            metrics.responseTime.count++;
        }
        if (reply.statusCode >= 400) {
            metrics.requests.errors++;
        }
    });
    // FIXED: Monitoring service implementation
    const monitoring = {
        getMetrics: () => ({
            ...metrics,
            avgResponseTime: metrics.responseTime.count > 0
                ? Math.round(metrics.responseTime.sum / metrics.responseTime.count)
                : 0,
            uptime: Date.now() - metrics.startTime,
            memory: process.memoryUsage(),
        }),
        resetMetrics: () => {
            metrics.requests = { total: 0, errors: 0 };
            metrics.responseTime = { sum: 0, count: 0 };
        },
    };
    // FIXED: Decorate with proper typing
    fastify.decorate('monitoring', monitoring);
    fastify.log.info('✅ Monitoring plugin registered successfully');
};
exports.default = (0, fastify_plugin_1.default)(monitoringPlugin, { name: 'monitoring' });
