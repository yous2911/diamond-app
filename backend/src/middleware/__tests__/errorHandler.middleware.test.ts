import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorHandler } from '../errorHandler.middleware';
import { AuthenticationError, NotFoundError } from '../../utils/AppError';
import { ZodError, ZodIssue } from 'zod';
import { FastifyRequest, FastifyReply } from 'fastify';

describe('errorHandler Middleware', () => {
  let mockRequest: FastifyRequest;
  let mockReply: FastifyReply;

  beforeEach(() => {
    // Re-create mocks before each test to ensure isolation
    mockRequest = {
      log: {
        error: vi.fn(),
      },
    } as unknown as FastifyRequest;

    mockReply = {
      status: vi.fn(),
      send: vi.fn(),
    } as unknown as FastifyReply;

    // Chainable mock setup
    (mockReply.status as any).mockReturnValue(mockReply);
  });

  it('should handle AppError subclasses correctly', () => {
    const error = new NotFoundError('Test resource not found');
    errorHandler(error, mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(404);
    expect(mockReply.send).toHaveBeenCalledWith({
      status: 'error',
      statusCode: 404,
      message: 'Test resource not found',
    });
  });

  it('should handle another AppError subclass correctly', () => {
    const error = new AuthenticationError('Invalid credentials');
    errorHandler(error, mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(401);
    expect(mockReply.send).toHaveBeenCalledWith({
      status: 'error',
      statusCode: 401,
      message: 'Invalid credentials',
    });
  });

  it('should handle ZodError correctly', () => {
    const zodIssues: ZodIssue[] = [
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'number',
        path: ['name'],
        message: 'Name must be a string',
      },
    ];
    const error = new ZodError(zodIssues);
    errorHandler(error, mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(400);
    expect(mockReply.send).toHaveBeenCalledWith({
      status: 'fail',
      message: 'Invalid input data',
      errors: {
        name: ['Name must be a string'],
      },
    });
  });

  it('should handle generic errors with a 500 status code', () => {
    const error = new Error('Something went wrong');
    errorHandler(error, mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith({
      status: 'error',
      statusCode: 500,
      message: 'Internal Server Error',
    });
  });
});
