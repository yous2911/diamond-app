/**
 * Unified Error Management System
 * 
 * Combines and standardizes error handling across the application:
 * - Hierarchical error classes
 * - Consistent error responses
 * - Proper logging and monitoring
 * - Environment-aware error details
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from './logger';

// =============================================================================
// ERROR SEVERITY LEVELS
// =============================================================================

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  BUSINESS = 'business',        // Business logic errors
  TECHNICAL = 'technical',      // System/infrastructure errors  
  VALIDATION = 'validation',    // Input validation errors
  AUTHENTICATION = 'auth',      // Authentication/authorization errors
  EXTERNAL = 'external'         // Third-party service errors
}

// =============================================================================
// BASE ERROR INTERFACES
// =============================================================================

export interface IErrorContext {
  userId?: number;
  studentId?: number;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  method?: string;
  url?: string;
  timestamp?: string;
  correlationId?: string;
}

export interface IErrorDetails {
  field?: string;
  code?: string;
  value?: any;
  constraint?: string;
  [key: string]: any;
}

export interface IErrorMetadata {
  category: ErrorCategory;
  severity: ErrorSeverity;
  isOperational: boolean;
  isRetryable: boolean;
  context?: IErrorContext;
  details?: IErrorDetails | IErrorDetails[];
  originalError?: Error;
}

// =============================================================================
// BASE ERROR CLASS
// =============================================================================

export abstract class BaseError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly metadata: IErrorMetadata;
  public readonly timestamp: string;

  constructor(
    message: string,
    statusCode: number,
    errorCode: string,
    metadata: Partial<IErrorMetadata> = {}
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.timestamp = new Date().toISOString();
    
    this.metadata = {
      category: ErrorCategory.BUSINESS,
      severity: ErrorSeverity.MEDIUM,
      isOperational: true,
      isRetryable: false,
      ...metadata
    };

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to API response format
   */
  toApiResponse(includeStack = false): object {
    return {
      success: false,
      error: {
        message: this.message,
        code: this.errorCode,
        statusCode: this.statusCode,
        category: this.metadata.category,
        ...(this.metadata.details && { details: this.metadata.details }),
        ...(includeStack && { stack: this.stack })
      },
      timestamp: this.timestamp
    };
  }

  /**
   * Convert error to log format
   */
  toLogFormat(): object {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      category: this.metadata.category,
      severity: this.metadata.severity,
      isOperational: this.metadata.isOperational,
      context: this.metadata.context,
      details: this.metadata.details,
      stack: this.stack,
      timestamp: this.timestamp
    };
  }
}

// =============================================================================
// VALIDATION ERRORS
// =============================================================================

export class ValidationError extends BaseError {
  constructor(
    message: string = 'Données invalides',
    details?: IErrorDetails | IErrorDetails[]
  ) {
    super(message, 400, 'VALIDATION_ERROR', {
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      isOperational: true,
      details
    });
  }
}

export class SchemaValidationError extends ValidationError {
  constructor(field: string, constraint: string, value?: any) {
    super(`Validation échouée pour le champ '${field}': ${constraint}`, {
      field,
      constraint, 
      value
    });
    this.errorCode = 'SCHEMA_VALIDATION_ERROR';
  }
}

export class BusinessRuleError extends BaseError {
  constructor(message: string, rule: string, context?: any) {
    super(message, 400, 'BUSINESS_RULE_ERROR', {
      category: ErrorCategory.BUSINESS,
      severity: ErrorSeverity.MEDIUM,
      isOperational: true,
      details: { rule, context }
    });
  }
}

// =============================================================================
// AUTHENTICATION & AUTHORIZATION ERRORS
// =============================================================================

export class AuthenticationError extends BaseError {
  constructor(message: string = 'Authentication requise') {
    super(message, 401, 'AUTHENTICATION_ERROR', {
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      isOperational: true
    });
  }
}

export class AuthorizationError extends BaseError {
  constructor(message: string = 'Accès non autorisé', resource?: string) {
    super(message, 403, 'AUTHORIZATION_ERROR', {
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      isOperational: true,
      details: resource ? { resource } : undefined
    });
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor() {
    super('Token expiré');
    this.errorCode = 'TOKEN_EXPIRED';
  }
}

export class InvalidTokenError extends AuthenticationError {
  constructor() {
    super('Token invalide');
    this.errorCode = 'INVALID_TOKEN';
  }
}

// =============================================================================
// RESOURCE ERRORS
// =============================================================================

export class NotFoundError extends BaseError {
  constructor(resource: string = 'Ressource', id?: string | number) {
    super(`${resource} non trouvé${id ? ` (ID: ${id})` : ''}`, 404, 'NOT_FOUND', {
      category: ErrorCategory.BUSINESS,
      severity: ErrorSeverity.LOW,
      isOperational: true,
      details: { resource, id }
    });
  }
}

export class ConflictError extends BaseError {
  constructor(message: string = 'Conflit de données', conflictType?: string) {
    super(message, 409, 'CONFLICT_ERROR', {
      category: ErrorCategory.BUSINESS,
      severity: ErrorSeverity.MEDIUM,
      isOperational: true,
      details: conflictType ? { conflictType } : undefined
    });
  }
}

export class DuplicateResourceError extends ConflictError {
  constructor(resource: string, field?: string, value?: any) {
    super(`${resource} déjà existant${field ? ` (${field}: ${value})` : ''}`, 'duplicate');
    this.errorCode = 'DUPLICATE_RESOURCE';
    this.metadata.details = { resource, field, value };
  }
}

// =============================================================================
// TECHNICAL ERRORS
// =============================================================================

export class TechnicalError extends BaseError {
  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'TECHNICAL_ERROR',
    originalError?: Error
  ) {
    super(message, statusCode, errorCode, {
      category: ErrorCategory.TECHNICAL,
      severity: ErrorSeverity.HIGH,
      isOperational: false,
      originalError
    });
  }
}

export class DatabaseError extends TechnicalError {
  constructor(message: string = 'Erreur de base de données', originalError?: Error) {
    super(message, 500, 'DATABASE_ERROR', originalError);
    this.metadata.severity = ErrorSeverity.CRITICAL;
  }
}

export class ExternalServiceError extends BaseError {
  constructor(
    service: string,
    message: string = 'Service externe indisponible',
    isRetryable: boolean = true,
    originalError?: Error
  ) {
    super(`${service}: ${message}`, 503, 'EXTERNAL_SERVICE_ERROR', {
      category: ErrorCategory.EXTERNAL,
      severity: ErrorSeverity.HIGH,
      isOperational: true,
      isRetryable,
      details: { service },
      originalError
    });
  }
}

export class RateLimitError extends BaseError {
  constructor(limit: number, windowMs: number, retryAfter?: number) {
    super('Limite de taux dépassée', 429, 'RATE_LIMIT_EXCEEDED', {
      category: ErrorCategory.TECHNICAL,
      severity: ErrorSeverity.MEDIUM,
      isOperational: true,
      isRetryable: true,
      details: { limit, windowMs, retryAfter }
    });
  }
}

// =============================================================================
// ERROR FACTORY
// =============================================================================

export class ErrorFactory {
  static validation(message: string, details?: IErrorDetails | IErrorDetails[]): ValidationError {
    return new ValidationError(message, details);
  }

  static schemaValidation(field: string, constraint: string, value?: any): SchemaValidationError {
    return new SchemaValidationError(field, constraint, value);
  }

  static businessRule(message: string, rule: string, context?: any): BusinessRuleError {
    return new BusinessRuleError(message, rule, context);
  }

  static notFound(resource: string, id?: string | number): NotFoundError {
    return new NotFoundError(resource, id);
  }

  static unauthorized(message?: string): AuthenticationError {
    return new AuthenticationError(message);
  }

  static forbidden(message?: string, resource?: string): AuthorizationError {
    return new AuthorizationError(message, resource);
  }

  static conflict(message?: string, conflictType?: string): ConflictError {
    return new ConflictError(message, conflictType);
  }

  static duplicate(resource: string, field?: string, value?: any): DuplicateResourceError {
    return new DuplicateResourceError(resource, field, value);
  }

  static database(message?: string, originalError?: Error): DatabaseError {
    return new DatabaseError(message, originalError);
  }

  static externalService(
    service: string, 
    message?: string, 
    isRetryable = true, 
    originalError?: Error
  ): ExternalServiceError {
    return new ExternalServiceError(service, message, isRetryable, originalError);
  }

  static technical(
    message: string,
    statusCode = 500,
    errorCode = 'TECHNICAL_ERROR',
    originalError?: Error
  ): TechnicalError {
    return new TechnicalError(message, statusCode, errorCode, originalError);
  }

  static rateLimit(limit: number, windowMs: number, retryAfter?: number): RateLimitError {
    return new RateLimitError(limit, windowMs, retryAfter);
  }
}

// =============================================================================
// ERROR CONTEXT BUILDER
// =============================================================================

export class ErrorContextBuilder {
  private context: IErrorContext = {};

  static fromRequest(request: FastifyRequest): ErrorContextBuilder {
    const builder = new ErrorContextBuilder();
    
    return builder
      .withRequestId(request.id)
      .withMethod(request.method)
      .withUrl(request.url)
      .withUserAgent(request.headers['user-agent'])
      .withIp(request.ip)
      .withTimestamp();
  }

  withUserId(userId: number): this {
    this.context.userId = userId;
    return this;
  }

  withStudentId(studentId: number): this {
    this.context.studentId = studentId;
    return this;
  }

  withRequestId(requestId: string): this {
    this.context.requestId = requestId;
    return this;
  }

  withMethod(method: string): this {
    this.context.method = method;
    return this;
  }

  withUrl(url: string): this {
    this.context.url = url;
    return this;
  }

  withUserAgent(userAgent?: string): this {
    this.context.userAgent = userAgent;
    return this;
  }

  withIp(ip: string): this {
    this.context.ip = ip;
    return this;
  }

  withTimestamp(): this {
    this.context.timestamp = new Date().toISOString();
    return this;
  }

  withCorrelationId(correlationId: string): this {
    this.context.correlationId = correlationId;
    return this;
  }

  build(): IErrorContext {
    return { ...this.context };
  }
}

// =============================================================================
// LEGACY COMPATIBILITY
// =============================================================================

/**
 * @deprecated Use new error classes instead
 */
export const AppError = BaseError;

/**
 * @deprecated Use ErrorFactory.* methods instead
 */
export function createError(
  message: string,
  statusCode = 500,
  code?: string,
  details?: any
): BaseError {
  return new TechnicalError(message, statusCode, code || 'LEGACY_ERROR');
}