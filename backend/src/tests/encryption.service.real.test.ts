/**
 * REAL Unit Tests for EncryptionService
 * Tests actual encryption/decryption functions, not mocks
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { EncryptionService } from '../services/encryption.service';

describe('EncryptionService - Real Unit Tests', () => {
  let encryptionService: EncryptionService;

  beforeEach(() => {
    encryptionService = new EncryptionService();
  });

  describe('Data Encryption/Decryption', () => {
    test('encryptSensitiveData encrypts data correctly', () => {
      const testData = 'This is sensitive information';
      const result = encryptionService.encryptSensitiveData(testData);
      
      expect(result).toBeDefined();
      expect(result.encrypted).toBeDefined();
      expect(result.iv).toBeDefined();
      expect(result.tag).toBeDefined();
      expect(result.encrypted).not.toBe(testData);
      expect(result.iv).toMatch(/^[a-f0-9]{32}$/); // 16 bytes = 32 hex chars
      expect(result.tag).toMatch(/^[a-f0-9]{32}$/); // 16 bytes = 32 hex chars
    });

    test('decryptSensitiveData decrypts data correctly', () => {
      const originalData = 'This is sensitive information';
      const encrypted = encryptionService.encryptSensitiveData(originalData);
      const decrypted = encryptionService.decryptSensitiveData(encrypted);
      
      expect(decrypted).toBe(originalData);
    });

    test('encryption/decryption works with empty string', () => {
      const originalData = '';
      const encrypted = encryptionService.encryptSensitiveData(originalData);
      const decrypted = encryptionService.decryptSensitiveData(encrypted);
      
      expect(decrypted).toBe(originalData);
    });

    test('encryption/decryption works with special characters', () => {
      const originalData = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encryptionService.encryptSensitiveData(originalData);
      const decrypted = encryptionService.decryptSensitiveData(encrypted);
      
      expect(decrypted).toBe(originalData);
    });

    test('encryption/decryption works with unicode characters', () => {
      const originalData = 'Unicode: 你好世界 🌍 émojis';
      const encrypted = encryptionService.encryptSensitiveData(originalData);
      const decrypted = encryptionService.decryptSensitiveData(encrypted);
      
      expect(decrypted).toBe(originalData);
    });

    test('encryption/decryption works with JSON data', () => {
      const originalData = JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        preferences: { theme: 'dark', language: 'en' }
      });
      
      const encrypted = encryptionService.encryptSensitiveData(originalData);
      const decrypted = encryptionService.decryptSensitiveData(encrypted);
      
      expect(decrypted).toBe(originalData);
      expect(JSON.parse(decrypted)).toEqual(JSON.parse(originalData));
    });
  });

  describe('Student Data Encryption', () => {
    test('encryptStudentData encrypts student data', async () => {
      const studentData = {
        id: 1,
        prenom: 'Alice',
        nom: 'Dupont',
        email: 'alice@example.com',
        niveauActuel: 'CE2'
      };

      const result = await encryptionService.encryptStudentData(studentData);
      
      expect(result).toBeDefined();
      expect(result.encryptedData).toBeDefined();
      expect(result.iv).toBeDefined();
      expect(result.authTag).toBeDefined();
      expect(result.keyId).toBe('default-key');
      expect(result.algorithm).toBe('aes-256-cbc');
      expect(result.version).toBe(1);
    });

    test('decryptStudentData decrypts student data', async () => {
      const originalData = {
        id: 1,
        prenom: 'Alice',
        nom: 'Dupont',
        email: 'alice@example.com',
        niveauActuel: 'CE2'
      };

      const encrypted = await encryptionService.encryptStudentData(originalData);
      const decrypted = await encryptionService.decryptStudentData({
        encryptedData: encrypted.encryptedData,
        iv: encrypted.iv,
        authTag: encrypted.authTag
      });
      
      expect(decrypted).toEqual(originalData);
    });
  });

  describe('Hashing Functions', () => {
    test('hashPersonalData creates consistent hash', () => {
      const data = 'personal@example.com';
      const hash1 = encryptionService.hashPersonalData(data);
      const hash2 = encryptionService.hashPersonalData(data);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA256 = 64 hex chars
    });

    test('hashPersonalData creates different hashes for different data', () => {
      const hash1 = encryptionService.hashPersonalData('data1');
      const hash2 = encryptionService.hashPersonalData('data2');
      
      expect(hash1).not.toBe(hash2);
    });

    test('generateSHA256Hash creates valid hash', () => {
      const data = 'test data';
      const hash = encryptionService.generateSHA256Hash(data);
      
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    test('generateSHA256Hash is deterministic', () => {
      const data = 'test data';
      const hash1 = encryptionService.generateSHA256Hash(data);
      const hash2 = encryptionService.generateSHA256Hash(data);
      
      expect(hash1).toBe(hash2);
    });
  });

  describe('Token Generation', () => {
    test('generateAnonymousId creates valid ID', () => {
      const id = encryptionService.generateAnonymousId();
      
      expect(id).toMatch(/^[a-f0-9]{32}$/); // 16 bytes = 32 hex chars
    });

    test('generateAnonymousId creates unique IDs', () => {
      const id1 = encryptionService.generateAnonymousId();
      const id2 = encryptionService.generateAnonymousId();
      
      expect(id1).not.toBe(id2);
    });

    test('generateSecureToken creates valid token', () => {
      const token = encryptionService.generateSecureToken();
      
      expect(token).toMatch(/^[a-f0-9]{64}$/); // 32 bytes = 64 hex chars
    });

    test('generateSecureToken creates unique tokens', () => {
      const token1 = encryptionService.generateSecureToken();
      const token2 = encryptionService.generateSecureToken();
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('Integrity Functions', () => {
    test('generateIntegrityChecksum creates valid checksum', () => {
      const data = { name: 'test', value: 123 };
      const checksum = encryptionService.generateIntegrityChecksum(data);
      
      expect(checksum).toMatch(/^[a-f0-9]{64}$/);
    });

    test('verifyIntegrityChecksum verifies correct checksum', () => {
      const data = { name: 'test', value: 123 };
      const checksum = encryptionService.generateIntegrityChecksum(data);
      
      const isValid = encryptionService.verifyIntegrityChecksum(data, checksum);
      expect(isValid).toBe(true);
    });

    test('verifyIntegrityChecksum rejects incorrect checksum', () => {
      const data = { name: 'test', value: 123 };
      const wrongChecksum = 'wrongchecksum';
      
      const isValid = encryptionService.verifyIntegrityChecksum(data, wrongChecksum);
      expect(isValid).toBe(false);
    });

    test('verifyIntegrityChecksum detects data tampering', () => {
      const originalData = { name: 'test', value: 123 };
      const tamperedData = { name: 'test', value: 456 };
      const checksum = encryptionService.generateIntegrityChecksum(originalData);
      
      const isValid = encryptionService.verifyIntegrityChecksum(tamperedData, checksum);
      expect(isValid).toBe(false);
    });
  });

  describe('Digital Signatures', () => {
    test('generateDigitalSignature creates valid signature', () => {
      const data = 'important data';
      const signature = encryptionService.generateDigitalSignature(data);
      
      expect(signature).toMatch(/^[a-f0-9]{64}$/);
    });

    test('verifyDigitalSignature verifies correct signature', () => {
      const data = 'important data';
      const signature = encryptionService.generateDigitalSignature(data);
      
      const isValid = encryptionService.verifyDigitalSignature(data, signature);
      expect(isValid).toBe(true);
    });

    test('verifyDigitalSignature rejects incorrect signature', () => {
      const data = 'important data';
      const wrongSignature = 'wrongsignature';
      
      const isValid = encryptionService.verifyDigitalSignature(data, wrongSignature);
      expect(isValid).toBe(false);
    });
  });

  describe('Key Derivation', () => {
    test('generateSalt creates valid salt', () => {
      const salt = encryptionService.generateSalt();
      
      expect(salt).toBeInstanceOf(Buffer);
      expect(salt.length).toBe(16);
    });

    test('generateSalt creates unique salts', () => {
      const salt1 = encryptionService.generateSalt();
      const salt2 = encryptionService.generateSalt();
      
      expect(salt1).not.toEqual(salt2);
    });

    test('deriveEncryptionKey creates valid key', () => {
      const password = 'testpassword';
      const salt = encryptionService.generateSalt();
      const key = encryptionService.deriveEncryptionKey(password, salt);
      
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32);
    });

    test('deriveKeyPBKDF2 creates valid key', () => {
      const password = 'testpassword';
      const salt = encryptionService.generateSalt();
      const key = encryptionService.deriveKeyPBKDF2(password, salt, 10000, 32);
      
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32);
    });
  });

  describe('Secure Comparison', () => {
    test('secureCompare returns true for identical strings', () => {
      const result = encryptionService.secureCompare('test', 'test');
      expect(result).toBe(true);
    });

    test('secureCompare returns false for different strings', () => {
      const result = encryptionService.secureCompare('test', 'different');
      expect(result).toBe(false);
    });

    test('secureCompare returns false for strings of different lengths', () => {
      const result = encryptionService.secureCompare('test', 'testing');
      expect(result).toBe(false);
    });

    test('secureCompare handles empty strings', () => {
      const result = encryptionService.secureCompare('', '');
      expect(result).toBe(true);
    });
  });

  describe('Service Information', () => {
    test('getEncryptionStats returns valid stats', () => {
      const stats = encryptionService.getEncryptionStats();
      
      expect(stats).toBeDefined();
      expect(stats.totalKeys).toBe(1);
      expect(stats.activeKeys).toBe(1);
      expect(stats.rotatedKeys).toBe(0);
      expect(stats.deprecatedKeys).toBe(0);
      expect(stats.revokedKeys).toBe(0);
      expect(stats.keysByUsage).toBeDefined();
    });

    test('listKeys returns valid key list', () => {
      const keys = encryptionService.listKeys();
      
      expect(keys).toBeDefined();
      expect(keys.length).toBe(1);
      expect(keys[0].id).toBe('default-key');
      expect(keys[0].algorithm).toBe('aes-256-cbc');
      expect(keys[0].status).toBe('active');
    });

    test('getKeyInfo returns valid key info', () => {
      const keyInfo = encryptionService.getKeyInfo('default-key');
      
      expect(keyInfo).toBeDefined();
      expect(keyInfo!.id).toBe('default-key');
      expect(keyInfo!.algorithm).toBe('aes-256-cbc');
      expect(keyInfo!.status).toBe('active');
    });

    test('getKeyInfo returns null for non-existent key', () => {
      const keyInfo = encryptionService.getKeyInfo('non-existent-key');
      expect(keyInfo).toBeNull();
    });

    test('testEncryptionService returns all true', async () => {
      const result = await encryptionService.testEncryptionService();
      
      expect(result.encryption).toBe(true);
      expect(result.decryption).toBe(true);
      expect(result.hashing).toBe(true);
      expect(result.keyGeneration).toBe(true);
      expect(result.integrity).toBe(true);
    });
  });
});





