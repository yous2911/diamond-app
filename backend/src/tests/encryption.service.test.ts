/**
 * Unit tests for EncryptionService
 * Tests encryption, decryption, hashing, and security features
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as crypto from 'crypto';

// Mock dependencies
vi.mock('crypto', () => ({
  scryptSync: vi.fn(),
  randomBytes: vi.fn(),
  createCipheriv: vi.fn(),
  createDecipheriv: vi.fn(),
  createHash: vi.fn(),
  createHmac: vi.fn(),
  pbkdf2Sync: vi.fn(),
  timingSafeEqual: vi.fn()
}));

vi.mock('../config/config', () => ({
  config: {
    ENCRYPTION_KEY: 'test-encryption-key-32-chars-long',
    JWT_SECRET: 'test-jwt-secret-key',
    JWT_EXPIRES_IN: '1h',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    JWT_REFRESH_EXPIRES_IN: '7d',
    NODE_ENV: 'test'
  },
  dbConfig: {},
  redisConfig: {},
  jwtConfig: {
    secret: 'test-jwt-secret',
    algorithm: 'HS256'
  },
  rateLimitConfig: {},
  authRateLimitConfig: {},
  globalRateLimitConfig: {},
  ddosConfig: {},
  helmetConfig: {},
  corsConfig: {},
  gdprConfig: {},
  emailConfig: {},
  cookieConfig: {
    secret: 'test-cookie-secret',
    httpOnly: true,
    secure: false,
    sameSite: 'lax'
  },
  uploadConfig: {},
  monitoringConfig: {},
  loggingConfig: {}
}));

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('EncryptionService', () => {
  let encryptionService: any;
  let mockCipher: any;
  let mockDecipher: any;
  let mockHash: any;
  let mockHmac: any;

  beforeEach(async () => {
    // Import EncryptionService after mocks are set up
    const { EncryptionService } = await import('../services/encryption.service');
    encryptionService = new EncryptionService();
    
    // Setup mock cipher/decipher
    mockCipher = {
      update: vi.fn().mockReturnValue('encrypted'),
      final: vi.fn().mockReturnValue('final')
    };
    
    mockDecipher = {
      update: vi.fn().mockReturnValue('decrypted'),
      final: vi.fn().mockReturnValue('final')
    };
    
    mockHash = {
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('hashed')
    };
    
    mockHmac = {
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('signed')
    };
    
    (crypto.createCipheriv as any).mockReturnValue(mockCipher);
    (crypto.createDecipheriv as any).mockReturnValue(mockDecipher);
    (crypto.createHash as any).mockReturnValue(mockHash);
    (crypto.createHmac as any).mockReturnValue(mockHmac);
    (crypto.randomBytes as any).mockReturnValue(Buffer.from('random-bytes'));
    (crypto.scryptSync as any).mockReturnValue(Buffer.from('derived-key'));
    (crypto.pbkdf2Sync as any).mockReturnValue(Buffer.from('pbkdf2-key'));
    (crypto.timingSafeEqual as any).mockReturnValue(true);
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      expect(encryptionService).toBeDefined();
    });

    it('should initialize with custom config', async () => {
      const { EncryptionService } = await import('../services/encryption.service');
      const customConfig = {
        rotationIntervalDays: _30,
        keyRetentionDays: _180,
        autoRotation: false
      };
      
      const service = new EncryptionService(customConfig);
      expect(service).toBeDefined();
    });
  });

  describe('encryptSensitiveData', () => {
    it('should encrypt data successfully', () => {
      const data = 'sensitive data';
      
      const result = encryptionService.encryptSensitiveData(data);
      
      expect(crypto.randomBytes).toHaveBeenCalledWith(16);
      expect(crypto.createCipheriv).toHaveBeenCalledWith('aes-256-cbc', expect.any(Uint8Array), expect.any(Buffer));
      expect(mockCipher.update).toHaveBeenCalledWith(data, 'utf8', 'hex');
      expect(mockCipher.final).toHaveBeenCalledWith('hex');
      expect(result).toEqual({
        encrypted: 'encryptedfinal',
        iv: expect.any(String),
        tag: expect.any(String)
      });
    });

    it('should handle empty data', () => {
      const data = '';
      
      const result = encryptionService.encryptSensitiveData(data);
      
      expect(result.encrypted).toBe('encryptedfinal');
      expect(result.iv).toBeDefined();
      expect(result.tag).toBeDefined();
    });
  });

  describe('decryptSensitiveData', () => {
    it('should decrypt data successfully', () => {
      const encryptedData = {
        encrypted: 'encryptedfinal',
        iv: 'hex-iv',
        tag: 'hex-tag'
      };
      
      const result = encryptionService.decryptSensitiveData(encryptedData);
      
      expect(crypto.createDecipheriv).toHaveBeenCalledWith('aes-256-cbc', expect.any(Uint8Array), expect.any(Buffer));
      expect(mockDecipher.update).toHaveBeenCalledWith(encryptedData.encrypted, 'hex', 'utf8');
      expect(mockDecipher.final).toHaveBeenCalledWith('utf8');
      expect(result).toBe('decryptedfinal');
    });

    it('should handle invalid encrypted data', () => {
      const encryptedData = {
        encrypted: 'invalid',
        iv: 'invalid-iv',
        tag: 'invalid-tag'
      };
      
      // Mock decipher to throw error
      mockDecipher.update.mockImplementation(() => {
        throw new Error('Invalid data');
      });
      
      expect(() => encryptionService.decryptSensitiveData(encryptedData)).toThrow('Invalid data');
    });
  });

  describe('hashPersonalData', () => {
    it('should hash personal data with SHA-256', () => {
      const data = 'personal data';
      
      const result = encryptionService.hashPersonalData(data);
      
      expect(crypto.createHash).toHaveBeenCalledWith('sha256');
      expect(mockHash.update).toHaveBeenCalledWith(data);
      expect(mockHash.digest).toHaveBeenCalledWith('hex');
      expect(result).toBe('hashed');
    });

    it('should handle empty data', () => {
      const result = encryptionService.hashPersonalData('');
      
      expect(result).toBe('hashed');
    });
  });

  describe('generateAnonymousId', () => {
    it('should generate anonymous ID', () => {
      const result = encryptionService.generateAnonymousId();
      
      expect(crypto.randomBytes).toHaveBeenCalledWith(16);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('generateSecureToken', () => {
    it('should generate secure token', () => {
      const result = encryptionService.generateSecureToken();
      
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('generateSHA256Hash', () => {
    it('should generate SHA-256 hash', () => {
      const data = 'test data';
      
      const result = encryptionService.generateSHA256Hash(data);
      
      expect(crypto.createHash).toHaveBeenCalledWith('sha256');
      expect(mockHash.update).toHaveBeenCalledWith(data);
      expect(mockHash.digest).toHaveBeenCalledWith('hex');
      expect(result).toBe('hashed');
    });
  });

  describe('generateIntegrityChecksum', () => {
    it('should generate integrity checksum', () => {
      const data = { test: 'data' };
      
      const result = encryptionService.generateIntegrityChecksum(data);
      
      expect(crypto.createHash).toHaveBeenCalledWith('sha256');
      expect(mockHash.update).toHaveBeenCalledWith(JSON.stringify(data));
      expect(mockHash.digest).toHaveBeenCalledWith('hex');
      expect(result).toBe('hashed');
    });
  });

  describe('verifyIntegrityChecksum', () => {
    it('should verify integrity checksum', () => {
      const data = { test: 'data' };
      const checksum = 'hashed';
      
      const result = encryptionService.verifyIntegrityChecksum(data, checksum);
      
      expect(crypto.createHash).toHaveBeenCalledWith('sha256');
      expect(mockHash.update).toHaveBeenCalledWith(JSON.stringify(data));
      expect(mockHash.digest).toHaveBeenCalledWith('hex');
      expect(result).toBe(true);
    });

    it('should return false for invalid checksum', () => {
      mockHash.digest.mockReturnValue('different-hash');
      
      const data = { test: 'data' };
      const checksum = 'hashed';
      
      const result = encryptionService.verifyIntegrityChecksum(data, checksum);
      
      expect(result).toBe(false);
    });
  });

  describe('generateDigitalSignature', () => {
    it('should generate digital signature', () => {
      const data = 'test data';
      
      const result = encryptionService.generateDigitalSignature(data);
      
      expect(crypto.createHmac).toHaveBeenCalledWith('sha256', expect.any(Uint8Array));
      expect(mockHmac.update).toHaveBeenCalledWith(data);
      expect(mockHmac.digest).toHaveBeenCalledWith('hex');
      expect(result).toBe('signed');
    });
  });

  describe('verifyDigitalSignature', () => {
    it('should verify digital signature', () => {
      const data = 'test data';
      const signature = 'signed';
      
      const result = encryptionService.verifyDigitalSignature(data, signature);
      
      expect(crypto.createHmac).toHaveBeenCalledWith('sha256', expect.any(Uint8Array));
      expect(mockHmac.update).toHaveBeenCalledWith(data);
      expect(mockHmac.digest).toHaveBeenCalledWith('hex');
      expect(result).toBe(true);
    });

    it('should return false for invalid signature', () => {
      mockHmac.digest.mockReturnValue('different-signature');
      
      const data = 'test data';
      const signature = 'signed';
      
      const result = encryptionService.verifyDigitalSignature(data, signature);
      
      expect(result).toBe(false);
    });
  });

  describe('generateSalt', () => {
    it('should generate salt', () => {
      const result = encryptionService.generateSalt();
      
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(result).toBeDefined();
      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });

  describe('deriveEncryptionKey', () => {
    it('should derive encryption key', () => {
      const password = 'password';
      const salt = Buffer.from('salt');
      
      const result = encryptionService.deriveEncryptionKey(password, salt);
      
      expect(crypto.scryptSync).toHaveBeenCalledWith(password, salt, 32);
      expect(result).toBeDefined();
      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });

  describe('deriveKeyPBKDF2', () => {
    it('should derive key using PBKDF2', () => {
      const password = 'password';
      const salt = Buffer.from('salt');
      const iterations = 10000;
      const keyLength = 32;
      
      const result = encryptionService.deriveKeyPBKDF2(password, salt, iterations, keyLength);
      
      expect(crypto.pbkdf2Sync).toHaveBeenCalledWith(password, salt, iterations, keyLength, 'sha256');
      expect(result).toBeDefined();
      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });

  describe('secureCompare', () => {
    it('should compare strings securely', () => {
      const a = 'string1';
      const b = 'string1';
      
      const result = encryptionService.secureCompare(a, b);
      
      expect(crypto.timingSafeEqual).toHaveBeenCalledWith(
        Buffer.from(a, 'utf8'),
        Buffer.from(b, 'utf8')
      );
      expect(result).toBe(true);
    });

    it('should return false for different length strings', () => {
      const a = 'short';
      const b = 'longer string';
      
      const result = encryptionService.secureCompare(a, b);
      
      expect(result).toBe(false);
      expect(crypto.timingSafeEqual).not.toHaveBeenCalled();
    });

    it('should return false for different strings', () => {
      (crypto.timingSafeEqual as any).mockReturnValue(false);
      
      const a = 'string1';
      const b = 'string2';
      
      const result = encryptionService.secureCompare(a, b);
      
      expect(result).toBe(false);
    });
  });

  describe('getEncryptionStats', () => {
    it('should return encryption stats', () => {
      const result = encryptionService.getEncryptionStats();
      
      expect(result).toEqual({
        totalKeys: 1,
        activeKeys: 1,
        rotatedKeys: 0,
        deprecatedKeys: 0,
        revokedKeys: 0,
        keysByUsage: {
          'data-encryption': 1
        }
      });
    });
  });

  describe('listKeys', () => {
    it('should list encryption keys', () => {
      const result = encryptionService.listKeys();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'default-key',
        algorithm: 'aes-256-cbc',
        created: expect.any(Date),
        status: 'active',
        version: 1,
        createdAt: expect.any(Date)
      });
    });
  });

  describe('getKeyInfo', () => {
    it('should get key info for existing key', () => {
      const result = encryptionService.getKeyInfo('default-key');
      
      expect(result).toEqual({
        id: 'default-key',
        algorithm: 'aes-256-cbc',
        created: expect.any(Date),
        status: 'active',
        version: 1,
        createdAt: expect.any(Date)
      });
    });

    it('should return null for non-existent key', () => {
      const result = encryptionService.getKeyInfo('non-existent-key');
      
      expect(result).toBeNull();
    });
  });
});
