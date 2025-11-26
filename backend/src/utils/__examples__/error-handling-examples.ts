/**
 * Error Handling Examples
 * 
 * Shows how to use the unified error system effectively
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { 
  ErrorFactory,
  ValidationError,
  NotFoundError,
  DatabaseError,
  ExternalServiceError,
  ErrorContextBuilder,
  BaseError
} from '../errors.unified';
import { unifiedErrorHandler, ErrorHandlerFactory } from '../errorHandler.unified';

// =============================================================================
// EXAMPLE 1: BASIC ERROR CREATION AND THROWING
// =============================================================================

export class UserService {
  async createUser(userData: any): Promise<any> {
    // Input validation
    if (!userData.email) {
      throw ErrorFactory.validation('Email requis', {
        field: 'email',
        constraint: 'required',
        value: userData.email
      });
    }

    if (!this.isValidEmail(userData.email)) {
      throw ErrorFactory.schemaValidation('email', 'format invalide', userData.email);
    }

    try {
      // Simulate database operation
      const existingUser = await this.findUserByEmail(userData.email);
      
      if (existingUser) {
        throw ErrorFactory.duplicate('User', 'email', userData.email);
      }

      // Simulate successful creation
      return { id: 1, ...userData };

    } catch (error) {
      if (error instanceof BaseError) {
        throw error; // Re-throw known errors
      }
      
      // Wrap unknown database errors
      throw ErrorFactory.database('Erreur lors de la création de l\'utilisateur', error as Error);
    }
  }

  async findUserByEmail(email: string): Promise<any | null> {
    // Simulate database lookup
    return email === 'existing@example.com' ? { id: 1, email } : null;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

// =============================================================================
// EXAMPLE 2: BUSINESS LOGIC ERRORS
// =============================================================================

export class StudentService {
  async enrollInCourse(studentId: number, courseId: number): Promise<void> {
    const student = await this.findStudent(studentId);
    if (!student) {
      throw ErrorFactory.notFound('Student', studentId);
    }

    const course = await this.findCourse(courseId);
    if (!course) {
      throw ErrorFactory.notFound('Course', courseId);
    }

    // Business rule: Check age requirement
    if (student.age < course.minimumAge) {
      throw ErrorFactory.businessRule(
        `Student must be at least ${course.minimumAge} years old for this course`,
        'age_requirement',
        { studentAge: student.age, requiredAge: course.minimumAge }
      );
    }

    // Business rule: Check enrollment capacity
    if (course.enrolledCount >= course.maxCapacity) {
      throw ErrorFactory.businessRule(
        'Course is at maximum capacity',
        'capacity_limit',
        { current: course.enrolledCount, max: course.maxCapacity }
      );
    }

    // Proceed with enrollment...
  }

  private async findStudent(id: number): Promise<any | null> {
    // Simulate database lookup
    return id === 999 ? null : { id, age: 8 };
  }

  private async findCourse(id: number): Promise<any | null> {
    // Simulate database lookup
    return { 
      id, 
      minimumAge: 6, 
      maxCapacity: 20, 
      enrolledCount: id === 1 ? 20 : 5 
    };
  }
}

// =============================================================================
// EXAMPLE 3: EXTERNAL SERVICE INTEGRATION
// =============================================================================

export class NotificationService {
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    try {
      // Simulate external email service call
      const response = await this.callEmailService({ to, subject, body });
      
      if (!response.success) {
        throw ErrorFactory.externalService(
          'EmailService',
          `Failed to send email: ${response.error}`,
          true, // retryable
          new Error(response.error)
        );
      }
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }

      // Network or timeout errors - retryable
      if (error instanceof Error && error.message.includes('timeout')) {
        throw ErrorFactory.externalService(
          'EmailService',
          'Email service timeout',
          true,
          error
        );
      }

      // Other errors - not retryable
      throw ErrorFactory.externalService(
        'EmailService',
        'Email service unavailable',
        false,
        error as Error
      );
    }
  }

  private async callEmailService(data: any): Promise<any> {
    // Simulate external API call
    if (data.to === 'timeout@example.com') {
      throw new Error('Request timeout');
    }
    
    if (data.to === 'fail@example.com') {
      return { success: false, error: 'Invalid recipient' };
    }
    
    return { success: true, messageId: '12345' };
  }
}

// =============================================================================
// EXAMPLE 4: FASTIFY ROUTE ERROR HANDLING
// =============================================================================

export class UserController {
  constructor(private userService: UserService) {}

  // Using wrapped handler for automatic error handling
  createUser = ErrorHandlerFactory.createAsyncWrapper(async (
    request: FastifyRequest<{ Body: any }>,
    reply: FastifyReply
  ): Promise<void> => {
    const userData = request.body;
    
    // Add request context to errors
    const context = ErrorContextBuilder
      .fromRequest(request)
      .withUserId((request as any).user?.id)
      .build();

    try {
      const user = await this.userService.createUser(userData);
      
      reply.send({
        success: true,
        data: user,
        message: 'User created successfully'
      });
    } catch (error) {
      // Add context to error if it's a BaseError
      if (error instanceof BaseError) {
        error.metadata.context = { ...error.metadata.context, ...context };
      }
      throw error; // Will be caught by the wrapper and re-thrown properly
    }
  });

  // Manual error handling approach
  async getUserById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const userId = parseInt(request.params.id);
      
      if (isNaN(userId)) {
        throw ErrorFactory.validation('User ID must be a number', {
          field: 'id',
          constraint: 'numeric',
          value: request.params.id
        });
      }

      const user = await this.findUserById(userId);
      
      reply.send({
        success: true,
        data: user
      });
      
    } catch (error) {
      // Let the global error handler deal with it
      await unifiedErrorHandler(error as Error, request, reply);
    }
  }

  private async findUserById(id: number): Promise<any> {
    if (id === 404) {
      throw ErrorFactory.notFound('User', id);
    }
    return { id, name: 'Test User' };
  }
}

// =============================================================================
// EXAMPLE 5: ERROR HANDLING IN SERVICES WITH CONTEXT
// =============================================================================

export class OrderService {
  async processPayment(orderId: number, amount: number, paymentMethod: string): Promise<void> {
    try {
      // Validate order
      const order = await this.findOrder(orderId);
      if (!order) {
        throw ErrorFactory.notFound('Order', orderId);
      }

      // Validate amount
      if (amount !== order.total) {
        throw ErrorFactory.businessRule(
          'Payment amount does not match order total',
          'amount_mismatch',
          { paymentAmount: amount, orderTotal: order.total }
        );
      }

      // Process payment with external service
      await this.chargePayment(amount, paymentMethod);

      // Update order status
      await this.updateOrderStatus(orderId, 'paid');

    } catch (error) {
      // Add business context to any errors
      if (error instanceof BaseError) {
        error.metadata.details = {
          ...error.metadata.details,
          orderId,
          amount,
          paymentMethod
        };
      }
      throw error;
    }
  }

  private async findOrder(id: number): Promise<any | null> {
    return id === 999 ? null : { id, total: 100.00, status: 'pending' };
  }

  private async chargePayment(amount: number, method: string): Promise<void> {
    if (method === 'invalid_card') {
      throw ErrorFactory.businessRule(
        'Invalid payment method',
        'invalid_payment_method',
        { method }
      );
    }

    if (amount > 1000) {
      throw ErrorFactory.externalService(
        'PaymentGateway',
        'Payment amount exceeds limit',
        false
      );
    }
  }

  private async updateOrderStatus(id: number, status: string): Promise<void> {
    // Simulate database update
  }
}

// =============================================================================
// EXAMPLE 6: CUSTOM ERROR CLASSES
// =============================================================================

export class InsufficientFundsError extends BaseError {
  constructor(requiredAmount: number, availableAmount: number) {
    super(
      `Insufficient funds: required ${requiredAmount}, available ${availableAmount}`,
      402, // Payment Required
      'INSUFFICIENT_FUNDS',
      {
        category: ErrorFactory.businessRule('', '').metadata.category,
        severity: ErrorFactory.businessRule('', '').metadata.severity,
        isOperational: true,
        isRetryable: false,
        details: { requiredAmount, availableAmount }
      }
    );
  }
}

export class AccountService {
  async withdrawFunds(accountId: number, amount: number): Promise<void> {
    const account = await this.findAccount(accountId);
    if (!account) {
      throw ErrorFactory.notFound('Account', accountId);
    }

    if (account.balance < amount) {
      throw new InsufficientFundsError(amount, account.balance);
    }

    // Proceed with withdrawal
    await this.deductFromAccount(accountId, amount);
  }

  private async findAccount(id: number): Promise<any | null> {
    return { id, balance: 50.00 };
  }

  private async deductFromAccount(id: number, amount: number): Promise<void> {
    // Simulate database update
  }
}

// =============================================================================
// EXAMPLE 7: ERROR TESTING
// =============================================================================

export class ErrorTestExamples {
  static async demonstrateErrorHandling(): Promise<void> {
    const userService = new UserService();
    const studentService = new StudentService();
    const notificationService = new NotificationService();

    try {
      // This will throw a validation error
      await userService.createUser({ name: 'Test' }); // Missing email
    } catch (error) {
      console.log('Validation Error:', (error as BaseError).toApiResponse());
    }

    try {
      // This will throw a business rule error
      await studentService.enrollInCourse(1, 1); // Course at capacity
    } catch (error) {
      console.log('Business Rule Error:', (error as BaseError).toLogFormat());
    }

    try {
      // This will throw an external service error
      await notificationService.sendEmail('fail@example.com', 'Test', 'Body');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('External Service Error:', {
        message: errorMessage,
        isRetryable: (error as BaseError).metadata?.isRetryable
      });
    }
  }
}

// =============================================================================
// MIGRATION HELPERS
// =============================================================================

/**
 * Helper to migrate from old error system
 */
export class ErrorMigrationHelpers {
  // Convert old AppError to new BaseError
  static migrateAppError(oldError: any): BaseError {
    if (oldError.statusCode === 400) {
      return ErrorFactory.validation(oldError.message, oldError.details);
    }
    
    if (oldError.statusCode === 404) {
      return ErrorFactory.notFound('Resource');
    }
    
    if (oldError.statusCode === 401) {
      return ErrorFactory.unauthorized(oldError.message);
    }
    
    if (oldError.statusCode === 403) {
      return ErrorFactory.forbidden(oldError.message);
    }
    
    if (oldError.statusCode === 409) {
      return ErrorFactory.conflict(oldError.message);
    }
    
    // Default to technical error
    return ErrorFactory.technical(
      oldError.message,
      oldError.statusCode || 500,
      oldError.code || 'MIGRATED_ERROR'
    );
  }
}

export default {
  UserService,
  StudentService,
  NotificationService,
  UserController,
  OrderService,
  AccountService,
  ErrorTestExamples,
  ErrorMigrationHelpers
};