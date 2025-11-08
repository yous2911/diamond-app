"use strict";
/**
 * Examples of how to use the refactored ServiceFactory
 * This file demonstrates the improvements in testability and maintainability
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupProductionEnvironment = exports.setupTestEnvironment = exports.AnalyticsController = exports.CUSTOM_TOKENS = exports.CustomAnalyticsService = exports.createMockContainer = exports.UserService = exports.ModernController = exports.SomeController = void 0;
const service_factory_1 = require("../service-factory");
// === EXAMPLE 1: Basic Usage (Backwards Compatible) ===
class SomeController {
    async handleRequest() {
        // Old way still works (backwards compatible)
        const encryptionService = service_factory_1.ServiceFactory.getEncryptionService();
        const emailService = service_factory_1.ServiceFactory.getEmailService();
        // Use services...
        return { success: true };
    }
}
exports.SomeController = SomeController;
// === EXAMPLE 2: New Container-Based Usage ===
class ModernController {
    constructor(container = service_factory_1.serviceContainer) {
        this.container = container;
    }
    async handleRequest() {
        // New way - more explicit and testable
        const encryptionService = this.container.resolve(service_factory_1.SERVICE_TOKENS.ENCRYPTION);
        const auditService = this.container.resolve(service_factory_1.SERVICE_TOKENS.AUDIT_TRAIL);
        // Use services...
        return { success: true };
    }
}
exports.ModernController = ModernController;
// === EXAMPLE 3: Dependency Injection in Service Constructor ===
class UserService {
    constructor(container = service_factory_1.serviceContainer) {
        // Services are resolved lazily when needed
        this.encryptionService = container.resolve(service_factory_1.SERVICE_TOKENS.ENCRYPTION);
        this.emailService = container.resolve(service_factory_1.SERVICE_TOKENS.EMAIL);
    }
    async createUser(userData) {
        // Use injected services
        const encryptedData = await this.encryptionService.encrypt(userData.sensitive);
        await this.emailService.sendWelcomeEmail(userData.email);
        return { success: true };
    }
}
exports.UserService = UserService;
// === EXAMPLE 4: Testing with Mocks ===
function createMockContainer() {
    const testContainer = (0, service_factory_1.createServiceContainer)();
    testContainer.enableTestMode();
    // Mock specific services
    testContainer.mock(service_factory_1.SERVICE_TOKENS.EMAIL, {
        sendWelcomeEmail: jest.fn().mockResolvedValue(true),
        sendPasswordReset: jest.fn().mockResolvedValue(true)
    });
    testContainer.mock(service_factory_1.SERVICE_TOKENS.ENCRYPTION, {
        encrypt: jest.fn().mockResolvedValue('encrypted-data'),
        decrypt: jest.fn().mockResolvedValue('decrypted-data')
    });
    return testContainer;
}
exports.createMockContainer = createMockContainer;
// Test example (commented out as it requires jest setup)
/*
async function testUserService() {
  // Create isolated test container
  const mockContainer = createMockContainer();
  
  // Create service with mocked dependencies
  const userService = new UserService(mockContainer);
  
  // Test the service
  const result = await userService.createUser({
    email: 'test@example.com',
    sensitive: 'secret-data'
  });
  
  // Verify mocks were called
  const emailMock = mockContainer.resolve(SERVICE_TOKENS.EMAIL) as any;
  expect(emailMock.sendWelcomeEmail).toHaveBeenCalledWith('test@example.com');
  
  return result;
}
*/
// === EXAMPLE 5: Custom Service Registration ===
class CustomAnalyticsService {
    trackEvent(event, data) {
        console.log('Tracking:', event, data);
    }
}
exports.CustomAnalyticsService = CustomAnalyticsService;
// Register custom service (type-safe extension)
exports.CUSTOM_TOKENS = {
    ...service_factory_1.SERVICE_TOKENS,
    ANALYTICS: 'analytics'
};
service_factory_1.serviceContainer.register(exports.CUSTOM_TOKENS.ANALYTICS, () => new CustomAnalyticsService());
// Use custom service
class AnalyticsController {
    async logUserAction() {
        const analytics = service_factory_1.serviceContainer.resolve(exports.CUSTOM_TOKENS.ANALYTICS);
        analytics.trackEvent('user-login', { timestamp: Date.now() });
    }
}
exports.AnalyticsController = AnalyticsController;
// === EXAMPLE 6: Environment-Specific Container Setup ===
function setupTestEnvironment() {
    const testContainer = (0, service_factory_1.createServiceContainer)();
    testContainer.enableTestMode();
    // Replace global container for tests
    (0, service_factory_1.setServiceContainer)(testContainer);
    return testContainer;
}
exports.setupTestEnvironment = setupTestEnvironment;
function setupProductionEnvironment() {
    // Production setup could include additional services
    const prodContainer = (0, service_factory_1.createServiceContainer)();
    // Register production-specific services
    prodContainer.register('metrics', () => ({
        recordMetric: (name, value) => {
            // Real metrics implementation
        }
    }));
    (0, service_factory_1.setServiceContainer)(prodContainer);
    return prodContainer;
}
exports.setupProductionEnvironment = setupProductionEnvironment;
