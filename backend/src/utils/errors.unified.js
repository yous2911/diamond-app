"use strict";
/**
 * Unified Error Management System
 *
 * Combines and standardizes error handling across the application:
 * - Hierarchical error classes
 * - Consistent error responses
 * - Proper logging and monitoring
 * - Environment-aware error details
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.AppError = exports.ErrorContextBuilder = exports.ErrorFactory = exports.RateLimitError = exports.ExternalServiceError = exports.DatabaseError = exports.TechnicalError = exports.DuplicateResourceError = exports.ConflictError = exports.NotFoundError = exports.InvalidTokenError = exports.TokenExpiredError = exports.AuthorizationError = exports.AuthenticationError = exports.BusinessRuleError = exports.SchemaValidationError = exports.ValidationError = exports.BaseError = exports.ErrorCategory = exports.ErrorSeverity = void 0;
// =============================================================================
// ERROR SEVERITY LEVELS
// =============================================================================
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["BUSINESS"] = "business";
    ErrorCategory["TECHNICAL"] = "technical";
    ErrorCategory["VALIDATION"] = "validation";
    ErrorCategory["AUTHENTICATION"] = "auth";
    ErrorCategory["EXTERNAL"] = "external"; // Third-party service errors
})(ErrorCategory || (exports.ErrorCategory = ErrorCategory = {}));
// =============================================================================
// BASE ERROR CLASS
// =============================================================================
class BaseError extends Error {
    constructor(message, statusCode, errorCode, metadata = {}) {
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
    toApiResponse(includeStack = false) {
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
    toLogFormat() {
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
exports.BaseError = BaseError;
// =============================================================================
// VALIDATION ERRORS
// =============================================================================
class ValidationError extends BaseError {
    constructor(message = 'Données invalides', details) {
        super(message, 400, 'VALIDATION_ERROR', {
            category: ErrorCategory.VALIDATION,
            severity: ErrorSeverity.LOW,
            isOperational: true,
            details
        });
    }
}
exports.ValidationError = ValidationError;
class SchemaValidationError extends ValidationError {
    constructor(field, constraint, value) {
        super(`Validation échouée pour le champ '${field}': ${constraint}`, {
            field,
            constraint,
            value
        });
        this.errorCode = 'SCHEMA_VALIDATION_ERROR';
    }
}
exports.SchemaValidationError = SchemaValidationError;
class BusinessRuleError extends BaseError {
    constructor(message, rule, context) {
        super(message, 400, 'BUSINESS_RULE_ERROR', {
            category: ErrorCategory.BUSINESS,
            severity: ErrorSeverity.MEDIUM,
            isOperational: true,
            details: { rule, context }
        });
    }
}
exports.BusinessRuleError = BusinessRuleError;
// =============================================================================
// AUTHENTICATION & AUTHORIZATION ERRORS
// =============================================================================
class AuthenticationError extends BaseError {
    constructor(message = 'Authentication requise') {
        super(message, 401, 'AUTHENTICATION_ERROR', {
            category: ErrorCategory.AUTHENTICATION,
            severity: ErrorSeverity.HIGH,
            isOperational: true
        });
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends BaseError {
    constructor(message = 'Accès non autorisé', resource) {
        super(message, 403, 'AUTHORIZATION_ERROR', {
            category: ErrorCategory.AUTHENTICATION,
            severity: ErrorSeverity.HIGH,
            isOperational: true,
            details: resource ? { resource } : undefined
        });
    }
}
exports.AuthorizationError = AuthorizationError;
class TokenExpiredError extends AuthenticationError {
    constructor() {
        super('Token expiré');
        this.errorCode = 'TOKEN_EXPIRED';
    }
}
exports.TokenExpiredError = TokenExpiredError;
class InvalidTokenError extends AuthenticationError {
    constructor() {
        super('Token invalide');
        this.errorCode = 'INVALID_TOKEN';
    }
}
exports.InvalidTokenError = InvalidTokenError;
// =============================================================================
// RESOURCE ERRORS
// =============================================================================
class NotFoundError extends BaseError {
    constructor(resource = 'Ressource', id) {
        super(`${resource} non trouvé${id ? ` (ID: ${id})` : ''}`, 404, 'NOT_FOUND', {
            category: ErrorCategory.BUSINESS,
            severity: ErrorSeverity.LOW,
            isOperational: true,
            details: { resource, id }
        });
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends BaseError {
    constructor(message = 'Conflit de données', conflictType) {
        super(message, 409, 'CONFLICT_ERROR', {
            category: ErrorCategory.BUSINESS,
            severity: ErrorSeverity.MEDIUM,
            isOperational: true,
            details: conflictType ? { conflictType } : undefined
        });
    }
}
exports.ConflictError = ConflictError;
class DuplicateResourceError extends ConflictError {
    constructor(resource, field, value) {
        super(`${resource} déjà existant${field ? ` (${field}: ${value})` : ''}`, 'duplicate');
        this.errorCode = 'DUPLICATE_RESOURCE';
        this.metadata.details = { resource, field, value };
    }
}
exports.DuplicateResourceError = DuplicateResourceError;
// =============================================================================
// TECHNICAL ERRORS
// =============================================================================
class TechnicalError extends BaseError {
    constructor(message, statusCode = 500, errorCode = 'TECHNICAL_ERROR', originalError) {
        super(message, statusCode, errorCode, {
            category: ErrorCategory.TECHNICAL,
            severity: ErrorSeverity.HIGH,
            isOperational: false,
            originalError
        });
    }
}
exports.TechnicalError = TechnicalError;
class DatabaseError extends TechnicalError {
    constructor(message = 'Erreur de base de données', originalError) {
        super(message, 500, 'DATABASE_ERROR', originalError);
        this.metadata.severity = ErrorSeverity.CRITICAL;
    }
}
exports.DatabaseError = DatabaseError;
class ExternalServiceError extends BaseError {
    constructor(service, message = 'Service externe indisponible', isRetryable = true, originalError) {
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
exports.ExternalServiceError = ExternalServiceError;
class RateLimitError extends BaseError {
    constructor(limit, windowMs, retryAfter) {
        super('Limite de taux dépassée', 429, 'RATE_LIMIT_EXCEEDED', {
            category: ErrorCategory.TECHNICAL,
            severity: ErrorSeverity.MEDIUM,
            isOperational: true,
            isRetryable: true,
            details: { limit, windowMs, retryAfter }
        });
    }
}
exports.RateLimitError = RateLimitError;
// =============================================================================
// ERROR FACTORY
// =============================================================================
class ErrorFactory {
    static validation(message, details) {
        return new ValidationError(message, details);
    }
    static schemaValidation(field, constraint, value) {
        return new SchemaValidationError(field, constraint, value);
    }
    static businessRule(message, rule, context) {
        return new BusinessRuleError(message, rule, context);
    }
    static notFound(resource, id) {
        return new NotFoundError(resource, id);
    }
    static unauthorized(message) {
        return new AuthenticationError(message);
    }
    static forbidden(message, resource) {
        return new AuthorizationError(message, resource);
    }
    static conflict(message, conflictType) {
        return new ConflictError(message, conflictType);
    }
    static duplicate(resource, field, value) {
        return new DuplicateResourceError(resource, field, value);
    }
    static database(message, originalError) {
        return new DatabaseError(message, originalError);
    }
    static externalService(service, message, isRetryable = true, originalError) {
        return new ExternalServiceError(service, message, isRetryable, originalError);
    }
    static technical(message, statusCode = 500, errorCode = 'TECHNICAL_ERROR', originalError) {
        return new TechnicalError(message, statusCode, errorCode, originalError);
    }
    static rateLimit(limit, windowMs, retryAfter) {
        return new RateLimitError(limit, windowMs, retryAfter);
    }
}
exports.ErrorFactory = ErrorFactory;
// =============================================================================
// ERROR CONTEXT BUILDER
// =============================================================================
class ErrorContextBuilder {
    constructor() {
        this.context = {};
    }
    static fromRequest(request) {
        const builder = new ErrorContextBuilder();
        return builder
            .withRequestId(request.id)
            .withMethod(request.method)
            .withUrl(request.url)
            .withUserAgent(request.headers['user-agent'])
            .withIp(request.ip)
            .withCorrelationId(request.headers['x-correlation-id'])
            .withTimestamp();
    }
    withUserId(userId) {
        this.context.userId = userId;
        return this;
    }
    withStudentId(studentId) {
        this.context.studentId = studentId;
        return this;
    }
    withRequestId(requestId) {
        this.context.requestId = requestId;
        return this;
    }
    withMethod(method) {
        this.context.method = method;
        return this;
    }
    withUrl(url) {
        this.context.url = url;
        return this;
    }
    withUserAgent(userAgent) {
        this.context.userAgent = userAgent;
        return this;
    }
    withIp(ip) {
        this.context.ip = ip;
        return this;
    }
    withTimestamp() {
        this.context.timestamp = new Date().toISOString();
        return this;
    }
    withCorrelationId(correlationId) {
        this.context.correlationId = correlationId;
        return this;
    }
    build() {
        return { ...this.context };
    }
}
exports.ErrorContextBuilder = ErrorContextBuilder;
// =============================================================================
// LEGACY COMPATIBILITY
// =============================================================================
/**
 * @deprecated Use new error classes instead
 */
exports.AppError = BaseError;
/**
 * @deprecated Use ErrorFactory.* methods instead
 */
function createError(message, statusCode = 500, code, details) {
    return new TechnicalError(message, statusCode, code || 'LEGACY_ERROR');
}
exports.createError = createError;
