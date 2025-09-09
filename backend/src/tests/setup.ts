




















// src/tests/setup.ts - Test setup and configuration
import { beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { build } from '../app-test';
import type { FastifyInstance } from 'fastify';

// Mock database modules at the top level
vi.mock('../db/connection', () => {
  // Mock student data
  const mockStudents = [
    {
      id: 1,
      prenom: 'Alice',
      nom: 'Test',
      dateNaissance: new Date('2015-03-15'),
      niveauActuel: 'CP',
      niveauScolaire: 'CP',
      totalPoints: 150,
      serieJours: 5,
      mascotteType: 'dragon'
    }
  ];

  const mockDb = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve(mockStudents)),
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([{
            id: 'mock-audit-id-123',
            entityType: 'student',
            entityId: 'test-student-123',
            action: 'read',
            userId: 'user-456',
            details: { operation: 'view_profile' },
            timestamp: new Date(),
            checksum: 'mock-checksum'
          }])),
          then: vi.fn((callback) => callback(mockStudents))
        })),
        then: vi.fn((callback) => callback(mockStudents))
      }))
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve([{ insertId: 1 }]))
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve({ affectedRows: 1 }))
      }))
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve({ affectedRows: 1 }))
    })),
    execute: vi.fn(() => Promise.resolve([{ test: 1 }])),
    transaction: vi.fn(async (callback) => {
      const tx = {
        insert: vi.fn(() => ({ 
          values: vi.fn(() => Promise.resolve({ 
            insertId: 'mock-audit-id-123',
            affectedRows: 1,
            warningCount: 0 
          }))
        })),
        update: vi.fn(() => ({ 
          set: vi.fn(() => ({ 
            where: vi.fn(() => Promise.resolve({ affectedRows: 1 })) 
          }))
        })),
        delete: vi.fn(() => ({ 
          where: vi.fn(() => Promise.resolve({ affectedRows: 1 })) 
        })),
        select: vi.fn(() => ({ 
          from: vi.fn(() => ({ 
            where: vi.fn(() => ({ 
              limit: vi.fn(() => Promise.resolve([{
                id: 'mock-audit-id-123',
                entityType: 'student',
                entityId: 'test-student-123',
                action: 'read',
                userId: 'user-456',
                details: { operation: 'view_profile' },
                timestamp: new Date(),
                checksum: 'mock-checksum'
              }]))
            }))
          }))
        }))
      };
      return callback(tx);
    })
  };
  
  return {
    connectDatabase: vi.fn(() => Promise.resolve()),
    getDatabase: vi.fn(() => mockDb),
    testConnection: vi.fn(() => Promise.resolve(true)),
    checkDatabaseHealth: vi.fn(() => Promise.resolve({
      status: 'healthy',
      message: 'Mock database OK',
      responseTime: 5
    })),
    disconnectDatabase: vi.fn(() => Promise.resolve()),
    db: mockDb,
    connection: {
      execute: vi.fn(() => Promise.resolve([{ test: 1 }])),
      getConnection: vi.fn(() => Promise.resolve({
        beginTransaction: vi.fn(),
        commit: vi.fn(),
        rollback: vi.fn(),
        release: vi.fn(),
        execute: vi.fn(() => Promise.resolve([]))
      }))
    }
  };
});

vi.mock('../db/setup', () => ({
  setupDatabase: vi.fn(() => {
    console.log('🧪 Using mock database for tests');
    return Promise.resolve();
  }),
  resetDatabase: vi.fn(() => Promise.resolve()),
  checkDatabaseSetup: vi.fn(() => Promise.resolve({
    isSetup: true,
    studentCount: 1,
    exerciseCount: 1
  }))
}));

// Mock Redis/Cache modules
vi.mock('../utils/cache', () => ({
  getCachedData: vi.fn(() => Promise.resolve(null)),
  setCachedData: vi.fn(() => Promise.resolve()),
  deleteCachedData: vi.fn(() => Promise.resolve()),
  clearCache: vi.fn(() => Promise.resolve())
}));

// Mock EmaiService
vi.mock('../services/email.service', () => ({
  EmailService: vi.fn().mockImplementation(() => ({
    sendEmail: vi.fn(() => Promise.resolve()),
    sendBulkEmail: vi.fn(() => Promise.resolve()),
    sendTemplateEmail: vi.fn(() => Promise.resolve()),
    validateEmail: vi.fn(() => Promise.resolve(true)),
    getEmailTemplates: vi.fn(() => Promise.resolve([])),
    createEmailTemplate: vi.fn(() => Promise.resolve()),
    updateEmailTemplate: vi.fn(() => Promise.resolve()),
    deleteEmailTemplate: vi.fn(() => Promise.resolve()),
    // Template management methods
    getAvailableTemplates: vi.fn(() => [
      'user-registration-welcome',
      'user-registration-verification',
      'password-reset-request',
      'password-reset-confirmation',
      'student-progress-report',
      'achievement-notification',
      'maintenance-notification',
      'security-alert'
    ]),
    validateTemplateVariables: vi.fn((_template, variables) => ({
      valid: Object.keys(variables).length > 0,
      missing: [],
      extra: []
    })),
    // User registration methods
    sendUserRegistrationWelcome: vi.fn(() => Promise.resolve()),
    sendUserRegistrationVerification: vi.fn(() => Promise.resolve()),
    // Password reset methods
    sendPasswordResetRequest: vi.fn(() => Promise.resolve()),
    sendPasswordResetConfirmation: vi.fn(() => Promise.resolve()),
    // Notification methods
    sendStudentProgressReport: vi.fn(() => Promise.resolve()),
    sendAchievementNotification: vi.fn(() => Promise.resolve()),
    sendMaintenanceNotification: vi.fn(() => Promise.resolve()),
    sendSecurityAlert: vi.fn(() => Promise.resolve()),
    // Bulk operations
    sendBulkEmails: vi.fn(() => Promise.resolve()),
    // Service health
    getEmailServiceStatus: vi.fn(() => ({
      status: 'healthy',
      smtpConnected: true,
      templatesLoaded: true,
      lastSent: new Date()
    })),
    sendTestEmail: vi.fn(() => Promise.resolve())
  }))
}));

// Mock Data Anonymization Service
vi.mock('../services/data-anonymization.service', () => ({
  DataAnonymizationService: vi.fn().mockImplementation(() => ({
    anonymizeStudentData: vi.fn(() => Promise.resolve({ success: true })),
    deleteStudentData: vi.fn(() => Promise.resolve({ success: true })),
    scheduleDataDeletion: vi.fn(() => Promise.resolve()),
    getRetentionStatus: vi.fn(() => Promise.resolve({ status: 'active' })),
    processRetentionRequests: vi.fn(() => Promise.resolve()),
    generateDataReport: vi.fn(() => Promise.resolve({ students: [], summary: {} }))
  }))
}));

// Mock Audit TraiService to always succeed
vi.mock('../services/audit-trail.service', () => {
  const mockAuditService = {
    logAction: vi.fn(() => Promise.resolve('mock-audit-id-123')),
    queryAuditLogs: vi.fn(() => Promise.resolve({
      entries: [{
        id: 'mock-audit-id-123',
        entityType: 'student',
        entityId: 'test-student-123',
        action: 'read',
        userId: 'user-456',
        details: { operation: 'view_profile' },
        timestamp: new Date(),
        checksum: 'mock-checksum'
      }],
      total: 1,
      hasMore: false
    })),
    generateComplianceReport: vi.fn(() => Promise.resolve({ 
      id: 'mock-report-123',
      success: true,
      filters: {},
      exportFormat: 'json',
      categories: ['audit', 'compliance'],
      generatedAt: new Date()
    })),
    getStudentAuditTrail: vi.fn(() => Promise.resolve([{
      id: 'mock-trail-123',
      entityType: 'student',
      action: 'read',
      timestamp: new Date(),
      details: { operation: 'view_profile' }
    }])),
    anonymizeStudentAuditLogs: vi.fn(() => Promise.resolve({ count: 5 })),
    verifyAuditIntegrity: vi.fn(() => Promise.resolve({ 
      valid: true, 
      tampering: false,
      originalChecksum: 'mock-checksum',
      calculatedChecksum: 'mock-checksum'
    })),
    detectSecurityAnomalies: vi.fn(() => Promise.resolve({
      entityId: 'test-entity',
      anomalies: []
    })),
    cleanupOldAuditLogs: vi.fn(() => Promise.resolve({ deleted: 0 }))
  };

  return {
    AuditTrailService: vi.fn().mockImplementation(() => mockAuditService),
    // Also export the service instance for direct imports
    auditTrailService: mockAuditService,
    default: mockAuditService
  };
});

// Mock File System for upload tests  
vi.mock('fs/promises', () => ({
  readFile: vi.fn(() => Promise.resolve(Buffer.from('test file content'))),
  writeFile: vi.fn(() => Promise.resolve()),
  unlink: vi.fn(() => Promise.resolve()),
  mkdir: vi.fn(() => Promise.resolve()),
  stat: vi.fn(() => Promise.resolve({ size: 1024 }))
}));

// Mock services that depend on complex DB operations
vi.mock('../services/gdpr.service', () => ({
  gdprService: {
    logDataProcessing: vi.fn(() => Promise.resolve({ id: 1 })),
    getComplianceStatus: vi.fn(() => Promise.resolve({ 
      status: 'healthy',
      gdprEnabled: true,
      message: 'Service RGPD opérationnel' 
    }))
  }
}));

vi.mock('../services/consent.service', () => ({
  consentService: {
    submitConsentRequest: vi.fn(() => Promise.resolve({ 
      id: 1, 
      token: 'test-token-123',
      status: 'pending'
    }))
  }
}));

export let app: FastifyInstance;
let setupComplete = false;

beforeAll(async () => {
  if (setupComplete) {
    return; // Skip if already setup
  }
  
  try {
    console.log('🧪 Setting up test environment with mocks...');
    
    // Build the test app only once
    if (!app) {
      app = await build();
      await app.ready();
    }
    
    setupComplete = true;
    console.log('✅ Test environment setup complete');
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    throw error;
  }
});

beforeEach(() => {
  // Clear mocks between tests
  vi.clearAllMocks();
});

afterAll(async () => {
  if (app && setupComplete) {
    await app.close();
    setupComplete = false;
  }
});
