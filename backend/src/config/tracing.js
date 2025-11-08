"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tracer = void 0;
// Conditional OpenTelemetry import
let openTelemetryApi;
let NodeSDK;
try {
    openTelemetryApi = require('@opentelemetry/api');
    const { NodeSDK } = require('@opentelemetry/auto-instrumentations-node');
    const sdk = new NodeSDK({
        instrumentations: [], // Add instrumentations as needed
    });
    sdk.start();
    console.log('OpenTelemetry initialized successfully');
}
catch (error) {
    console.warn('OpenTelemetry not installed, tracing disabled:', error);
    // Mock OpenTelemetry API
    openTelemetryApi = {
        trace: {
            getTracer: () => ({
                startSpan: (name) => ({
                    end: () => { },
                    setStatus: () => { },
                    setAttributes: () => { },
                    recordException: () => { },
                }),
            }),
        },
    };
}
exports.tracer = openTelemetryApi.trace.getTracer('reved-kids-fastify');
