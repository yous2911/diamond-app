/**
 * Unified Utils Index
 * 
 * Central export point for all utility modules
 */

// =============================================================================
// NEW UNIFIED ERROR SYSTEM (Recommended)
// =============================================================================

export {
  // Error Classes
  BaseError,
  ValidationError,
  SchemaValidationError,
  BusinessRuleError,
  AuthenticationError,
  AuthorizationError,
  TokenExpiredError,
  InvalidTokenError,
  NotFoundError,
  ConflictError,
  DuplicateResourceError,
  TechnicalError,
  DatabaseError,
  ExternalServiceError,
  RateLimitError,
  
  // Error Factory
  ErrorFactory,
  
  // Context Builder
  ErrorContextBuilder,
  
  // Enums
  ErrorSeverity,
  ErrorCategory
} from './errors.unified';

export type {
  // Types
  IErrorContext,
  IErrorDetails,
  IErrorMetadata
} from './errors.unified';

export {
  // Main Error Handler
  unifiedErrorHandler,
  
  // Handler Factory
  ErrorHandlerFactory,
  
  // Utility Classes
  ErrorClassifier,
  ErrorLogger,
  ErrorMonitoringService,
  ErrorResponseFormatter,
  RequestContextExtractor
} from './errorHandler.unified';

// =============================================================================
// LEGACY ERROR SYSTEM (Deprecated - for backwards compatibility)
// =============================================================================

/**
 * @deprecated Use new unified error system instead
 * Import from './errors.unified' and './errorHandler.unified'
 */
export {
  AppError as LegacyAppError,
  createError,
  errorHandler as legacyErrorHandler
} from './errorHandler';
export type { ApiError } from './errorHandler';

/**
 * @deprecated Use ErrorFactory methods instead
 */
export {
  AppError as OldAppError,
  ValidationError as OldValidationError,
  NotFoundError as OldNotFoundError,
  UnauthorizedError as OldUnauthorizedError,
  ForbiddenError as OldForbiddenError,
  ConflictError as OldConflictError
} from './errors';

// =============================================================================
// OTHER UTILITIES
// =============================================================================

export { logger } from './logger';

// =============================================================================
// RE-EXPORT MAIN ERROR HANDLER FOR EASY ACCESS
// =============================================================================

export { unifiedErrorHandler as errorHandler } from './errorHandler.unified';

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
 *   } catch (error: unknown) {
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