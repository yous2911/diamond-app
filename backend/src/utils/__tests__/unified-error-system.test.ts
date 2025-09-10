/**
 * Unified Error System Tests
 * 
 * Comprehensive tests for the new error management system
 */

import { vi, beforeEach, describe, it, expect } from 'vitest';

// Import error classes first for use in mocks
import {
  BaseError,
  ValidationError,
  NotFoundError,
  DatabaseError,
  ExternalServiceError,
  ErrorFactory,
  ErrorSeverity,
  ErrorCategory,
  ErrorContextBuilder
} from '../errors.unified';

// Mock dependencies
vi.mock('../errorLogger', () => ({
  ErrorLogger: {
    logError: vi.fn()
  }
}));

vi.mock('../errorMonitoring', () => ({
  ErrorMonitoringService: {
    captureError: vi.fn()
  }
}));

vi.mock('../requestContextExtractor', () => ({
  RequestContextExtractor: {
    extract: vi.fn(() => ({
      userId: 'test-user',
      sessionId: 'test-session',
      requestId: 'test-request'
    }))
  }
}));

// Create comprehensive mock for error handler dependencies  
const mockErrorHandlerConfig = {
  environment: 'test',
  includeStackTrace: false,
  includeErrorDetails: true,
  logAllErrors: true,
  monitoringEnabled: false,
  sanitizeHeaders: true,
  maxErrorMessageLength: 100
};

const mockFormatResponse = vi.fn((error, context, config) => {
  if (error instanceof BaseError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.errorCode,
        statusCode: error.statusCode,
        category: error.metadata.category
      },
      timestamp: new Date().toISOString()
    };
  }
  return {
    success: false,
    error: {
      message: error.message,
      code: 'INTERNAL_ERROR', 
      statusCode: 500
    },
    timestamp: new Date().toISOString()
  };
});

vi.mock('../errorHandler.config', () => ({
  getErrorHandlerConfig: vi.fn(() => mockErrorHandlerConfig)
}));

vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

// Note: ErrorResponseFormatter is internal to the handler module

import {
  unifiedErrorHandler,
  ErrorHandlerFactory,
  ErrorClassifier,
  ErrorResponseFormatter
} from '../errorHandler.unified';

// Mock Fastify request/reply
const mockRequest = {
  id: 'req-123',
  method: 'POST',
  url: '/api/test',
  ip: '127.0.0.1',
  headers: {
    'user-agent': 'test-agent',
    'x-correlation-id': 'corr-123'
  },
  user: { userId: 1, studentId: 2 }
} as any;

const mockReply = {
  status: vi.fn().mockReturnThis(),
  send: vi.fn().mockReturnThis(),
  header: vi.fn().mockReturnThis()
} as any;

describe('Unified Error System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('BaseError Class', () => {
    it('should create error with all properties', () => {
      const error = new ValidationError('Test message', {
        field: 'email',
        constraint: 'required'
      });

      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('VALIDATION_ERROR');
      expect(error.metadata.category).toBe(ErrorCategory.VALIDATION);
      expect(error.metadata.severity).toBe(ErrorSeverity.LOW);
      expect(error.metadata.isOperational).toBe(true);
      expect(error.metadata.details).toEqual({
        field: 'email',
        constraint: 'required'
      });
    });

    it('should convert to API response format', () => {
      const error = new NotFoundError('User', 123);
      const response = error.toApiResponse();

      expect(response).toEqual({
        success: false,
        error: {
          message: 'User non trouvé (ID: 123)',
          code: 'NOT_FOUND',
          statusCode: 404,
          category: ErrorCategory.BUSINESS,
          details: { resource: 'User', id: 123 }
        },
        timestamp: expect.any(String)
      });
    });

    it('should convert to log format', () => {
      const error = new DatabaseError('Connection failed');
      const logData = error.toLogFormat();

      expect(logData).toEqual({
        name: 'DatabaseError',
        message: 'Connection failed',
        statusCode: 500,
        errorCode: 'DATABASE_ERROR',
        category: ErrorCategory.TECHNICAL,
        severity: ErrorSeverity.CRITICAL,
        isOperational: false,
        context: undefined,
        details: undefined,
        stack: expect.any(String),
        timestamp: expect.any(String)
      });
    });
  });

  describe('ErrorFactory', () => {
    it('should create validation errors', () => {
      const error = ErrorFactory.validation('Invalid data', {
        field: 'age',
        constraint: 'min:18'
      });

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid data');
      expect(error.metadata.details).toEqual({
        field: 'age',
        constraint: 'min:18'
      });
    });

    it('should create business rule errors', () => {
      const error = ErrorFactory.businessRule(
        'Age requirement not met',
        'min_age',
        { age: 16, required: 18 }
      );

      expect(error.errorCode).toBe('BUSINESS_RULE_ERROR');
      expect(error.metadata.details).toEqual({
        rule: 'min_age',
        context: { age: 16, required: 18 }
      });
    });

    it('should create external service errors with retry info', () => {
      const originalError = new Error('Network timeout');
      const error = ErrorFactory.externalService(
        'PaymentGateway',
        'Service unavailable',
        true,
        originalError
      );

      expect(error).toBeInstanceOf(ExternalServiceError);
      expect(error.metadata.isRetryable).toBe(true);
      expect(error.metadata.details.service).toBe('PaymentGateway');
      expect(error.metadata.originalError).toBe(originalError);
    });
  });

  describe('ErrorContextBuilder', () => {
    it('should build context from request', () => {
      const context = ErrorContextBuilder
        .fromRequest(mockRequest)
        .withUserId(99)
        .build();

      expect(context).toEqual({
        requestId: 'req-123',
        method: 'POST',
        url: '/api/test',
        userAgent: 'test-agent',
        ip: '127.0.0.1',
        timestamp: expect.any(String),
        correlationId: 'corr-123',
        userId: 99
      });
    });

    it('should chain builder methods', () => {
      const context = ErrorContextBuilder
        .fromRequest(mockRequest)
        .withStudentId(456)
        .withCorrelationId('custom-123')
        .build();

      expect(context.studentId).toBe(456);
      expect(context.correlationId).toBe('custom-123');
    });
  });

  describe('ErrorClassifier', () => {
    it('should identify operational errors', () => {
      const validationError = new ValidationError('Test');
      const technicalError = new DatabaseError('DB Error');

      expect(ErrorClassifier.isOperationalError(validationError)).toBe(true);
      expect(ErrorClassifier.isOperationalError(technicalError)).toBe(false);
    });

    it('should determine correct severity levels', () => {
      const lowError = new ValidationError('Test');
      const highError = new DatabaseError('Test');

      expect(ErrorClassifier.getSeverityLevel(lowError)).toBe(ErrorSeverity.LOW);
      expect(ErrorClassifier.getSeverityLevel(highError)).toBe(ErrorSeverity.CRITICAL);
    });

    it('should determine monitoring requirements', () => {
      const lowError = new ValidationError('Test');
      const criticalError = new DatabaseError('Test');

      expect(ErrorClassifier.shouldMonitor(lowError)).toBe(false);
      expect(ErrorClassifier.shouldMonitor(criticalError)).toBe(true);
    });
  });

  describe('ErrorResponseFormatter', () => {
    const config = {
      includeStackTrace: false,
      includeErrorDetails: true,
      logAllErrors: true,
      monitoringEnabled: false,
      sanitizeHeaders: true,
      maxErrorMessageLength: 100
    };

    it('should format operational errors for client', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });
      const response = ErrorResponseFormatter.formatResponse(error, {}, config);

      expect(response).toEqual({
        success: false,
        error: {
          message: 'Invalid input',
          code: 'VALIDATION_ERROR',
          statusCode: 400,
          category: ErrorCategory.VALIDATION,
          details: { field: 'email' }
        },
        timestamp: expect.any(String)
      });
    });

    it('should sanitize non-operational errors in production', () => {
      const configProd = { ...config, includeErrorDetails: false };
      const error = new DatabaseError('Internal DB error');
      const response = ErrorResponseFormatter.formatResponse(error, {}, configProd);

      expect(response).toEqual({
        success: false,
        error: {
          message: 'Une erreur interne est survenue',
          code: 'INTERNAL_ERROR',
          statusCode: 500
        },
        timestamp: expect.any(String)
      });
    });

    it('should truncate long error messages', () => {
      const configShort = { ...config, maxErrorMessageLength: 10 };
      const longMessage = 'This is a very long error message that should be truncated';
      const error = new ValidationError(longMessage);
      
      const response = ErrorResponseFormatter.formatResponse(error, {}, configShort);
      
      expect((response as any).error.message).toBe('This is a ...');
    });
  });

  describe('unifiedErrorHandler', () => {
    it('should handle BaseError correctly', async () => {
      const error = new NotFoundError('User', 123);
      
      await unifiedErrorHandler(error, mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'User non trouvé (ID: 123)',
            code: 'NOT_FOUND',
            statusCode: 404
          })
        })
      );
    });

    it('should handle unknown errors', async () => {
      const error = new Error('Unknown error');
      
      await unifiedErrorHandler(error, mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INTERNAL_ERROR',
            statusCode: 500
          })
        })
      );
    });

    it('should add retry-after header for rate limit errors', async () => {
      const error = ErrorFactory.rateLimit(100, 60000, 30);
      
      await unifiedErrorHandler(error, mockRequest, mockReply);

      expect(mockReply.header).toHaveBeenCalledWith('Retry-After', 30);
      expect(mockReply.status).toHaveBeenCalledWith(429);
    });
  });

  describe('ErrorHandlerFactory', () => {
    it('should wrap async functions and handle errors', async () => {
      const originalFn = vi.fn().mockRejectedValue(new ValidationError('Test'));
      const wrappedFn = ErrorHandlerFactory.createAsyncWrapper(originalFn);

      await expect(wrappedFn('arg1', 'arg2')).rejects.toThrow('Test');
      expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should wrap sync functions and handle errors', () => {
      const originalFn = vi.fn().mockImplementation(() => {
        throw new Error('Sync error');
      });
      const wrappedFn = ErrorHandlerFactory.createSyncWrapper(originalFn);

      expect(() => wrappedFn('arg1')).toThrow();
      expect(originalFn).toHaveBeenCalledWith('arg1');
    });

    it('should convert non-BaseError to TechnicalError', async () => {
      const originalFn = vi.fn().mockRejectedValue(new Error('Regular error'));
      const wrappedFn = ErrorHandlerFactory.createAsyncWrapper(originalFn);

      try {
        await wrappedFn();
        fail('Should have thrown');
      } catch (error) {
        expect(error.errorCode).toBe('WRAPPED_ERROR');
        expect(error.metadata.category).toBe(ErrorCategory.TECHNICAL);
      }
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete error flow', async () => {
      // Create a service that throws a business rule error
      class TestService {
        async processData(data: any): Promise<void> {
          if (!data.valid) {
            throw ErrorFactory.businessRule(
              'Data validation failed',
              'data_integrity',
              { receivedData: data }
            );
          }
        }
      }

      const service = new TestService();
      const handler = ErrorHandlerFactory.createAsyncWrapper(async () => {
        await service.processData({ valid: false });
      });

      // The wrapper should re-throw the error
      try {
        await handler();
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.errorCode).toBe('BUSINESS_RULE_ERROR');
        expect(error.metadata.details.rule).toBe('data_integrity');
      }
    });

    it('should preserve error context through the chain', () => {
      const context = ErrorContextBuilder
        .fromRequest(mockRequest)
        .withStudentId(123)
        .build();

      const error = ErrorFactory.notFound('Student', 123);
      error.metadata.context = context;

      expect(error.metadata.context.studentId).toBe(123);
      expect(error.metadata.context.requestId).toBe('req-123');
      expect(error.metadata.context.correlationId).toBe('corr-123');
    });
  });

  describe('Performance Tests', () => {
    it('should handle many error creations efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        ErrorFactory.validation(`Error ${i}`, { field: `field${i}` });
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Should be fast (under 50ms for 1000 errors)
      expect(duration).toBeLessThan(50);
    });

    it('should handle error formatting efficiently', () => {
      const errors = Array.from({ length: 1000 }, (_, i) => 
        ErrorFactory.notFound('Resource', i)
      );

      const config = {
        includeStackTrace: false,
        includeErrorDetails: true,
        logAllErrors: true,
        monitoringEnabled: false,
        sanitizeHeaders: true,
        maxErrorMessageLength: 100
      };

      const start = performance.now();
      
      errors.forEach(error => {
        ErrorResponseFormatter.formatResponse(error, {}, config);
      });
      
      const end = performance.now();
      const duration = end - start;
      
      // Should be fast (under 100ms for 1000 formats)
      expect(duration).toBeLessThan(100);
      console.log(`1,000 error formats took ${duration.toFixed(2)}ms`);
    });
  });
});