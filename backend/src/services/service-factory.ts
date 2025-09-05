// Dependency Injection Container for consistent service management
import { EncryptionService } from './encryption.service';
import { EmailService } from './email.service';
import { AuditTrailService } from './audit-trail.service';
import { ParentalConsentService } from './parental-consent.service';
import { DataAnonymizationService } from './data-anonymization.service';
import { DataRetentionService } from './data-retention.service';
import { FileUploadService } from './file-upload.service';
import { ImageProcessingService } from './image-processing.service';
import { StorageService } from './storage.service';
import { FileSecurityService } from './file-security.service';

// Service identifier tokens
export const SERVICE_TOKENS = {
  ENCRYPTION: 'encryption',
  EMAIL: 'email',
  AUDIT_TRAIL: 'audit',
  PARENTAL_CONSENT: 'consent',
  DATA_ANONYMIZATION: 'anonymization',
  DATA_RETENTION: 'retention',
  FILE_UPLOAD: 'fileUpload',
  IMAGE_PROCESSING: 'imageProcessing',
  STORAGE: 'storage',
  FILE_SECURITY: 'fileSecurity',
} as const;

export type ServiceToken = typeof SERVICE_TOKENS[keyof typeof SERVICE_TOKENS];

// Service factory function type
type ServiceFactory<T = any> = () => T;

// Service registration configuration
interface ServiceConfig {
  factory: ServiceFactory;
  singleton: boolean;
}

/**
 * Dependency Injection Container
 * 
 * Provides proper dependency injection with:
 * - Singleton and transient service lifetimes
 * - Easy mocking for tests
 * - Type-safe service resolution
 * - Clear dependency graph
 */
export class ServiceContainer {
  private services = new Map<ServiceToken, ServiceConfig>();
  private instances = new Map<ServiceToken, any>();
  private isTestMode = false;

  constructor() {
    this.registerDefaultServices();
  }

  /**
   * Register a service with its factory function
   */
  register<T>(
    token: ServiceToken, 
    factory: ServiceFactory<T>, 
    options: { singleton?: boolean } = { singleton: true }
  ): void {
    this.services.set(token, {
      factory,
      singleton: options.singleton ?? true
    });
  }

  /**
   * Resolve a service by its token
   */
  resolve<T>(token: ServiceToken): T {
    const serviceConfig = this.services.get(token);
    
    if (!serviceConfig) {
      throw new Error(`Service '${token}' is not registered`);
    }

    // Return existing instance for singletons
    if (serviceConfig.singleton && this.instances.has(token)) {
      return this.instances.get(token) as T;
    }

    // Create new instance
    const instance = serviceConfig.factory();

    // Cache singleton instances
    if (serviceConfig.singleton) {
      this.instances.set(token, instance);
    }

    return instance as T;
  }

  /**
   * Check if a service is registered
   */
  isRegistered(token: ServiceToken): boolean {
    return this.services.has(token);
  }

  /**
   * Enable test mode for easier mocking
   */
  enableTestMode(): void {
    this.isTestMode = true;
  }

  /**
   * Replace service with mock (useful for testing)
   */
  mock<T>(token: ServiceToken, mockInstance: T): void {
    if (!this.isTestMode && process.env.NODE_ENV !== 'test') {
      throw new Error('Mocking is only allowed in test mode');
    }
    
    this.instances.set(token, mockInstance);
  }

  /**
   * Clear all singleton instances (useful for testing)
   */
  clearInstances(): void {
    this.instances.clear();
  }

  /**
   * Reset container to initial state
   */
  reset(): void {
    this.clearInstances();
    this.services.clear();
    this.isTestMode = false;
    this.registerDefaultServices();
  }

  /**
   * Register all default services
   */
  private registerDefaultServices(): void {
    // Core services with proper dependency management
    this.register(SERVICE_TOKENS.ENCRYPTION, () => new EncryptionService());
    this.register(SERVICE_TOKENS.EMAIL, () => new EmailService());
    this.register(SERVICE_TOKENS.AUDIT_TRAIL, () => new AuditTrailService());
    this.register(SERVICE_TOKENS.PARENTAL_CONSENT, () => new ParentalConsentService());
    this.register(SERVICE_TOKENS.DATA_ANONYMIZATION, () => new DataAnonymizationService());
    this.register(SERVICE_TOKENS.DATA_RETENTION, () => new DataRetentionService());
    
    // File services with dependencies
    this.register(SERVICE_TOKENS.STORAGE, () => new StorageService());
    this.register(SERVICE_TOKENS.FILE_SECURITY, () => new FileSecurityService());
    this.register(SERVICE_TOKENS.IMAGE_PROCESSING, () => new ImageProcessingService());
    this.register(SERVICE_TOKENS.FILE_UPLOAD, () => 
      new FileUploadService()
      // Note: In a future refactor, these could inject their dependencies:
      // new FileUploadService(
      //   this.resolve(SERVICE_TOKENS.STORAGE),
      //   this.resolve(SERVICE_TOKENS.FILE_SECURITY)
      // )
    );
  }

  /**
   * Get service statistics (useful for debugging)
   */
  getServiceStats(): {
    registered: number;
    instantiated: number;
    services: ServiceToken[];
  } {
    return {
      registered: this.services.size,
      instantiated: this.instances.size,
      services: Array.from(this.services.keys())
    };
  }
}

/**
 * Default container instance
 * Can be replaced in tests or different environments
 */
export let serviceContainer = new ServiceContainer();

/**
 * Factory function to create a new container (useful for testing isolation)
 */
export function createServiceContainer(): ServiceContainer {
  return new ServiceContainer();
}

/**
 * Replace global container (useful for testing)
 */
export function setServiceContainer(container: ServiceContainer): void {
  serviceContainer = container;
}

/**
 * Convenience functions for common services (backwards compatibility)
 */
export const ServiceFactory = {
  // Typed service getters
  getEncryptionService: (): EncryptionService => 
    serviceContainer.resolve(SERVICE_TOKENS.ENCRYPTION),
  
  getEmailService: (): EmailService => 
    serviceContainer.resolve(SERVICE_TOKENS.EMAIL),
  
  getAuditTrailService: (): AuditTrailService => 
    serviceContainer.resolve(SERVICE_TOKENS.AUDIT_TRAIL),
  
  getParentalConsentService: (): ParentalConsentService => 
    serviceContainer.resolve(SERVICE_TOKENS.PARENTAL_CONSENT),
  
  getDataAnonymizationService: (): DataAnonymizationService => 
    serviceContainer.resolve(SERVICE_TOKENS.DATA_ANONYMIZATION),
  
  getDataRetentionService: (): DataRetentionService => 
    serviceContainer.resolve(SERVICE_TOKENS.DATA_RETENTION),
  
  getFileUploadService: (): FileUploadService => 
    serviceContainer.resolve(SERVICE_TOKENS.FILE_UPLOAD),
  
  getImageProcessingService: (): ImageProcessingService => 
    serviceContainer.resolve(SERVICE_TOKENS.IMAGE_PROCESSING),
  
  getStorageService: (): StorageService => 
    serviceContainer.resolve(SERVICE_TOKENS.STORAGE),
  
  getFileSecurityService: (): FileSecurityService => 
    serviceContainer.resolve(SERVICE_TOKENS.FILE_SECURITY),

  // Legacy methods for backwards compatibility (deprecated)
  /** @deprecated Use serviceContainer.clearInstances() instead */
  clearInstances: (): void => serviceContainer.clearInstances(),
  
  /** @deprecated Use serviceContainer.mock() instead */
  setMockInstance: (serviceName: string, mockInstance: any): void => {
    serviceContainer.enableTestMode();
    serviceContainer.mock(serviceName as ServiceToken, mockInstance);
  }
};