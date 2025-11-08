"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceFactory = exports.setServiceContainer = exports.createServiceContainer = exports.serviceContainer = exports.ServiceContainer = exports.SERVICE_TOKENS = void 0;
// Dependency Injection Container for consistent service management
const encryption_service_1 = require("./encryption.service");
const email_service_1 = require("./email.service");
const audit_trail_service_1 = require("./audit-trail.service");
const parental_consent_service_1 = require("./parental-consent.service");
const data_anonymization_service_1 = require("./data-anonymization.service");
const data_retention_service_1 = require("./data-retention.service");
const file_upload_service_1 = require("./file-upload.service");
const image_processing_service_1 = require("./image-processing.service");
const storage_service_1 = require("./storage.service");
const file_security_service_1 = require("./file-security.service");
const supermemo_service_1 = require("./supermemo.service");
// Service identifier tokens
exports.SERVICE_TOKENS = {
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
    SUPER_MEMO: 'superMemo',
};
/**
 * Dependency Injection Container
 *
 * Provides proper dependency injection with:
 * - Singleton and transient service lifetimes
 * - Easy mocking for tests
 * - Type-safe service resolution
 * - Clear dependency graph
 */
class ServiceContainer {
    constructor() {
        this.services = new Map();
        this.instances = new Map();
        this.isTestMode = false;
        this.registerDefaultServices();
    }
    /**
     * Register a service with its factory function
     */
    register(token, factory, options = { singleton: true }) {
        this.services.set(token, {
            factory,
            singleton: options.singleton ?? true
        });
    }
    /**
     * Resolve a service by its token
     */
    resolve(token) {
        const serviceConfig = this.services.get(token);
        if (!serviceConfig) {
            throw new Error(`Service '${token}' is not registered`);
        }
        // Return existing instance for singletons
        if (serviceConfig.singleton && this.instances.has(token)) {
            return this.instances.get(token);
        }
        // Create new instance
        const instance = serviceConfig.factory();
        // Cache singleton instances
        if (serviceConfig.singleton) {
            this.instances.set(token, instance);
        }
        return instance;
    }
    /**
     * Check if a service is registered
     */
    isRegistered(token) {
        return this.services.has(token);
    }
    /**
     * Enable test mode for easier mocking
     */
    enableTestMode() {
        this.isTestMode = true;
    }
    /**
     * Replace service with mock (useful for testing)
     */
    mock(token, mockInstance) {
        if (!this.isTestMode && process.env.NODE_ENV !== 'test') {
            throw new Error('Mocking is only allowed in test mode');
        }
        this.instances.set(token, mockInstance);
    }
    /**
     * Clear all singleton instances (useful for testing)
     */
    clearInstances() {
        this.instances.clear();
    }
    /**
     * Reset container to initial state
     */
    reset() {
        this.clearInstances();
        this.services.clear();
        this.isTestMode = false;
        this.registerDefaultServices();
    }
    /**
     * Register all default services
     */
    registerDefaultServices() {
        // Core services with proper dependency management
        this.register(exports.SERVICE_TOKENS.ENCRYPTION, () => new encryption_service_1.EncryptionService());
        this.register(exports.SERVICE_TOKENS.EMAIL, () => new email_service_1.EmailService());
        this.register(exports.SERVICE_TOKENS.AUDIT_TRAIL, () => new audit_trail_service_1.AuditTrailService());
        this.register(exports.SERVICE_TOKENS.PARENTAL_CONSENT, () => new parental_consent_service_1.ParentalConsentService());
        this.register(exports.SERVICE_TOKENS.DATA_ANONYMIZATION, () => new data_anonymization_service_1.DataAnonymizationService());
        this.register(exports.SERVICE_TOKENS.DATA_RETENTION, () => new data_retention_service_1.DataRetentionService());
        // File services with dependencies
        this.register(exports.SERVICE_TOKENS.STORAGE, () => new storage_service_1.StorageService());
        this.register(exports.SERVICE_TOKENS.FILE_SECURITY, () => new file_security_service_1.FileSecurityService());
        this.register(exports.SERVICE_TOKENS.IMAGE_PROCESSING, () => new image_processing_service_1.ImageProcessingService());
        this.register(exports.SERVICE_TOKENS.FILE_UPLOAD, () => new file_upload_service_1.FileUploadService()
        // Note: In a future refactor, these could inject their dependencies:
        // new FileUploadService(
        //   this.resolve(SERVICE_TOKENS.STORAGE),
        //   this.resolve(SERVICE_TOKENS.FILE_SECURITY)
        // )
        );
        // Educational services
        this.register(exports.SERVICE_TOKENS.SUPER_MEMO, () => new supermemo_service_1.SuperMemoService());
    }
    /**
     * Get service statistics (useful for debugging)
     */
    getServiceStats() {
        return {
            registered: this.services.size,
            instantiated: this.instances.size,
            services: Array.from(this.services.keys())
        };
    }
}
exports.ServiceContainer = ServiceContainer;
/**
 * Default container instance
 * Can be replaced in tests or different environments
 */
exports.serviceContainer = new ServiceContainer();
/**
 * Factory function to create a new container (useful for testing isolation)
 */
function createServiceContainer() {
    return new ServiceContainer();
}
exports.createServiceContainer = createServiceContainer;
/**
 * Replace global container (useful for testing)
 */
function setServiceContainer(container) {
    exports.serviceContainer = container;
}
exports.setServiceContainer = setServiceContainer;
/**
 * Convenience functions for common services (backwards compatibility)
 */
exports.ServiceFactory = {
    // Typed service getters
    getEncryptionService: () => exports.serviceContainer.resolve(exports.SERVICE_TOKENS.ENCRYPTION),
    getEmailService: () => exports.serviceContainer.resolve(exports.SERVICE_TOKENS.EMAIL),
    getAuditTrailService: () => exports.serviceContainer.resolve(exports.SERVICE_TOKENS.AUDIT_TRAIL),
    getParentalConsentService: () => exports.serviceContainer.resolve(exports.SERVICE_TOKENS.PARENTAL_CONSENT),
    getDataAnonymizationService: () => exports.serviceContainer.resolve(exports.SERVICE_TOKENS.DATA_ANONYMIZATION),
    getDataRetentionService: () => exports.serviceContainer.resolve(exports.SERVICE_TOKENS.DATA_RETENTION),
    getFileUploadService: () => exports.serviceContainer.resolve(exports.SERVICE_TOKENS.FILE_UPLOAD),
    getImageProcessingService: () => exports.serviceContainer.resolve(exports.SERVICE_TOKENS.IMAGE_PROCESSING),
    getStorageService: () => exports.serviceContainer.resolve(exports.SERVICE_TOKENS.STORAGE),
    getFileSecurityService: () => exports.serviceContainer.resolve(exports.SERVICE_TOKENS.FILE_SECURITY),
    getSuperMemoService: () => exports.serviceContainer.resolve(exports.SERVICE_TOKENS.SUPER_MEMO),
    // Legacy methods for backwards compatibility (deprecated)
    /** @deprecated Use serviceContainer.clearInstances() instead */
    clearInstances: () => exports.serviceContainer.clearInstances(),
    /** @deprecated Use serviceContainer.mock() instead */
    setMockInstance: (serviceName, mockInstance) => {
        exports.serviceContainer.enableTestMode();
        exports.serviceContainer.mock(serviceName, mockInstance);
    }
};
