"use strict";
/**
 * Error Handling Examples
 *
 * Shows how to use the unified error system effectively
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMigrationHelpers = exports.ErrorTestExamples = exports.AccountService = exports.InsufficientFundsError = exports.OrderService = exports.UserController = exports.NotificationService = exports.StudentService = exports.UserService = void 0;
const errors_unified_1 = require("../errors.unified");
const errorHandler_unified_1 = require("../errorHandler.unified");
// =============================================================================
// EXAMPLE 1: BASIC ERROR CREATION AND THROWING
// =============================================================================
class UserService {
    async createUser(userData) {
        // Input validation
        if (!userData.email) {
            throw errors_unified_1.ErrorFactory.validation('Email requis', {
                field: 'email',
                constraint: 'required',
                value: userData.email
            });
        }
        if (!this.isValidEmail(userData.email)) {
            throw errors_unified_1.ErrorFactory.schemaValidation('email', 'format invalide', userData.email);
        }
        try {
            // Simulate database operation
            const existingUser = await this.findUserByEmail(userData.email);
            if (existingUser) {
                throw errors_unified_1.ErrorFactory.duplicate('User', 'email', userData.email);
            }
            // Simulate successful creation
            return { id: 1, ...userData };
        }
        catch (error) {
            if (error instanceof errors_unified_1.BaseError) {
                throw error; // Re-throw known errors
            }
            // Wrap unknown database errors
            throw errors_unified_1.ErrorFactory.database('Erreur lors de la création de l\'utilisateur', error);
        }
    }
    async findUserByEmail(email) {
        // Simulate database lookup
        return email === 'existing@example.com' ? { id: 1, email } : null;
    }
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
}
exports.UserService = UserService;
// =============================================================================
// EXAMPLE 2: BUSINESS LOGIC ERRORS
// =============================================================================
class StudentService {
    async enrollInCourse(studentId, courseId) {
        const student = await this.findStudent(studentId);
        if (!student) {
            throw errors_unified_1.ErrorFactory.notFound('Student', studentId);
        }
        const course = await this.findCourse(courseId);
        if (!course) {
            throw errors_unified_1.ErrorFactory.notFound('Course', courseId);
        }
        // Business rule: Check age requirement
        if (student.age < course.minimumAge) {
            throw errors_unified_1.ErrorFactory.businessRule(`Student must be at least ${course.minimumAge} years old for this course`, 'age_requirement', { studentAge: student.age, requiredAge: course.minimumAge });
        }
        // Business rule: Check enrollment capacity
        if (course.enrolledCount >= course.maxCapacity) {
            throw errors_unified_1.ErrorFactory.businessRule('Course is at maximum capacity', 'capacity_limit', { current: course.enrolledCount, max: course.maxCapacity });
        }
        // Proceed with enrollment...
    }
    async findStudent(id) {
        // Simulate database lookup
        return id === 999 ? null : { id, age: 8 };
    }
    async findCourse(id) {
        // Simulate database lookup
        return {
            id,
            minimumAge: 6,
            maxCapacity: 20,
            enrolledCount: id === 1 ? 20 : 5
        };
    }
}
exports.StudentService = StudentService;
// =============================================================================
// EXAMPLE 3: EXTERNAL SERVICE INTEGRATION
// =============================================================================
class NotificationService {
    async sendEmail(to, subject, body) {
        try {
            // Simulate external email service call
            const response = await this.callEmailService({ to, subject, body });
            if (!response.success) {
                throw errors_unified_1.ErrorFactory.externalService('EmailService', `Failed to send email: ${response.error}`, true, // retryable
                new Error(response.error));
            }
        }
        catch (error) {
            if (error instanceof errors_unified_1.BaseError) {
                throw error;
            }
            // Network or timeout errors - retryable
            if (error instanceof Error && error.message.includes('timeout')) {
                throw errors_unified_1.ErrorFactory.externalService('EmailService', 'Email service timeout', true, error);
            }
            // Other errors - not retryable
            throw errors_unified_1.ErrorFactory.externalService('EmailService', 'Email service unavailable', false, error);
        }
    }
    async callEmailService(data) {
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
exports.NotificationService = NotificationService;
// =============================================================================
// EXAMPLE 4: FASTIFY ROUTE ERROR HANDLING
// =============================================================================
class UserController {
    constructor(userService) {
        this.userService = userService;
        // Using wrapped handler for automatic error handling
        this.createUser = errorHandler_unified_1.ErrorHandlerFactory.createAsyncWrapper(async (request, reply) => {
            const userData = request.body;
            // Add request context to errors
            const context = errors_unified_1.ErrorContextBuilder
                .fromRequest(request)
                .withUserId(request.user?.id)
                .build();
            try {
                const user = await this.userService.createUser(userData);
                reply.send({
                    success: true,
                    data: user,
                    message: 'User created successfully'
                });
            }
            catch (error) {
                // Add context to error if it's a BaseError
                if (error instanceof errors_unified_1.BaseError) {
                    error.metadata.context = { ...error.metadata.context, ...context };
                }
                throw error; // Will be caught by the wrapper and re-thrown properly
            }
        });
    }
    // Manual error handling approach
    async getUserById(request, reply) {
        try {
            const userId = parseInt(request.params.id);
            if (isNaN(userId)) {
                throw errors_unified_1.ErrorFactory.validation('User ID must be a number', {
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
        }
        catch (error) {
            // Let the global error handler deal with it
            await (0, errorHandler_unified_1.unifiedErrorHandler)(error, request, reply);
        }
    }
    async findUserById(id) {
        if (id === 404) {
            throw errors_unified_1.ErrorFactory.notFound('User', id);
        }
        return { id, name: 'Test User' };
    }
}
exports.UserController = UserController;
// =============================================================================
// EXAMPLE 5: ERROR HANDLING IN SERVICES WITH CONTEXT
// =============================================================================
class OrderService {
    async processPayment(orderId, amount, paymentMethod) {
        try {
            // Validate order
            const order = await this.findOrder(orderId);
            if (!order) {
                throw errors_unified_1.ErrorFactory.notFound('Order', orderId);
            }
            // Validate amount
            if (amount !== order.total) {
                throw errors_unified_1.ErrorFactory.businessRule('Payment amount does not match order total', 'amount_mismatch', { paymentAmount: amount, orderTotal: order.total });
            }
            // Process payment with external service
            await this.chargePayment(amount, paymentMethod);
            // Update order status
            await this.updateOrderStatus(orderId, 'paid');
        }
        catch (error) {
            // Add business context to any errors
            if (error instanceof errors_unified_1.BaseError) {
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
    async findOrder(id) {
        return id === 999 ? null : { id, total: 100.00, status: 'pending' };
    }
    async chargePayment(amount, method) {
        if (method === 'invalid_card') {
            throw errors_unified_1.ErrorFactory.businessRule('Invalid payment method', 'invalid_payment_method', { method });
        }
        if (amount > 1000) {
            throw errors_unified_1.ErrorFactory.externalService('PaymentGateway', 'Payment amount exceeds limit', false);
        }
    }
    async updateOrderStatus(id, status) {
        // Simulate database update
    }
}
exports.OrderService = OrderService;
// =============================================================================
// EXAMPLE 6: CUSTOM ERROR CLASSES
// =============================================================================
class InsufficientFundsError extends errors_unified_1.BaseError {
    constructor(requiredAmount, availableAmount) {
        super(`Insufficient funds: required ${requiredAmount}, available ${availableAmount}`, 402, // Payment Required
        'INSUFFICIENT_FUNDS', {
            category: errors_unified_1.ErrorFactory.businessRule('', '').metadata.category,
            severity: errors_unified_1.ErrorFactory.businessRule('', '').metadata.severity,
            isOperational: true,
            isRetryable: false,
            details: { requiredAmount, availableAmount }
        });
    }
}
exports.InsufficientFundsError = InsufficientFundsError;
class AccountService {
    async withdrawFunds(accountId, amount) {
        const account = await this.findAccount(accountId);
        if (!account) {
            throw errors_unified_1.ErrorFactory.notFound('Account', accountId);
        }
        if (account.balance < amount) {
            throw new InsufficientFundsError(amount, account.balance);
        }
        // Proceed with withdrawal
        await this.deductFromAccount(accountId, amount);
    }
    async findAccount(id) {
        return { id, balance: 50.00 };
    }
    async deductFromAccount(id, amount) {
        // Simulate database update
    }
}
exports.AccountService = AccountService;
// =============================================================================
// EXAMPLE 7: ERROR TESTING
// =============================================================================
class ErrorTestExamples {
    static async demonstrateErrorHandling() {
        const userService = new UserService();
        const studentService = new StudentService();
        const notificationService = new NotificationService();
        try {
            // This will throw a validation error
            await userService.createUser({ name: 'Test' }); // Missing email
        }
        catch (error) {
            console.log('Validation Error:', error.toApiResponse());
        }
        try {
            // This will throw a business rule error
            await studentService.enrollInCourse(1, 1); // Course at capacity
        }
        catch (error) {
            console.log('Business Rule Error:', error.toLogFormat());
        }
        try {
            // This will throw an external service error
            await notificationService.sendEmail('fail@example.com', 'Test', 'Body');
        }
        catch (error) {
            console.log('External Service Error:', {
                message: error.message,
                isRetryable: error.metadata.isRetryable
            });
        }
    }
}
exports.ErrorTestExamples = ErrorTestExamples;
// =============================================================================
// MIGRATION HELPERS
// =============================================================================
/**
 * Helper to migrate from old error system
 */
class ErrorMigrationHelpers {
    // Convert old AppError to new BaseError
    static migrateAppError(oldError) {
        if (oldError.statusCode === 400) {
            return errors_unified_1.ErrorFactory.validation(oldError.message, oldError.details);
        }
        if (oldError.statusCode === 404) {
            return errors_unified_1.ErrorFactory.notFound('Resource');
        }
        if (oldError.statusCode === 401) {
            return errors_unified_1.ErrorFactory.unauthorized(oldError.message);
        }
        if (oldError.statusCode === 403) {
            return errors_unified_1.ErrorFactory.forbidden(oldError.message);
        }
        if (oldError.statusCode === 409) {
            return errors_unified_1.ErrorFactory.conflict(oldError.message);
        }
        // Default to technical error
        return errors_unified_1.ErrorFactory.technical(oldError.message, oldError.statusCode || 500, oldError.code || 'MIGRATED_ERROR');
    }
}
exports.ErrorMigrationHelpers = ErrorMigrationHelpers;
exports.default = {
    UserService,
    StudentService,
    NotificationService,
    UserController,
    OrderService,
    AccountService,
    ErrorTestExamples,
    ErrorMigrationHelpers
};
