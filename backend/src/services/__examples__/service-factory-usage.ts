/**
 * Examples of how to use the refactored ServiceFactory
 * This file demonstrates the improvements in testability and maintainability
 */

import { 
  ServiceContainer, 
  ServiceFactory, 
  SERVICE_TOKENS,
  serviceContainer,
  createServiceContainer,
  setServiceContainer
} from '../service-factory';

// === EXAMPLE 1: Basic Usage (Backwards Compatible) ===

export class SomeController {
  async handleRequest() {
    // Old way still works (backwards compatible)
    const encryptionService = ServiceFactory.getEncryptionService();
    const emailService = ServiceFactory.getEmailService();
    
    // Use services...
    return { success: true };
  }
}

// === EXAMPLE 2: New Container-Based Usage ===

export class ModernController {
  constructor(private container: ServiceContainer = serviceContainer) {}

  async handleRequest() {
    // New way - more explicit and testable
    const encryptionService = this.container.resolve(SERVICE_TOKENS.ENCRYPTION);
    const auditService = this.container.resolve(SERVICE_TOKENS.AUDIT_TRAIL);
    
    // Use services...
    return { success: true };
  }
}

// === EXAMPLE 3: Dependency Injection in Service Constructor ===

export class UserService {
  private encryptionService;
  private emailService;
  
  constructor(container: ServiceContainer = serviceContainer) {
    // Services are resolved lazily when needed
    this.encryptionService = container.resolve(SERVICE_TOKENS.ENCRYPTION);
    this.emailService = container.resolve(SERVICE_TOKENS.EMAIL);
  }

  async createUser(userData: any) {
    // Use injected services
    const encryptedData = await this.encryptionService.encrypt(userData.sensitive);
    await this.emailService.sendWelcomeEmail(userData.email);
    
    return { success: true };
  }
}

// === EXAMPLE 4: Testing with Mocks ===

export function createMockContainer() {
  const testContainer = createServiceContainer();
  testContainer.enableTestMode();
  
  // Mock specific services
  testContainer.mock(SERVICE_TOKENS.EMAIL, {
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendPasswordReset: jest.fn().mockResolvedValue(true)
  });
  
  testContainer.mock(SERVICE_TOKENS.ENCRYPTION, {
    encrypt: jest.fn().mockResolvedValue('encrypted-data'),
    decrypt: jest.fn().mockResolvedValue('decrypted-data')
  });
  
  return testContainer;
}

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

export class CustomAnalyticsService {
  trackEvent(event: string, data: any) {
    console.log('Tracking:', event, data);
  }
}

// Register custom service (type-safe extension)
export const CUSTOM_TOKENS = {
  ...SERVICE_TOKENS,
  ANALYTICS: 'analytics'
} as const;

serviceContainer.register(CUSTOM_TOKENS.ANALYTICS as any, () => new CustomAnalyticsService());

// Use custom service
export class AnalyticsController {
  async logUserAction() {
    const analytics = serviceContainer.resolve(CUSTOM_TOKENS.ANALYTICS as any) as CustomAnalyticsService;
    analytics.trackEvent('user-login', { timestamp: Date.now() });
  }
}

// === EXAMPLE 6: Environment-Specific Container Setup ===

export function setupTestEnvironment() {
  const testContainer = createServiceContainer();
  testContainer.enableTestMode();
  
  // Replace global container for tests
  setServiceContainer(testContainer);
  
  return testContainer;
}

export function setupProductionEnvironment() {
  // Production setup could include additional services
  const prodContainer = createServiceContainer();
  
  // Register production-specific services
  prodContainer.register('metrics' as any, () => ({
    recordMetric: (name: string, value: number) => {
      // Real metrics implementation
    }
  }));
  
  setServiceContainer(prodContainer);
  return prodContainer;
}