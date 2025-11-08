"use strict";
/**
 * Unified Error Handler
 *
 * Enhanced error handling with:
 * - Consistent error responses
 * - Smart error logging
 * - Monitoring integration
 * - Environment-aware error exposure
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.RequestContextExtractor = exports.ErrorResponseFormatter = exports.ErrorMonitoringService = exports.ErrorLogger = exports.ErrorClassifier = exports.ErrorHandlerFactory = exports.unifiedErrorHandler = void 0;
const errors_unified_1 = require("./errors.unified");
const logger_1 = require("./logger");
class MockMonitoringService {
    captureException(error, context) {
        logger_1.logger.error('Mock Sentry - Exception captured:', { error: error.message, context });
    }
    captureMessage(message, level = 'info', context) {
        logger_1.logger[level]('Mock Sentry - Message captured:', { message, context });
    }
    addBreadcrumb() {
        // Mock implementation
    }
    setUser() {
        // Mock implementation
    }
    setTag() {
        // Mock implementation
    }
}
// Conditional Sentry integration
let monitoringService;
try {
    const Sentry = require('@sentry/node');
    monitoringService = Sentry;
    logger_1.logger.info('Sentry monitoring service initialized');
}
catch (error) {
    monitoringService = new MockMonitoringService();
    logger_1.logger.warn('Sentry not available, using mock monitoring service');
}
const getErrorHandlerConfig = () => {
    const isDev = process.env.NODE_ENV === 'development';
    const isTest = process.env.NODE_ENV === 'test';
    return {
        includeStackTrace: isDev || isTest,
        includeErrorDetails: isDev || isTest,
        logAllErrors: true,
        monitoringEnabled: !isTest,
        sanitizeHeaders: true,
        maxErrorMessageLength: 500
    };
};
// =============================================================================
// ERROR CLASSIFICATION
// =============================================================================
class ErrorClassifier {
    static isOperationalError(error) {
        if (error instanceof errors_unified_1.BaseError) {
            return error.metadata.isOperational;
        }
        return false;
    }
    static shouldExposeToClient(error, config) {
        if (error instanceof errors_unified_1.BaseError) {
            // Expose operational errors
            if (error.metadata.isOperational) {
                return true;
            }
            // In development, expose all errors
            if (config.includeErrorDetails) {
                return true;
            }
        }
        // Never expose non-operational errors in production
        return false;
    }
    static getSeverityLevel(error) {
        if (error instanceof errors_unified_1.BaseError) {
            return error.metadata.severity;
        }
        // Default to critical for unknown errors
        return errors_unified_1.ErrorSeverity.CRITICAL;
    }
    static shouldMonitor(error) {
        const severity = this.getSeverityLevel(error);
        // Monitor high and critical errors
        return severity === errors_unified_1.ErrorSeverity.HIGH || severity === errors_unified_1.ErrorSeverity.CRITICAL;
    }
}
exports.ErrorClassifier = ErrorClassifier;
// =============================================================================
// REQUEST CONTEXT EXTRACTOR
// =============================================================================
class RequestContextExtractor {
    static extract(request) {
        const user = request.user;
        return errors_unified_1.ErrorContextBuilder
            .fromRequest(request)
            .withUserId(user?.userId)
            .withStudentId(user?.studentId)
            .withCorrelationId(request.headers['x-correlation-id'])
            .build();
    }
    static getSanitizedHeaders(request) {
        const { authorization, cookie, ...safeHeaders } = request.headers;
        return safeHeaders;
    }
}
exports.RequestContextExtractor = RequestContextExtractor;
// =============================================================================
// ERROR LOGGER
// =============================================================================
class ErrorLogger {
    static logError(error, context, config) {
        if (!config.logAllErrors)
            return;
        const severity = ErrorClassifier.getSeverityLevel(error);
        const logLevel = this.getLogLevel(severity);
        const logData = {
            error: this.formatErrorForLogging(error),
            context,
            timestamp: new Date().toISOString()
        };
        logger_1.logger[logLevel]('Error occurred:', logData);
    }
    static getLogLevel(severity) {
        switch (severity) {
            case errors_unified_1.ErrorSeverity.CRITICAL:
            case errors_unified_1.ErrorSeverity.HIGH:
                return 'error';
            case errors_unified_1.ErrorSeverity.MEDIUM:
                return 'warn';
            case errors_unified_1.ErrorSeverity.LOW:
                return 'info';
            default:
                return 'error';
        }
    }
    static formatErrorForLogging(error) {
        if (error instanceof errors_unified_1.BaseError) {
            return error.toLogFormat();
        }
        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        };
    }
}
exports.ErrorLogger = ErrorLogger;
// =============================================================================
// MONITORING SERVICE
// =============================================================================
class ErrorMonitoringService {
    static captureError(error, context, request, config) {
        if (!config.monitoringEnabled)
            return;
        if (!ErrorClassifier.shouldMonitor(error))
            return;
        const monitoringContext = {
            tags: {
                method: request.method,
                url: request.url,
                statusCode: error instanceof errors_unified_1.BaseError ? error.statusCode : 500,
                category: error instanceof errors_unified_1.BaseError ? error.metadata.category : 'unknown',
                severity: ErrorClassifier.getSeverityLevel(error)
            },
            user: context.userId ? { id: context.userId } : undefined,
            extra: {
                requestId: request.id,
                correlationId: context.correlationId,
                context: error instanceof errors_unified_1.BaseError ? error.metadata.context : undefined
            }
        };
        // Set monitoring context
        if (monitoringContext.user) {
            monitoringService.setUser(monitoringContext.user);
        }
        Object.entries(monitoringContext.tags).forEach(([key, value]) => {
            monitoringService.setTag(key, String(value));
        });
        // Capture the error
        monitoringService.captureException(error, monitoringContext);
    }
}
exports.ErrorMonitoringService = ErrorMonitoringService;
// =============================================================================
// RESPONSE FORMATTER
// =============================================================================
class ErrorResponseFormatter {
    static formatResponse(error, context, config) {
        const shouldExpose = ErrorClassifier.shouldExposeToClient(error, config);
        if (error instanceof errors_unified_1.BaseError) {
            const response = error.toApiResponse(config.includeStackTrace);
            if (!shouldExpose) {
                // Sanitize response for production
                return {
                    success: false,
                    error: {
                        message: 'Une erreur interne est survenue',
                        code: 'INTERNAL_ERROR',
                        statusCode: 500
                    },
                    timestamp: response.timestamp
                };
            }
            // Truncate message if needed
            if (response.error.message) {
                response.error.message = this.truncateMessage(response.error.message, config.maxErrorMessageLength);
            }
            return response;
        }
        // Handle non-BaseError instances
        return {
            success: false,
            error: {
                message: shouldExpose ?
                    this.truncateMessage(error.message, config.maxErrorMessageLength) :
                    'Une erreur interne est survenue',
                code: 'INTERNAL_ERROR',
                statusCode: 500,
                ...(config.includeStackTrace && { stack: error.stack })
            },
            timestamp: new Date().toISOString()
        };
    }
    static truncateMessage(message, maxLength) {
        if (message.length <= maxLength)
            return message;
        return message.substring(0, maxLength) + '...';
    }
}
exports.ErrorResponseFormatter = ErrorResponseFormatter;
// =============================================================================
// MAIN ERROR HANDLER
// =============================================================================
async function unifiedErrorHandler(error, request, reply) {
    const config = getErrorHandlerConfig();
    const context = RequestContextExtractor.extract(request);
    // Determine status code
    const statusCode = error instanceof errors_unified_1.BaseError ? error.statusCode : 500;
    try {
        // Log the error
        ErrorLogger.logError(error, context, config);
        // Monitor the error
        ErrorMonitoringService.captureError(error, context, request, config);
        // Format response
        const response = ErrorResponseFormatter.formatResponse(error, context, config);
        // Add rate limit headers if applicable
        if (error instanceof errors_unified_1.BaseError && error.errorCode === 'RATE_LIMIT_EXCEEDED' && error.metadata.details?.retryAfter) {
            reply.header('Retry-After', error.metadata.details.retryAfter);
        }
        // Send response
        await reply.status(statusCode).send(response);
    }
    catch (handlerError) {
        // Fallback error handling
        logger_1.logger.error('Error in error handler:', handlerError);
        await reply.status(500).send({
            success: false,
            error: {
                message: 'Une erreur critique est survenue',
                code: 'HANDLER_ERROR',
                statusCode: 500
            },
            timestamp: new Date().toISOString()
        });
    }
}
exports.unifiedErrorHandler = unifiedErrorHandler;
// =============================================================================
// ERROR HANDLER FACTORY
// =============================================================================
class ErrorHandlerFactory {
    static createAsyncWrapper(fn) {
        return async (...args) => {
            try {
                return await fn(...args);
            }
            catch (error) {
                // Re-throw as BaseError if not already
                if (!(error instanceof errors_unified_1.BaseError)) {
                    throw new errors_unified_1.TechnicalError(error instanceof Error ? error.message : 'Unknown error', 500, 'WRAPPED_ERROR', error instanceof Error ? error : undefined);
                }
                throw error;
            }
        };
    }
    static createSyncWrapper(fn) {
        return (...args) => {
            try {
                return fn(...args);
            }
            catch (error) {
                // Re-throw as BaseError if not already
                if (!(error instanceof errors_unified_1.BaseError)) {
                    throw new errors_unified_1.TechnicalError(error instanceof Error ? error.message : 'Unknown error', 500, 'WRAPPED_ERROR', error instanceof Error ? error : undefined);
                }
                throw error;
            }
        };
    }
}
exports.ErrorHandlerFactory = ErrorHandlerFactory;
// Legacy compatibility
exports.errorHandler = unifiedErrorHandler;
