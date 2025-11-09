/**
 * Tests unitaires pour AuditTrailService
 * Vérifie la conformité GDPR et l'intégrité des logs d'audit
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditTrailService } from '../services/audit-trail.service';
import { db } from '../db/connection';
import { EncryptionService } from '../services/encryption.service';

vi.mock('../services/encryption.service');

describe('AuditTrailService', () => {
  let auditService: AuditTrailService;

  beforeEach(() => {
    auditService = new AuditTrailService();
    vi.clearAllMocks();
  });

  describe('logAction', () => {
    it('should successfully log a basic audit action', async () => {
      const auditId = await auditService.logAction({
        entityType: 'student',
        entityId: 'test-student-123',
        action: 'read',
        userId: 'user-456',
        details: {
          operation: 'view_profile'
        },
        ipAddress: '192.168.1.1',
        userAgent: 'Test Browser',
        severity: 'low',
        timestamp: new Date()
      });

      expect(auditId).toBeTruthy();
      expect(auditId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

      // Verify that the db.transaction method was called
      expect(db.transaction).toHaveBeenCalled();
    });
  });
});
