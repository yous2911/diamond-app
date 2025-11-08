"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.createError = exports.AppError = void 0;
// Conditional Sentry import
let Sentry;
try {
    Sentry = require('@sentry/node');
    console.log('Sentry initialized for error tracking');
}
catch (error) {
    console.warn('Sentry not installed, using console logging for errors');
    Sentry = {
        captureException: (err) => console.error('Error captured:', err),
        captureMessage: (msg) => console.warn('Message captured:', msg),
        addBreadcrumb: () => { },
        setUser: () => { },
        setTag: () => { },
    };
}
class AppError extends Error {
    constructor(message, statusCode = 500, code, details) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
function createError(message, statusCode = 500, code, details) {
    return new AppError(message, statusCode, code, details);
}
exports.createError = createError;
async function errorHandler(error, request, reply) {
    const apiError = error;
    const statusCode = apiError.statusCode || 500;
    // Log error
    request.log.error({
        error: {
            message: error.message,
            stack: error.stack,
            statusCode,
            code: apiError.code,
        },
        request: {
            method: request.method,
            url: request.url,
            headers: request.headers,
        },
    });
    // Capture with Sentry
    Sentry.captureException(error, {
        tags: {
            method: request.method,
            url: request.url,
            statusCode,
        },
    });
    // Send response
    await reply.status(statusCode).send({
        success: false,
        error: {
            message: statusCode >= 500 ? 'Internal Server Error' : error.message,
            code: apiError.code,
            statusCode,
            ...(process.env.NODE_ENV === 'development' && {
                details: apiError.details,
                stack: error.stack,
            }),
        },
        timestamp: new Date().toISOString(),
    });
}
exports.errorHandler = errorHandler;
