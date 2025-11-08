"use strict";
/**
 * Unified Utils Index
 *
 * Central export point for all utility modules
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.logger = exports.OldConflictError = exports.OldForbiddenError = exports.OldUnauthorizedError = exports.OldNotFoundError = exports.OldValidationError = exports.OldAppError = exports.legacyErrorHandler = exports.createError = exports.LegacyAppError = exports.RequestContextExtractor = exports.ErrorResponseFormatter = exports.ErrorMonitoringService = exports.ErrorLogger = exports.ErrorClassifier = exports.ErrorHandlerFactory = exports.unifiedErrorHandler = exports.ErrorCategory = exports.ErrorSeverity = exports.ErrorContextBuilder = exports.ErrorFactory = exports.RateLimitError = exports.ExternalServiceError = exports.DatabaseError = exports.TechnicalError = exports.DuplicateResourceError = exports.ConflictError = exports.NotFoundError = exports.InvalidTokenError = exports.TokenExpiredError = exports.AuthorizationError = exports.AuthenticationError = exports.BusinessRuleError = exports.SchemaValidationError = exports.ValidationError = exports.BaseError = void 0;
// =============================================================================
// NEW UNIFIED ERROR SYSTEM (Recommended)
// =============================================================================
var errors_unified_1 = require("./errors.unified");
// Error Classes
Object.defineProperty(exports, "BaseError", { enumerable: true, get: function () { return errors_unified_1.BaseError; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return errors_unified_1.ValidationError; } });
Object.defineProperty(exports, "SchemaValidationError", { enumerable: true, get: function () { return errors_unified_1.SchemaValidationError; } });
Object.defineProperty(exports, "BusinessRuleError", { enumerable: true, get: function () { return errors_unified_1.BusinessRuleError; } });
Object.defineProperty(exports, "AuthenticationError", { enumerable: true, get: function () { return errors_unified_1.AuthenticationError; } });
Object.defineProperty(exports, "AuthorizationError", { enumerable: true, get: function () { return errors_unified_1.AuthorizationError; } });
Object.defineProperty(exports, "TokenExpiredError", { enumerable: true, get: function () { return errors_unified_1.TokenExpiredError; } });
Object.defineProperty(exports, "InvalidTokenError", { enumerable: true, get: function () { return errors_unified_1.InvalidTokenError; } });
Object.defineProperty(exports, "NotFoundError", { enumerable: true, get: function () { return errors_unified_1.NotFoundError; } });
Object.defineProperty(exports, "ConflictError", { enumerable: true, get: function () { return errors_unified_1.ConflictError; } });
Object.defineProperty(exports, "DuplicateResourceError", { enumerable: true, get: function () { return errors_unified_1.DuplicateResourceError; } });
Object.defineProperty(exports, "TechnicalError", { enumerable: true, get: function () { return errors_unified_1.TechnicalError; } });
Object.defineProperty(exports, "DatabaseError", { enumerable: true, get: function () { return errors_unified_1.DatabaseError; } });
Object.defineProperty(exports, "ExternalServiceError", { enumerable: true, get: function () { return errors_unified_1.ExternalServiceError; } });
Object.defineProperty(exports, "RateLimitError", { enumerable: true, get: function () { return errors_unified_1.RateLimitError; } });
// Error Factory
Object.defineProperty(exports, "ErrorFactory", { enumerable: true, get: function () { return errors_unified_1.ErrorFactory; } });
// Context Builder
Object.defineProperty(exports, "ErrorContextBuilder", { enumerable: true, get: function () { return errors_unified_1.ErrorContextBuilder; } });
// Enums
Object.defineProperty(exports, "ErrorSeverity", { enumerable: true, get: function () { return errors_unified_1.ErrorSeverity; } });
Object.defineProperty(exports, "ErrorCategory", { enumerable: true, get: function () { return errors_unified_1.ErrorCategory; } });
var errorHandler_unified_1 = require("./errorHandler.unified");
// Main Error Handler
Object.defineProperty(exports, "unifiedErrorHandler", { enumerable: true, get: function () { return errorHandler_unified_1.unifiedErrorHandler; } });
// Handler Factory
Object.defineProperty(exports, "ErrorHandlerFactory", { enumerable: true, get: function () { return errorHandler_unified_1.ErrorHandlerFactory; } });
// Utility Classes
Object.defineProperty(exports, "ErrorClassifier", { enumerable: true, get: function () { return errorHandler_unified_1.ErrorClassifier; } });
Object.defineProperty(exports, "ErrorLogger", { enumerable: true, get: function () { return errorHandler_unified_1.ErrorLogger; } });
Object.defineProperty(exports, "ErrorMonitoringService", { enumerable: true, get: function () { return errorHandler_unified_1.ErrorMonitoringService; } });
Object.defineProperty(exports, "ErrorResponseFormatter", { enumerable: true, get: function () { return errorHandler_unified_1.ErrorResponseFormatter; } });
Object.defineProperty(exports, "RequestContextExtractor", { enumerable: true, get: function () { return errorHandler_unified_1.RequestContextExtractor; } });
// =============================================================================
// LEGACY ERROR SYSTEM (Deprecated - for backwards compatibility)
// =============================================================================
/**
 * @deprecated Use new unified error system instead
 * Import from './errors.unified' and './errorHandler.unified'
 */
var errorHandler_1 = require("./errorHandler");
Object.defineProperty(exports, "LegacyAppError", { enumerable: true, get: function () { return errorHandler_1.AppError; } });
Object.defineProperty(exports, "createError", { enumerable: true, get: function () { return errorHandler_1.createError; } });
Object.defineProperty(exports, "legacyErrorHandler", { enumerable: true, get: function () { return errorHandler_1.errorHandler; } });
/**
 * @deprecated Use ErrorFactory methods instead
 */
var errors_1 = require("./errors");
Object.defineProperty(exports, "OldAppError", { enumerable: true, get: function () { return errors_1.AppError; } });
Object.defineProperty(exports, "OldValidationError", { enumerable: true, get: function () { return errors_1.ValidationError; } });
Object.defineProperty(exports, "OldNotFoundError", { enumerable: true, get: function () { return errors_1.NotFoundError; } });
Object.defineProperty(exports, "OldUnauthorizedError", { enumerable: true, get: function () { return errors_1.UnauthorizedError; } });
Object.defineProperty(exports, "OldForbiddenError", { enumerable: true, get: function () { return errors_1.ForbiddenError; } });
Object.defineProperty(exports, "OldConflictError", { enumerable: true, get: function () { return errors_1.ConflictError; } });
// =============================================================================
// OTHER UTILITIES
// =============================================================================
var logger_1 = require("./logger");
Object.defineProperty(exports, "logger", { enumerable: true, get: function () { return logger_1.logger; } });
// =============================================================================
// RE-EXPORT MAIN ERROR HANDLER FOR EASY ACCESS
// =============================================================================
var errorHandler_unified_2 = require("./errorHandler.unified");
Object.defineProperty(exports, "errorHandler", { enumerable: true, get: function () { return errorHandler_unified_2.unifiedErrorHandler; } });
// =============================================================================
// MIGRATION GUIDE
// =============================================================================
/**
 * MIGRATION GUIDE FROM OLD TO NEW ERROR SYSTEM
 *
 * OLD WAY:
 * ```typescript
 * import { AppError, createError, ValidationError } from '../utils';
 *
 * throw new AppError('Message', 400, 'CODE');
 * throw new ValidationError('Invalid data');
 * throw createError('Error', 500);
 * ```
 *
 * NEW WAY (RECOMMENDED):
 * ```typescript
 * import { ErrorFactory, ValidationError } from '../utils';
 *
 * throw ErrorFactory.validation('Invalid data');
 * throw ErrorFactory.notFound('User', userId);
 * throw ErrorFactory.businessRule('Rule violated', 'rule_name');
 * ```
 *
 * ROUTE HANDLER MIGRATION:
 *
 * OLD WAY:
 * ```typescript
 * fastify.post('/users', async (request, reply) => {
 *   try {
 *     // ... logic
 *   } catch (error) {
 *     await errorHandler(error, request, reply);
 *   }
 * });
 * ```
 *
 * NEW WAY (OPTION 1 - Wrapper):
 * ```typescript
 * fastify.post('/users', ErrorHandlerFactory.createAsyncWrapper(
 *   async (request, reply) => {
 *     // ... logic (errors automatically handled)
 *   }
 * ));
 * ```
 *
 * NEW WAY (OPTION 2 - Global handler):
 * ```typescript
 * // In server setup:
 * fastify.setErrorHandler(unifiedErrorHandler);
 *
 * // In routes:
 * fastify.post('/users', async (request, reply) => {
 *   // ... logic (throw errors normally, global handler catches them)
 *   if (!data.valid) {
 *     throw ErrorFactory.validation('Invalid data');
 *   }
 * });
 * ```
 */ 
