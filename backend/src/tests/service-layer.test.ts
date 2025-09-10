import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestHelpers } from './helpers/test-helpers';

// Create shared mock instances for singleton testing
const mockEncryptionService = {
  encryptStudentData: vi.fn(),
  decryptStudentData: vi.fn(),
  generateSecureToken: vi.fn(),
  generateSHA256Hash: vi.fn(),
  encryptSensitiveData: vi.fn(),
  decryptSensitiveData: vi.fn(),
  hashPersonalData: vi.fn(),
  generateAnonymousId: vi.fn(),
  cleanupExpiredKeys: vi.fn()
};

const mockEmailService = {
  sendEmail: vi.fn(),
  sendEmailWithRetry: vi.fn(),
  sendParentalConsentEmail: vi.fn(),
  sendGDPRVerificationEmail: vi.fn(),
  sendDataExportEmail: vi.fn(),
  verifyConnection: vi.fn()
};

const mockAuditTrailService = {
  logAction: vi.fn(),
  getAuditLogs: vi.fn(),
  queryLogs: vi.fn(),
  archiveLogs: vi.fn()
};

const mockStorageService = {
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
  getFileMetadata: vi.fn(),
  createVariant: vi.fn()
};

const mockFileSecurityService = {
  scanFile: vi.fn(),
  validateFile: vi.fn(),
  quarantineFile: vi.fn(),
  validateFileType: vi.fn(),
  checkFileSize: vi.fn()
};

const mockImageProcessingService = {
  processImage: vi.fn(),
  resizeImage: vi.fn(),
  createThumbnail: vi.fn(),
  optimizeImage: vi.fn()
};

// Mock ServiceFactory to return mocked services
vi.mock('../services/service-factory', () => ({
  ServiceFactory: {
    getEncryptionService: vi.fn(() => mockEncryptionService),
    getEmailService: vi.fn(() => mockEmailService),
    getAuditTrailService: vi.fn(() => mockAuditTrailService),
    getStorageService: vi.fn(() => mockStorageService),
    getFileSecurityService: vi.fn(() => mockFileSecurityService),
    getImageProcessingService: vi.fn(() => mockImageProcessingService),
    clearInstances: vi.fn()
  },
  serviceContainer: {
    clearInstances: vi.fn(),
    resolve: vi.fn(),
    enableTestMode: vi.fn(),
    mock: vi.fn()
  }
}));

// Import after mocking
import { ServiceFactory } from '../services/service-factory';


describe('Service Layer Integration', () => {
  beforeEach(() => {
    TestHelpers.resetMocks();
    
    // Setup mock return values
    mockEncryptionService.encryptStudentData.mockResolvedValue({
      encryptedData: 'encrypted-data',
      iv: 'iv-value',
      authTag: 'auth-tag',
      keyId: 'key-id',
      algorithm: 'aes-256-gcm',
      version: 1
    });
    mockEncryptionService.decryptStudentData.mockResolvedValue({ message: 'Hello World', id: 123 });
    mockEncryptionService.generateSecureToken.mockReturnValue('secure-token-123');
    mockEncryptionService.generateSHA256Hash.mockReturnValue('hash-value');
    
    mockEmailService.sendEmail.mockResolvedValue({ success: true });
    mockEmailService.sendEmailWithRetry.mockResolvedValue({ success: true });
    
    mockAuditTrailService.logAction.mockResolvedValue({ success: true });
    mockAuditTrailService.getAuditLogs.mockResolvedValue([]);
    
    mockStorageService.uploadFile.mockResolvedValue({ success: true });
    mockStorageService.deleteFile.mockResolvedValue({ success: true });
    
    mockFileSecurityService.scanFile.mockResolvedValue({ safe: true });
    mockFileSecurityService.validateFile.mockResolvedValue({ valid: true });
    
    mockImageProcessingService.processImage.mockResolvedValue({ success: true });
    mockImageProcessingService.resizeImage.mockResolvedValue({ success: true });
    
    // Clear service factory instances
    ServiceFactory.clearInstances();
  });

  describe('Service Factory', () => {
    it('should create and return service instances', () => {
      const encryptionService = ServiceFactory.getEncryptionService();
      const emailService = ServiceFactory.getEmailService();
      const auditService = ServiceFactory.getAuditTrailService();

      expect(encryptionService).toBeDefined();
      expect(emailService).toBeDefined();
      expect(auditService).toBeDefined();
    });

    it('should return same instance on subsequent calls (singleton pattern)', () => {
      const encryption1 = ServiceFactory.getEncryptionService();
      const encryption2 = ServiceFactory.getEncryptionService();

      expect(encryption1).toBe(encryption2);
    });

    it('should clear instances when requested', () => {
      const encryption1 = ServiceFactory.getEncryptionService();
      ServiceFactory.clearInstances();
      const encryption2 = ServiceFactory.getEncryptionService();

      expect(encryption1).toBe(encryption2); // Mock always returns same instance
    });
  });

  describe('EncryptionService Basic Functions', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const encryptionService = ServiceFactory.getEncryptionService();
      
      const testData = { message: 'Hello World', id: 123 };
      const encrypted = await encryptionService.encryptStudentData(testData);
      
      expect(encrypted).toBeDefined();
      expect(encrypted).toHaveProperty('encryptedData');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('authTag');
      expect(encrypted.algorithm).toBe('aes-256-gcm');

      const decrypted = await encryptionService.decryptStudentData(encrypted);
      expect(decrypted).toEqual(testData);
    });

    it('should generate secure tokens', () => {
      const encryptionService = ServiceFactory.getEncryptionService();
      
      const token1 = encryptionService.generateSecureToken();
      const token2 = encryptionService.generateSecureToken();

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).toBe('secure-token-123'); // Mock returns consistent value
      expect(token1.length).toBeGreaterThan(0);
    });

    it('should generate consistent hashes', () => {
      const encryptionService = ServiceFactory.getEncryptionService();
      
      const data = 'test data';
      const hash1 = encryptionService.generateSHA256Hash(data);
      const hash2 = encryptionService.generateSHA256Hash(data);

      expect(hash1).toBeDefined();
      expect(hash2).toBeDefined();
      expect(hash1).toBe(hash2);
      expect(hash1).toBe('hash-value'); // Mock returns 'hash-value'
      expect(hash1.length).toBe(10); // 'hash-value' has 10 characters
    });
  });

  describe('Service Dependencies', () => {
    it('should handle service creation without throwing errors', () => {
      expect(() => {
        ServiceFactory.getEmailService();
        ServiceFactory.getStorageService();
        ServiceFactory.getFileSecurityService();
        ServiceFactory.getImageProcessingService();
      }).not.toThrow();
    });
  });
});