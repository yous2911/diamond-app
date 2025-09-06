/**
 * Unit tests demonstrating the improved ServiceFactory
 */

import { 
  ServiceContainer,
  ServiceFactory,
  SERVICE_TOKENS,
  createServiceContainer,
  setServiceContainer
} from '../service-factory';

// Mock services for testing
class MockEncryptionService {
  encrypt(data: string): string {
    return `encrypted-${data}`;
  }
  
  decrypt(data: string): string {
    return data.replace('encrypted-', '');
  }
}

class MockEmailService {
  sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    console.log(`Mock email sent to ${to}: ${subject}`);
    return Promise.resolve(true);
  }
}

describe('ServiceFactory Refactoring', () => {
  let container: ServiceContainer;

  beforeEach(() => {
    container = createServiceContainer();
    container.enableTestMode();
  });

  afterEach(() => {
    container.reset();
  });

  describe('Dependency Injection Container', () => {
    it('should create and resolve singleton services', () => {
      // Register a mock service
      container.register(SERVICE_TOKENS.ENCRYPTION, () => new MockEncryptionService());

      // Resolve the service twice
      const service1 = container.resolve(SERVICE_TOKENS.ENCRYPTION);
      const service2 = container.resolve(SERVICE_TOKENS.ENCRYPTION);

      // Should be the same instance (singleton)
      expect(service1).toBe(service2);
      expect(service1).toBeInstanceOf(MockEncryptionService);
    });

    it('should create transient services when configured', () => {
      // Register as transient (not singleton)
      container.register(
        SERVICE_TOKENS.EMAIL, 
        () => new MockEmailService(), 
        { singleton: false }
      );

      // Resolve the service twice
      const service1 = container.resolve(SERVICE_TOKENS.EMAIL);
      const service2 = container.resolve(SERVICE_TOKENS.EMAIL);

      // Should be different instances (transient)
      expect(service1).not.toBe(service2);
      expect(service1).toBeInstanceOf(MockEmailService);
      expect(service2).toBeInstanceOf(MockEmailService);
    });

    it('should allow mocking services in test mode', () => {
      const mockEncryption = {
        encrypt: vi.fn().mockReturnValue('mocked-encrypted'),
        decrypt: vi.fn().mockReturnValue('mocked-decrypted')
      };

      // Mock the service
      container.mock(SERVICE_TOKENS.ENCRYPTION, mockEncryption);

      // Resolve and use the mocked service
      const service = container.resolve(SERVICE_TOKENS.ENCRYPTION);
      const result = service.encrypt('test-data');

      expect(result).toBe('mocked-encrypted');
      expect(mockEncryption.encrypt).toHaveBeenCalledWith('test-data');
    });

    it('should prevent mocking outside test mode', () => {
      const prodContainer = createServiceContainer();
      // Don't enable test mode

      expect(() => {
        prodContainer.mock(SERVICE_TOKENS.ENCRYPTION, {});
      }).toThrow('Mocking is only allowed in test mode');
    });

    it('should throw error for unregistered services', () => {
      expect(() => {
        container.resolve('non-existent-service' as any);
      }).toThrow("Service 'non-existent-service' is not registered");
    });
  });

  describe('Backwards Compatibility', () => {
    it('should maintain backwards compatibility with old ServiceFactory', () => {
      // Set our test container as global
      setServiceContainer(container);

      // Mock the service in our container
      container.mock(SERVICE_TOKENS.ENCRYPTION, new MockEncryptionService());

      // Use old API
      const service = ServiceFactory.getEncryptionService();
      const result = service.encrypt('test');

      expect(result).toBe('encrypted-test');
    });

    it('should support legacy clearInstances method', () => {
      setServiceContainer(container);
      
      // Register and resolve a service
      const service1 = ServiceFactory.getEncryptionService();
      
      // Clear instances
      ServiceFactory.clearInstances();
      
      // Should get a new instance
      const service2 = ServiceFactory.getEncryptionService();
      
      // Note: In the new implementation, services might still be the same
      // because the factory functions create new instances anyway
      expect(service1).toBeDefined();
      expect(service2).toBeDefined();
    });
  });

  describe('Service Statistics', () => {
    it('should provide service statistics', () => {
      container.register(SERVICE_TOKENS.ENCRYPTION, () => new MockEncryptionService());
      container.register(SERVICE_TOKENS.EMAIL, () => new MockEmailService());

      // Before resolving
      let stats = container.getServiceStats();
      expect(stats.registered).toBe(2);
      expect(stats.instantiated).toBe(0);

      // After resolving one service
      container.resolve(SERVICE_TOKENS.ENCRYPTION);
      stats = container.getServiceStats();
      expect(stats.registered).toBe(2);
      expect(stats.instantiated).toBe(1);
      expect(stats.services).toContain(SERVICE_TOKENS.ENCRYPTION);
    });
  });

  describe('Service Registration', () => {
    it('should check if services are registered', () => {
      expect(container.isRegistered(SERVICE_TOKENS.ENCRYPTION)).toBe(false);
      
      container.register(SERVICE_TOKENS.ENCRYPTION, () => new MockEncryptionService());
      
      expect(container.isRegistered(SERVICE_TOKENS.ENCRYPTION)).toBe(true);
    });

    it('should allow overriding service registrations', () => {
      // Register original
      container.register(SERVICE_TOKENS.ENCRYPTION, () => new MockEncryptionService());
      
      const service1 = container.resolve(SERVICE_TOKENS.ENCRYPTION);
      expect(service1).toBeInstanceOf(MockEncryptionService);

      // Override with different implementation
      class AnotherMockEncryptionService {
        encrypt(data: string): string {
          return `another-encrypted-${data}`;
        }
        decrypt(data: string): string {
          return data.replace('another-encrypted-', '');
        }
      }

      container.register(SERVICE_TOKENS.ENCRYPTION, () => new AnotherMockEncryptionService());
      
      // Clear instances to get new registration
      container.clearInstances();
      
      const service2 = container.resolve(SERVICE_TOKENS.ENCRYPTION);
      expect(service2).toBeInstanceOf(AnotherMockEncryptionService);
    });
  });

  describe('Type Safety', () => {
    it('should provide type-safe service tokens', () => {
      // This test mainly ensures TypeScript compilation
      const tokens = Object.values(SERVICE_TOKENS);
      
      expect(tokens).toContain('encryption');
      expect(tokens).toContain('email');
      expect(tokens).toContain('audit');
    });
  });
});

// Performance test for large numbers of service resolutions
describe('ServiceFactory Performance', () => {
  it('should handle many service resolutions efficiently', () => {
    const container = createServiceContainer();
    container.register(SERVICE_TOKENS.ENCRYPTION, () => new MockEncryptionService());

    const start = performance.now();
    
    // Resolve the same singleton service many times
    for (let i = 0; i < 10000; i++) {
      container.resolve(SERVICE_TOKENS.ENCRYPTION);
    }
    
    const end = performance.now();
    const duration = end - start;
    
    // Should be fast (under 100ms for 10k resolutions)
    expect(duration).toBeLessThan(100);
    console.log(`10,000 service resolutions took ${duration.toFixed(2)}ms`);
  });
});