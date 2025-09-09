/**
 * Unified Error Handler
 * 
 * Enhanced error handling with:
 * - Consistent error responses
 * - Smart error logging
 * - Monitoring integration
 * - Environment-aware error exposure
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { BaseError, ErrorCategory, ErrorSeverity, ErrorContextBuilder } from './errors.unified';
import { logger } from './logger';

// =============================================================================
// MONITORING INTEGRATION
// =============================================================================

interface IMonitoringService {
  captureException(error: Error, context?: any): void;
  captureMessage(message: string, level?: string, context?: any): void;
  addBreadcrumb(breadcrumb: any): void;
  setUser(user: any): void;
  setTag(key: string, value: string): void;
}

class MockMonitoringService implements IMonitoringService {
  captureException(error: Error, context?: any): void {
    logger.error('Mock Sentry - Exception captured:', { error: error.message, context });
  }

  captureMessage(message: string, level = 'info', context?: any): void {
    logger[level as keyof typeof logger]('Mock Sentry - Message captured:', { message, context });
  }

  addBreadcrumb(): void {
    // Mock implementation
  }

  setUser(): void {
    // Mock implementation
  }

  setTag(): void {
    // Mock implementation
  }
}

// Conditional Sentry integration
let monitoringService: IMonitoringService;

try {
  const Sentry = require('@sentry/node');
  monitoringService = Sentry;
  logger.info('Sentry monitoring service initialized');
} catch (error) {
  monitoringService = new MockMonitoringService();
  logger.warn('Sentry not available, using mock monitoring service');
}

// =============================================================================
// ERROR HANDLER CONFIGURATION
// =============================================================================

interface IErrorHandlerConfig {
  includeStackTrace: boolean;
  includeErrorDetails: boolean;
  logAllErrors: boolean;
  monitoringEnabled: boolean;
  sanitizeHeaders: boolean;
  maxErrorMessageLength: number;
}

const getErrorHandlerConfig = (): IErrorHandlerConfig => {
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
  static isOperationalError(error: Error | BaseError): boolean {
    if (error instanceof BaseError) {
      return error.metadata.isOperational;
    }
    return false;
  }

  static shouldExposeToClient(error: Error | BaseError, config: IErrorHandlerConfig): boolean {
    if (error instanceof BaseError) {
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

  static getSeverityLevel(error: Error | BaseError): ErrorSeverity {
    if (error instanceof BaseError) {
      return error.metadata.severity;
    }
    
    // Default to critical for unknown errors
    return ErrorSeverity.CRITICAL;
  }

  static shouldMonitor(error: Error | BaseError): boolean {
    const severity = this.getSeverityLevel(error);
    
    // Monitor high and critical errors
    return severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL;
  }
}

// =============================================================================
// REQUEST CONTEXT EXTRACTOR
// =============================================================================

class RequestContextExtractor {
  static extract(request: FastifyRequest) {
    const user = (request as any).user;
    
    return ErrorContextBuilder
      .fromRequest(request)
      .withUserId(user?.userId)
      .withStudentId(user?.studentId)
      .withCorrelationId(request.headers['x-correlation-id'] as string)
      .build();
  }

  static getSanitizedHeaders(request: FastifyRequest): Record<string, any> {
    const { authorization, cookie, ...safeHeaders } = request.headers;
    return safeHeaders;
  }
}

// =============================================================================
// ERROR LOGGER
// =============================================================================

class ErrorLogger {
  static logError(error: Error | BaseError, context: any, config: IErrorHandlerConfig): void {
    if (!config.logAllErrors) return;

    const severity = ErrorClassifier.getSeverityLevel(error);
    const logLevel = this.getLogLevel(severity);
    
    const logData = {
      error: this.formatErrorForLogging(error),
      context,
      timestamp: new Date().toISOString()
    };

    logger[logLevel]('Error occurred:', logData);
  }

  private static getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'error';
    }
  }

  private static formatErrorForLogging(error: Error | BaseError): object {
    if (error instanceof BaseError) {
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

// =============================================================================
// MONITORING SERVICE
// =============================================================================

class ErrorMonitoringService {
  static captureError(
    error: Error | BaseError,
    context: any,
    request: FastifyRequest,
    config: IErrorHandlerConfig
  ): void {
    if (!config.monitoringEnabled) return;
    if (!ErrorClassifier.shouldMonitor(error)) return;

    const monitoringContext = {
      tags: {
        method: request.method,
        url: request.url,
        statusCode: error instanceof BaseError ? error.statusCode : 500,
        category: error instanceof BaseError ? error.metadata.category : 'unknown',
        severity: ErrorClassifier.getSeverityLevel(error)
      },
      user: context.userId ? { id: context.userId } : undefined,
      extra: {
        requestId: request.id,
        correlationId: context.correlationId,
        context: error instanceof BaseError ? error.metadata.context : undefined
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

// =============================================================================
// RESPONSE FORMATTER
// =============================================================================

class ErrorResponseFormatter {
  static formatResponse(
    error: Error | BaseError,
    context: any,
    config: IErrorHandlerConfig
  ): object {
    const shouldExpose = ErrorClassifier.shouldExposeToClient(error, config);
    
    if (error instanceof BaseError) {
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
          timestamp: (response as any).timestamp
        };
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

  private static truncateMessage(message: string, maxLength: number): string {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  }
}

// =============================================================================
// MAIN ERROR HANDLER
// =============================================================================

export async function unifiedErrorHandler(
  error: Error | BaseError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const config = getErrorHandlerConfig();
  const context = RequestContextExtractor.extract(request);

  // Determine status code
  const statusCode = error instanceof BaseError ? error.statusCode : 500;

  try {
    // Log the error
    ErrorLogger.logError(error, context, config);

    // Monitor the error
    ErrorMonitoringService.captureError(error, context, request, config);

    // Format response
    const response = ErrorResponseFormatter.formatResponse(error, context, config);

    // Add rate limit headers if applicable
    if (error instanceof BaseError && error.errorCode === 'RATE_LIMIT_EXCEEDED' && (error.metadata.details as any)?.retryAfter) {
      reply.header('Retry-After', (error.metadata.details as any).retryAfter);
    }

    // Send response
    await reply.status(statusCode).send(response);
    
  } catch (handlerError) {
    // Fallback error handling
    logger.error('Error in error handler:', handlerError);
    
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

// =============================================================================
// ERROR HANDLER FACTORY
// =============================================================================

export class ErrorHandlerFactory {
  static createAsyncWrapper<T extends any[], R>(
    fn: (...args: T) => Promise<R>
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      try {
        return await fn(...args);
      } catch (error) {
        // Re-throw as BaseError if not already
        if (!(error instanceof BaseError)) {
          throw new (require('./errors.unified').TechnicalError)(
            error instanceof Error ? error.message : 'Unknown error',
            500,
            'WRAPPED_ERROR',
            error instanceof Error ? error : undefined
          );
        }
        throw error;
      }
    };
  }

  static createSyncWrapper<T extends any[], R>(
    fn: (...args: T) => R
  ): (...args: T) => R {
    return (...args: T): R => {
      try {
        return fn(...args);
      } catch (error) {
        // Re-throw as BaseError if not already
        if (!(error instanceof BaseError)) {
          throw new (require('./errors.unified').TechnicalError)(
            error instanceof Error ? error.message : 'Unknown error',
            500,
            'WRAPPED_ERROR',
            error instanceof Error ? error : undefined
          );
        }
        throw error;
      }
    };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export { 
  ErrorClassifier,
  ErrorLogger,
  ErrorMonitoringService,
  ErrorResponseFormatter,
  RequestContextExtractor
};

// Legacy compatibility
export const errorHandler = unifiedErrorHandler;