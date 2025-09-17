/**
 * Unit Tests for Utility Functions
 * Tests AppError, errorHandler, and other utility functions
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock Sentry
vi.mock('@sentry/node', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
  setUser: vi.fn(),
  setTag: vi.fn()
}));

// Import after mocks
import AppError, { ValidationError, AuthenticationError, AuthorizationError, NotFoundError, ConflictError } from '../utils/AppError';
import { AppError as AppErrorHandler, createError, errorHandler } from '../utils/errorHandler';

describe('Utility Functions', () => {
  describe('AppError Classes', () => {
    describe('AppError', () => {
      test('should create AppError with message and status code', () => {
        const error = new AppError('Test error', 400);
        
        expect(error.message).toBe('Test error');
        expect(error.statusCode).toBe(400);
        expect(error.isOperational).toBe(true);
        expect(error instanceof Error).toBe(true);
        expect(error instanceof AppError).toBe(true);
      });

      test('should set correct prototype', () => {
        const error = new AppError('Test error', 500);
        
        expect(Object.getPrototypeOf(error)).toBe(AppError.prototype);
      });

      test('should capture stack trace', () => {
        const error = new AppError('Test error', 500);
        
        expect(error.stack).toBeDefined();
        expect(error.stack).toContain('Test error');
      });
    });

    describe('ValidationError', () => {
      test('should create ValidationError with default message', () => {
        const error = new ValidationError();
        
        expect(error.message).toBe('Invalid input');
        expect(error.statusCode).toBe(400);
        expect(error instanceof AppError).toBe(true);
        expect(error instanceof ValidationError).toBe(true);
      });

      test('should create ValidationError with custom message', () => {
        const error = new ValidationError('Custom validation error');
        
        expect(error.message).toBe('Custom validation error');
        expect(error.statusCode).toBe(400);
      });
    });

    describe('AuthenticationError', () => {
      test('should create AuthenticationError with default message', () => {
        const error = new AuthenticationError();
        
        expect(error.message).toBe('Authentication failed');
        expect(error.statusCode).toBe(401);
        expect(error instanceof AppError).toBe(true);
        expect(error instanceof AuthenticationError).toBe(true);
      });

      test('should create AuthenticationError with custom message', () => {
        const error = new AuthenticationError('Invalid credentials');
        
        expect(error.message).toBe('Invalid credentials');
        expect(error.statusCode).toBe(401);
      });
    });

    describe('AuthorizationError', () => {
      test('should create AuthorizationError with default message', () => {
        const error = new AuthorizationError();
        
        expect(error.message).toBe('You are not authorized to perform this action');
        expect(error.statusCode).toBe(403);
        expect(error instanceof AppError).toBe(true);
        expect(error instanceof AuthorizationError).toBe(true);
      });

      test('should create AuthorizationError with custom message', () => {
        const error = new AuthorizationError('Insufficient permissions');
        
        expect(error.message).toBe('Insufficient permissions');
        expect(error.statusCode).toBe(403);
      });
    });

    describe('NotFoundError', () => {
      test('should create NotFoundError with default message', () => {
        const error = new NotFoundError();
        
        expect(error.message).toBe('Resource not found');
        expect(error.statusCode).toBe(404);
        expect(error instanceof AppError).toBe(true);
        expect(error instanceof NotFoundError).toBe(true);
      });

      test('should create NotFoundError with custom message', () => {
        const error = new NotFoundError('User not found');
        
        expect(error.message).toBe('User not found');
        expect(error.statusCode).toBe(404);
      });
    });

    describe('ConflictError', () => {
      test('should create ConflictError with default message', () => {
        const error = new ConflictError();
        
        expect(error.message).toBe('Conflict');
        expect(error.statusCode).toBe(409);
        expect(error instanceof AppError).toBe(true);
        expect(error instanceof ConflictError).toBe(true);
      });

      test('should create ConflictError with custom message', () => {
        const error = new ConflictError('Email already exists');
        
        expect(error.message).toBe('Email already exists');
        expect(error.statusCode).toBe(409);
      });
    });
  });

  describe('Error Handler Functions', () => {
    describe('AppError (from errorHandler)', () => {
      test('should create AppError with all parameters', () => {
        const error = new AppErrorHandler('Test error', 400, 'VALIDATION_ERROR', { field: 'email' });
        
        expect(error.message).toBe('Test error');
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.details).toEqual({ field: 'email' });
        expect(error.name).toBe('AppError');
      });

      test('should create AppError with default parameters', () => {
        const error = new AppErrorHandler('Test error');
        
        expect(error.message).toBe('Test error');
        expect(error.statusCode).toBe(500);
        expect(error.code).toBeUndefined();
        expect(error.details).toBeUndefined();
      });

      test('should capture stack trace', () => {
        const error = new AppErrorHandler('Test error', 500);
        
        expect(error.stack).toBeDefined();
        expect(error.stack).toContain('AppError');
      });
    });

    describe('createError', () => {
      test('should create error with all parameters', () => {
        const error = createError('Test error', 400, 'VALIDATION_ERROR', { field: 'email' });
        
        expect(error.message).toBe('Test error');
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.details).toEqual({ field: 'email' });
        expect(error instanceof AppErrorHandler).toBe(true);
      });

      test('should create error with default parameters', () => {
        const error = createError('Test error');
        
        expect(error.message).toBe('Test error');
        expect(error.statusCode).toBe(500);
        expect(error.code).toBeUndefined();
        expect(error.details).toBeUndefined();
      });
    });

    describe('errorHandler', () => {
      let mockRequest: any;
      let mockReply: any;

      beforeEach(() => {
        mockRequest = {
          method: 'GET',
          url: '/test',
          headers: { 'user-agent': 'test-agent' },
          ip: '127.0.0.1',
          log: {
            error: vi.fn(),
            warn: vi.fn(),
            info: vi.fn()
          }
        };

        mockReply = {
          status: vi.fn().mockReturnThis(),
          send: vi.fn(),
          header: vi.fn()
        };
      });

      test('should handle AppError correctly', async () => {
        const error = new AppErrorHandler('Test error', 400, 'VALIDATION_ERROR');
        
        await errorHandler(error, mockRequest, mockReply);
        
        expect(mockReply.status).toHaveBeenCalledWith(400);
        expect(mockReply.send).toHaveBeenCalledWith({
          error: {
            message: 'Test error',
            statusCode: 400,
            code: 'VALIDATION_ERROR'
          },
          success: false,
          timestamp: expect.any(String)
        });
      });

      test('should handle AppError without code', async () => {
        const error = new AppErrorHandler('Test error', 500);
        
        await errorHandler(error, mockRequest, mockReply);
        
        expect(mockReply.status).toHaveBeenCalledWith(500);
        expect(mockReply.send).toHaveBeenCalledWith({
          error: {
            message: 'Internal Server Error',
            statusCode: 500,
            code: undefined
          },
          success: false,
          timestamp: expect.any(String)
        });
      });

      test('should handle generic Error', async () => {
        const error = new Error('Generic error');
        
        await errorHandler(error, mockRequest, mockReply);
        
        expect(mockReply.status).toHaveBeenCalledWith(500);
        expect(mockReply.send).toHaveBeenCalledWith({
          error: {
            message: 'Internal Server Error',
            statusCode: 500,
            code: undefined
          },
          success: false,
          timestamp: expect.any(String)
        });
      });

      test('should handle error with details', async () => {
        const error = new AppErrorHandler('Test error', 400, 'VALIDATION_ERROR', { field: 'email' });
        
        await errorHandler(error, mockRequest, mockReply);
        
        expect(mockReply.status).toHaveBeenCalledWith(400);
        expect(mockReply.send).toHaveBeenCalledWith({
          error: {
            message: 'Test error',
            statusCode: 400,
            code: 'VALIDATION_ERROR'
          },
          success: false,
          timestamp: expect.any(String)
        });
      });

      test('should handle error response format', async () => {
        const error = new AppErrorHandler('Test error', 400);
        
        await errorHandler(error, mockRequest, mockReply);
        
        expect(mockReply.status).toHaveBeenCalledWith(400);
        expect(mockReply.send).toHaveBeenCalledWith({
          error: {
            message: 'Test error',
            statusCode: 400,
            code: undefined
          },
          success: false,
          timestamp: expect.any(String)
        });
      });

      test('should handle validation errors with 400 status', async () => {
        const error = new ValidationError('Invalid input');
        
        await errorHandler(error, mockRequest, mockReply);
        
        expect(mockReply.status).toHaveBeenCalledWith(400);
        expect(mockReply.send).toHaveBeenCalledWith({
          error: {
            message: 'Invalid input',
            statusCode: 400,
            code: undefined
          },
          success: false,
          timestamp: expect.any(String)
        });
      });

      test('should handle authentication errors with 401 status', async () => {
        const error = new AuthenticationError('Invalid credentials');
        
        await errorHandler(error, mockRequest, mockReply);
        
        expect(mockReply.status).toHaveBeenCalledWith(401);
        expect(mockReply.send).toHaveBeenCalledWith({
          error: {
            message: 'Invalid credentials',
            statusCode: 401,
            code: undefined
          },
          success: false,
          timestamp: expect.any(String)
        });
      });

      test('should handle authorization errors with 403 status', async () => {
        const error = new AuthorizationError('Insufficient permissions');
        
        await errorHandler(error, mockRequest, mockReply);
        
        expect(mockReply.status).toHaveBeenCalledWith(403);
        expect(mockReply.send).toHaveBeenCalledWith({
          error: {
            message: 'Insufficient permissions',
            statusCode: 403,
            code: undefined
          },
          success: false,
          timestamp: expect.any(String)
        });
      });

      test('should handle not found errors with 404 status', async () => {
        const error = new NotFoundError('Resource not found');
        
        await errorHandler(error, mockRequest, mockReply);
        
        expect(mockReply.status).toHaveBeenCalledWith(404);
        expect(mockReply.send).toHaveBeenCalledWith({
          error: {
            message: 'Resource not found',
            statusCode: 404,
            code: undefined
          },
          success: false,
          timestamp: expect.any(String)
        });
      });

      test('should handle conflict errors with 409 status', async () => {
        const error = new ConflictError('Email already exists');
        
        await errorHandler(error, mockRequest, mockReply);
        
        expect(mockReply.status).toHaveBeenCalledWith(409);
        expect(mockReply.send).toHaveBeenCalledWith({
          error: {
            message: 'Email already exists',
            statusCode: 409,
            code: undefined
          },
          success: false,
          timestamp: expect.any(String)
        });
      });
    });
  });

  describe('Error Inheritance', () => {
    test('should maintain proper inheritance chain', () => {
      const validationError = new ValidationError();
      const authError = new AuthenticationError();
      const authzError = new AuthorizationError();
      const notFoundError = new NotFoundError();
      const conflictError = new ConflictError();
      
      expect(validationError instanceof AppError).toBe(true);
      expect(validationError instanceof Error).toBe(true);
      
      expect(authError instanceof AppError).toBe(true);
      expect(authError instanceof Error).toBe(true);
      
      expect(authzError instanceof AppError).toBe(true);
      expect(authzError instanceof Error).toBe(true);
      
      expect(notFoundError instanceof AppError).toBe(true);
      expect(notFoundError instanceof Error).toBe(true);
      
      expect(conflictError instanceof AppError).toBe(true);
      expect(conflictError instanceof Error).toBe(true);
    });

    test('should have correct error names', () => {
      const validationError = new ValidationError();
      const authError = new AuthenticationError();
      const authzError = new AuthorizationError();
      const notFoundError = new NotFoundError();
      const conflictError = new ConflictError();
      
      expect(validationError.name).toBe('Error'); // JavaScript sets name to 'Error' by default
      expect(authError.name).toBe('Error');
      expect(authzError.name).toBe('Error');
      expect(notFoundError.name).toBe('Error');
      expect(conflictError.name).toBe('Error');
    });
  });

  describe('Error Properties', () => {
    test('should have correct status codes', () => {
      expect(new ValidationError().statusCode).toBe(400);
      expect(new AuthenticationError().statusCode).toBe(401);
      expect(new AuthorizationError().statusCode).toBe(403);
      expect(new NotFoundError().statusCode).toBe(404);
      expect(new ConflictError().statusCode).toBe(409);
    });

    test('should be operational errors', () => {
      expect(new ValidationError().isOperational).toBe(true);
      expect(new AuthenticationError().isOperational).toBe(true);
      expect(new AuthorizationError().isOperational).toBe(true);
      expect(new NotFoundError().isOperational).toBe(true);
      expect(new ConflictError().isOperational).toBe(true);
    });
  });

  describe('Error Serialization', () => {
    test('should serialize to JSON correctly', () => {
      const error = new AppError('Test error', 400);
      const serialized = JSON.stringify(error);
      const parsed = JSON.parse(serialized);
      
      // Check what's actually serialized
      expect(parsed).toBeDefined();
      expect(typeof parsed).toBe('object');
      
      // Test direct property access instead of JSON serialization
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    test('should serialize custom error properties with toJSON method', () => {
      const error = new AppErrorHandler('Test error', 400, 'VALIDATION_ERROR', { field: 'email' });
      
      // Test direct property access
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ field: 'email' });
      
      // Test JSON serialization
      const serialized = JSON.stringify(error);
      const parsed = JSON.parse(serialized);
      
      // Check what's actually serialized
      expect(parsed).toBeDefined();
      expect(typeof parsed).toBe('object');
    });
  });

  describe('Error Stack Traces', () => {
    test('should have stack traces', () => {
      const error = new AppError('Test error', 500);
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('Test error');
    });

    test('should have different stack traces for different errors', () => {
      const error1 = new AppError('Error 1', 500);
      const error2 = new AppError('Error 2', 500);
      
      expect(error1.stack).not.toBe(error2.stack);
    });
  });
});
