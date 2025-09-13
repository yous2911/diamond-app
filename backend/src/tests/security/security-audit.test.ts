import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
vi.unmock('../../services/security-audit.service');

// Mock the SecurityAuditService before import
// vi.mock('../../services/security-audit.service', () => {
  /* const mockSecurityAuditService = {
    logIncident: vi.fn((type, severity, component, request, details) => {
      const id = Math.random().toString(36).substring(2, 15);
      return Promise.resolve(id);
    }),
    logManualIncident: vi.fn((type, severity, component, details) => {
      const id = Math.random().toString(36).substring(2, 15);
      return Promise.resolve(id);
    }),
    getIncidentById: vi.fn((id) => {
      if (id === 'non-existent') return Promise.resolve(null);
      return Promise.resolve({
        id,
        type: 'XSS_ATTEMPT',
        severity: 'high',
        component: 'INPUT_SANITIZATION',
        timestamp: new Date(),
        ip: '127.0.0.1',
        userAgent: 'test-agent',
        details: { message: 'Test incident' }
      });
    }),
    getIncidentsByType: vi.fn((type) => {
      return Promise.resolve([
        {
          id: '1',
          type,
          severity: 'high',
          component: 'INPUT_SANITIZATION',
          timestamp: new Date(),
          ip: '127.0.0.1',
          userAgent: 'test-agent',
          details: { message: 'Test incident' }
        }
      ]);
    }),
    getIncidentsBySeverity: vi.fn((severity) => {
      return Promise.resolve([
        {
          id: '1',
          type: 'XSS_ATTEMPT',
          severity,
          component: 'INPUT_SANITIZATION',
          timestamp: new Date(),
          ip: '127.0.0.1',
          userAgent: 'test-agent',
          details: { message: 'Test incident' }
        }
      ]);
    }),
    getIncidentsByComponent: vi.fn((component) => {
      return Promise.resolve([
        {
          id: '1',
          type: 'XSS_ATTEMPT',
          severity: 'high',
          component,
          timestamp: new Date(),
          ip: '127.0.0.1',
          userAgent: 'test-agent',
          details: { message: 'Test incident' }
        }
      ]);
    }),
    getIncidentsByIP: vi.fn((ip) => {
      return Promise.resolve([
        {
          id: '1',
          type: 'XSS_ATTEMPT',
          severity: 'high',
          component: 'INPUT_SANITIZATION',
          timestamp: new Date(),
          ip,
          userAgent: 'test-agent',
          details: { message: 'Test incident' }
        }
      ]);
    }),
    getIncidentsWithPagination: vi.fn((page, limit) => {
      return Promise.resolve({
        incidents: [
          {
            id: '1',
            type: 'XSS_ATTEMPT',
            severity: 'high',
            component: 'INPUT_SANITIZATION',
            timestamp: new Date(),
            ip: '127.0.0.1',
            userAgent: 'test-agent',
            details: { message: 'Test incident' }
          }
        ],
        total: 1,
        page,
        limit,
        totalPages: 1
      });
    }),
    getIncidentsInTimeRange: vi.fn((startDate, endDate) => {
      return Promise.resolve([
        {
          id: '1',
          type: 'XSS_ATTEMPT',
          severity: 'high',
          component: 'INPUT_SANITIZATION',
          timestamp: new Date(),
          ip: '127.0.0.1',
          userAgent: 'test-agent',
          details: { message: 'Test incident' }
        }
      ]);
    }),
    getIncidentsSortedByTimestamp: vi.fn((order = 'desc') => {
      return Promise.resolve([
        {
          id: '1',
          type: 'XSS_ATTEMPT',
          severity: 'high',
          component: 'INPUT_SANITIZATION',
          timestamp: new Date(),
          ip: '127.0.0.1',
          userAgent: 'test-agent',
          details: { message: 'Test incident' }
        }
      ]);
    }),
    getMetrics: vi.fn(() => {
      return Promise.resolve({
        totalIncidents: 10,
        incidentsByType: { XSS_ATTEMPT: 5, SQL_INJECTION: 3, BRUTE_FORCE: 2 },
        incidentsBySeverity: { high: 6, medium: 3, low: 1 },
        incidentsByComponent: { INPUT_SANITIZATION: 8, AUTHENTICATION: 2 },
        topAttackerIPs: [{ ip: '127.0.0.1', count: 5 }],
        topTargetRoutes: [{ route: '/api/login', count: 3 }],
        timelineData: [{ date: '2024-01-01', count: 5 }],
        blockingEffectiveness: 0.85
      });
    }),
    getBlockingEffectiveness: vi.fn(() => {
      return Promise.resolve(0.85);
    }),
    getTopAttackerIPs: vi.fn((limit = 10) => {
      return Promise.resolve([{ ip: '127.0.0.1', count: 5 }]);
    }),
    getTopTargetRoutes: vi.fn((limit = 10) => {
      return Promise.resolve([{ route: '/api/login', count: 3 }]);
    }),
    getTimelineData: vi.fn((days = 30) => {
      return Promise.resolve([{ date: '2024-01-01', count: 5 }]);
    }),
    getMetricsInTimeRange: vi.fn((startDate, endDate) => {
      return Promise.resolve({
        totalIncidents: 5,
        incidentsByType: { XSS_ATTEMPT: 3, SQL_INJECTION: 2 },
        incidentsBySeverity: { high: 3, medium: 2 },
        incidentsByComponent: { INPUT_SANITIZATION: 4, AUTHENTICATION: 1 },
        topAttackerIPs: [{ ip: '127.0.0.1', count: 3 }],
        topTargetRoutes: [{ route: '/api/login', count: 2 }],
        timelineData: [{ date: '2024-01-01', count: 3 }],
        blockingEffectiveness: 0.8
      });
    }),
    isIPSuspicious: vi.fn((ip) => {
      return ip === '192.168.1.100';
    }),
    generateSecurityReport: vi.fn(() => {
      return Promise.resolve({
        summary: {
          totalIncidents: 10,
          criticalThreats: 2,
          blockedAttacks: 8,
          effectiveness: 0.8
        },
        threats: [
          {
            type: 'XSS_ATTEMPT',
            severity: 'high',
            count: 5,
            description: 'Cross-site scripting attempts detected'
          }
        ],
        recommendations: [
          'Implement stricter input validation',
          'Add rate limiting to authentication endpoints'
        ],
        generatedAt: new Date().toISOString()
      });
    }),
    identifyCriticalThreats: vi.fn(() => {
      return Promise.resolve([
        {
          type: 'SQL_INJECTION',
          severity: 'critical',
          count: 2,
          description: 'SQL injection attempts detected'
        }
      ]);
    }),
    generateSecurityRecommendations: vi.fn(() => {
      return Promise.resolve([
        'Implement stricter input validation',
        'Add rate limiting to authentication endpoints',
        'Enable additional security headers'
      ]);
    }),
    triggerAlert: vi.fn((threshold, currentValue) => {
      return currentValue > threshold;
    }),
    cleanupOldIncidents: vi.fn((daysOld) => {
      return Promise.resolve({ deleted: 5, remaining: 10 });
    }),
    shutdown: vi.fn(() => {
      return Promise.resolve();
    })
  };

  return {
    SecurityAuditService: vi.fn().mockImplementation(() => mockSecurityAuditService),
    SecurityIncidentType: {
      XSS_ATTEMPT: 'XSS_ATTEMPT',
      SQL_INJECTION: 'SQL_INJECTION',
      BRUTE_FORCE: 'BRUTE_FORCE',
      RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
      SUSPICIOUS_REQUEST: 'SUSPICIOUS_REQUEST',
      CONFIGURATION_ERROR: 'CONFIGURATION_ERROR'
    },
    SecuritySeverity: {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    },
    SecurityComponent: {
      INPUT_SANITIZATION: 'INPUT_SANITIZATION',
      AUTHENTICATION: 'AUTHENTICATION',
      MONITORING: 'MONITORING',
      RATE_LIMITING: 'RATE_LIMITING'
    }
  };
}); */

import { logger } from '../../utils/logger';
import { 
  SecurityAuditService, 
  SecurityIncidentType, 
  SecuritySeverity, 
  SecurityComponent
} from '../../services/security-audit.service';
import { FastifyRequest } from 'fastify';

describe('SecurityAuditService', () => {
  let securityAuditService: SecurityAuditService;
  let mockRequest: Partial<FastifyRequest>;

  beforeEach(() => {
    securityAuditService = new SecurityAuditService();
    // Clear incidents for fresh test state
    if (securityAuditService.clearIncidents) {
      securityAuditService.clearIncidents();
    }

    mockRequest = {
      method: 'POST',
      url: '/api/test',
      routeOptions: { url: '/api/test' },
      ip: '192.168.1.100',
      headers: {
        'user-agent': 'Mozilla/5.0 (Test Browser)',
        'accept': 'application/json',
        'referer': 'https://example.com'
      }
    };
  });

  afterEach(() => {
    securityAuditService.shutdown();
  });

  describe('Incident Logging', () => {
    it('should log security incident successfully', async () => {
      const incidentId = await securityAuditService.logIncident(
        SecurityIncidentType.XSS_ATTEMPT,
        SecuritySeverity.HIGH,
        SecurityComponent.INPUT_SANITIZATION,
        mockRequest as FastifyRequest,
        {
          description: 'XSS attempt detected in user input',
          payload: { maliciousScript: '<script>alert("xss")</script>' },
          blocked: true
        }
      );

      expect(incidentId).toBeDefined();
      expect(incidentId).toMatch(/^SEC-\d+-[a-z0-9]+$/);

      const incident = securityAuditService.getIncident(incidentId);
      expect(incident).not.toBeNull();
      expect(incident!.type).toBe(SecurityIncidentType.XSS_ATTEMPT);
      expect(incident!.severity).toBe(SecuritySeverity.HIGH);
      expect(incident!.metadata.component).toBe(SecurityComponent.INPUT_SANITIZATION);
      expect(incident!.source.ip).toBe('192.168.1.100');
      expect(incident!.details.blocked).toBe(true);
    });

    it('should generate security recommendations', async () => {
      const timeRange = {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date()
      };

      const report = securityAuditService.generateReport(timeRange);

      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.recommendations).toContain('Consider strengthening input sanitization and XSS protection');
    });

    it('should log manual incident', async () => {
      const incidentId = await securityAuditService.logManualIncident(
        SecurityIncidentType.CONFIGURATION_ERROR,
        SecuritySeverity.MEDIUM,
        SecurityComponent.MONITORING,
        'Manual security audit found configuration issue',
        {
          userId: 'admin123',
          route: '/admin/config',
          details: 'Weak password policy detected'
        }
      );

      expect(incidentId).toBeDefined();

      const incident = securityAuditService.getIncident(incidentId);
      expect(incident).not.toBeNull();
      expect(incident!.metadata.automated).toBe(false);
      expect(incident!.source.ip).toBe('manual');
      expect(incident!.source.userId).toBe('admin123');
    });

    it('should sanitize sensitive headers', async () => {
      mockRequest.headers = {
        'user-agent': 'test-agent',
        'authorization': 'Bearer secret-token',
        'cookie': 'session=secret-session',
        'x-api-key': 'secret-key',
        'accept': 'application/json'
      };

      const incidentId = await securityAuditService.logIncident(
        SecurityIncidentType.SUSPICIOUS_REQUEST,
        SecuritySeverity.LOW,
        SecurityComponent.MONITORING,
        mockRequest as FastifyRequest,
        {
          description: 'Test incident'
        }
      );

      const incident = securityAuditService.getIncident(incidentId);
      expect(incident!.details.headers).toHaveProperty('user-agent');
      expect(incident!.details.headers).toHaveProperty('accept');
      expect(incident!.details.headers).not.toHaveProperty('authorization');
      expect(incident!.details.headers).not.toHaveProperty('cookie');
      expect(incident!.details.headers).not.toHaveProperty('x-api-key');
    });
  });

  describe('Incident Retrieval', () => {
    let incidentIds: string[];

    beforeEach(async () => {
      incidentIds = [];
      
      // Create test incidents
      incidentIds.push(await securityAuditService.logIncident(
        SecurityIncidentType.XSS_ATTEMPT,
        SecuritySeverity.HIGH,
        SecurityComponent.INPUT_SANITIZATION,
        mockRequest as FastifyRequest,
        { description: 'XSS attempt 1' }
      ));

      incidentIds.push(await securityAuditService.logIncident(
        SecurityIncidentType.SQL_INJECTION,
        SecuritySeverity.CRITICAL,
        SecurityComponent.INPUT_SANITIZATION,
        mockRequest as FastifyRequest,
        { description: 'SQL injection attempt' }
      ));

      incidentIds.push(await securityAuditService.logIncident(
        SecurityIncidentType.RATE_LIMIT_EXCEEDED,
        SecuritySeverity.MEDIUM,
        SecurityComponent.RATE_LIMITING,
        mockRequest as FastifyRequest,
        { description: 'Rate limit exceeded' }
      ));
    });

    it('should retrieve incident by ID', () => {
      const incident = securityAuditService.getIncident(incidentIds[0]);
      expect(incident).not.toBeNull();
      expect(incident!.type).toBe(SecurityIncidentType.XSS_ATTEMPT);
    });

    it('should return null for non-existent incident', () => {
      const incident = securityAuditService.getIncident('non-existent-id');
      expect(incident).toBeNull();
    });

    it('should retrieve incidents by type', () => {
      const incidents = securityAuditService.getIncidents({
        type: SecurityIncidentType.XSS_ATTEMPT
      });

      expect(incidents).toHaveLength(1);
      expect(incidents[0].type).toBe(SecurityIncidentType.XSS_ATTEMPT);
    });

    it('should retrieve incidents by severity', () => {
      const incidents = securityAuditService.getIncidents({
        severity: SecuritySeverity.CRITICAL
      });

      expect(incidents).toHaveLength(1);
      expect(incidents[0].severity).toBe(SecuritySeverity.CRITICAL);
    });

    it('should retrieve incidents by component', () => {
      const incidents = securityAuditService.getIncidents({
        component: SecurityComponent.INPUT_SANITIZATION
      });

      expect(incidents).toHaveLength(2);
      incidents.forEach(incident => {
        expect(incident.metadata.component).toBe(SecurityComponent.INPUT_SANITIZATION);
      });
    });

    it('should retrieve incidents by IP', () => {
      const incidents = securityAuditService.getIncidents({
        ip: '192.168.1.100'
      });

      expect(incidents).toHaveLength(3);
      incidents.forEach(incident => {
        expect(incident.source.ip).toBe('192.168.1.100');
      });
    });

    it('should retrieve incidents with pagination', () => {
      const page1 = securityAuditService.getIncidents({ limit: 2, offset: 0 });
      const page2 = securityAuditService.getIncidents({ limit: 2, offset: 2 });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(1);
      expect(page1[0].id).not.toBe(page2[0].id);
    });

    it('should retrieve incidents within time range', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      const incidents = securityAuditService.getIncidents({
        timeRange: { start: oneHourAgo, end: oneHourFromNow }
      });

      expect(incidents).toHaveLength(3);
    });

    it('should sort incidents by timestamp (newest first)', () => {
      const incidents = securityAuditService.getIncidents();
      
      expect(incidents).toHaveLength(3);
      for (let i = 1; i < incidents.length; i++) {
        expect(incidents[i-1].timestamp.getTime()).toBeGreaterThanOrEqual(
          incidents[i].timestamp.getTime()
        );
      }
    });
  });

  describe('Security Metrics', () => {
    beforeEach(async () => {
      // Create diverse test incidents
      await securityAuditService.logIncident(
        SecurityIncidentType.XSS_ATTEMPT,
        SecuritySeverity.HIGH,
        SecurityComponent.INPUT_SANITIZATION,
        mockRequest as FastifyRequest,
        { description: 'XSS 1', blocked: true }
      );

      await securityAuditService.logIncident(
        SecurityIncidentType.XSS_ATTEMPT,
        SecuritySeverity.MEDIUM,
        SecurityComponent.INPUT_SANITIZATION,
        mockRequest as FastifyRequest,
        { description: 'XSS 2', blocked: false }
      );

      await securityAuditService.logIncident(
        SecurityIncidentType.SQL_INJECTION,
        SecuritySeverity.CRITICAL,
        SecurityComponent.INPUT_SANITIZATION,
        { ...mockRequest, ip: '192.168.1.200' } as FastifyRequest,
        { description: 'SQL injection', blocked: true }
      );
    });

    it('should generate comprehensive metrics', () => {
      const metrics = securityAuditService.getMetrics();

      expect(metrics.totalIncidents).toBe(3);
      expect(metrics.incidentsByType[SecurityIncidentType.XSS_ATTEMPT]).toBe(2);
      expect(metrics.incidentsByType[SecurityIncidentType.SQL_INJECTION]).toBe(1);
      expect(metrics.incidentsBySeverity[SecuritySeverity.HIGH]).toBe(1);
      expect(metrics.incidentsBySeverity[SecuritySeverity.MEDIUM]).toBe(1);
      expect(metrics.incidentsBySeverity[SecuritySeverity.CRITICAL]).toBe(1);
      expect(metrics.incidentsByComponent[SecurityComponent.INPUT_SANITIZATION]).toBe(3);
    });

    it('should calculate blocking effectiveness', () => {
      const metrics = securityAuditService.getMetrics();

      expect(metrics.blockingEffectiveness.totalRequests).toBe(3);
      expect(metrics.blockingEffectiveness.blockedRequests).toBe(2);
      expect(metrics.blockingEffectiveness.blockingRate).toBeCloseTo(66.67, 1);
    });

    it('should identify top attacker IPs', () => {
      const metrics = securityAuditService.getMetrics();

      expect(metrics.topAttackerIPs).toHaveLength(2);
      expect(metrics.topAttackerIPs[0].ip).toBe('192.168.1.100');
      expect(metrics.topAttackerIPs[0].count).toBe(2);
      expect(metrics.topAttackerIPs[1].ip).toBe('192.168.1.200');
      expect(metrics.topAttackerIPs[1].count).toBe(1);
    });

    it('should identify top target routes', () => {
      const metrics = securityAuditService.getMetrics();

      expect(metrics.topTargetRoutes).toHaveLength(1);
      expect(metrics.topTargetRoutes[0].route).toBe('/api/test');
      expect(metrics.topTargetRoutes[0].count).toBe(3);
    });

    it('should generate timeline data', () => {
      const metrics = securityAuditService.getMetrics();

      expect(Array.isArray(metrics.timelineData)).toBe(true);
      expect(metrics.timelineData).toHaveLength(24); // 24 hours
      
      const currentHourData = metrics.timelineData.find(data => {
        const now = new Date();
        const dataHour = data.timestamp.getHours();
        return dataHour === now.getHours();
      });

      expect(currentHourData).toBeDefined();
      expect(currentHourData!.count).toBe(3);
    });

    it('should filter metrics by time range', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const now = new Date();

      const metrics = securityAuditService.getMetrics({
        start: oneHourAgo,
        end: now
      });

      expect(metrics.totalIncidents).toBe(3);
    });
  });

  describe('Suspicious IP Detection', () => {
    it('should detect suspicious IP based on incident count', async () => {
      const suspiciousIP = '192.168.1.666';
      mockRequest.ip = suspiciousIP;

      // Generate many incidents from the same IP
      for (let i = 0; i < 15; i++) {
        await securityAuditService.logIncident(
          SecurityIncidentType.XSS_ATTEMPT,
          SecuritySeverity.HIGH,
          SecurityComponent.INPUT_SANITIZATION,
          mockRequest as FastifyRequest,
          { description: `XSS attempt ${i}` }
        );
      }

      const isSuspicious = securityAuditService.isIPSuspicious(suspiciousIP);
      expect(isSuspicious).toBe(true);
    });

    it('should detect suspicious IP based on critical incidents', async () => {
      const suspiciousIP = '192.168.1.777';
      mockRequest.ip = suspiciousIP;

      await securityAuditService.logIncident(
        SecurityIncidentType.BRUTE_FORCE,
        SecuritySeverity.CRITICAL,
        SecurityComponent.AUTHENTICATION,
        mockRequest as FastifyRequest,
        { description: 'Brute force attack detected' }
      );

      const isSuspicious = securityAuditService.isIPSuspicious(suspiciousIP);
      expect(isSuspicious).toBe(true);
    });

    it('should not flag normal IPs as suspicious', () => {
      const normalIP = '192.168.1.1';
      const isSuspicious = securityAuditService.isIPSuspicious(normalIP);
      expect(isSuspicious).toBe(false);
    });

    it('should consider time window for suspicious detection', async () => {
      const testIP = '192.168.1.888';
      mockRequest.ip = testIP;

      // Generate incidents outside the time window
      const shortTimeWindow = 1000; // 1 second

      await securityAuditService.logIncident(
        SecurityIncidentType.XSS_ATTEMPT,
        SecuritySeverity.HIGH,
        SecurityComponent.INPUT_SANITIZATION,
        mockRequest as FastifyRequest,
        { description: 'Old incident' }
      );

      // Wait for time window to pass
      await new Promise(resolve => setTimeout(resolve, 1100));

      const isSuspicious = securityAuditService.isIPSuspicious(testIP, shortTimeWindow);
      expect(isSuspicious).toBe(false);
    });
  });

  describe('Security Reports', () => {
    beforeEach(async () => {
      // Create incidents for report testing
      await securityAuditService.logIncident(
        SecurityIncidentType.SQL_INJECTION,
        SecuritySeverity.CRITICAL,
        SecurityComponent.INPUT_SANITIZATION,
        mockRequest as FastifyRequest,
        { description: 'Critical SQL injection' }
      );

      await securityAuditService.logIncident(
        SecurityIncidentType.XSS_ATTEMPT,
        SecuritySeverity.HIGH,
        SecurityComponent.INPUT_SANITIZATION,
        mockRequest as FastifyRequest,
        { description: 'High severity XSS' }
      );

      // Add many XSS attempts to trigger recommendations
      for (let i = 0; i < 15; i++) {
        await securityAuditService.logIncident(
          SecurityIncidentType.XSS_ATTEMPT,
          SecuritySeverity.MEDIUM,
          SecurityComponent.INPUT_SANITIZATION,
          mockRequest as FastifyRequest,
          { description: `XSS attempt ${i}` }
        );
      }
    });

    it('should generate comprehensive security report', () => {
      const timeRange = {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date()
      };

      const report = securityAuditService.generateReport(timeRange);

      expect(report.summary).toBeDefined();
      expect(report.topThreats).toBeDefined();
      expect(report.recommendations).toBeDefined();

      expect(report.summary.totalIncidents).toBeGreaterThan(0);
      expect(Array.isArray(report.topThreats)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should identify critical threats in report', () => {
      const timeRange = {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date()
      };

      const report = securityAuditService.generateReport(timeRange);

      expect(report.topThreats).toHaveLength(1);
      expect(report.topThreats[0].severity).toBe(SecuritySeverity.CRITICAL);
      expect(report.topThreats[0].type).toBe(SecurityIncidentType.SQL_INJECTION);
    });

    it('should generate security recommendations', () => {
      const timeRange = {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date()
      };

      const report = securityAuditService.generateReport(timeRange);

      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.recommendations).toContain('XSS protection');
    });
  });

  describe('Alert System', () => {
    it('should trigger alerts when thresholds are exceeded', async () => {
      const alertService = new SecurityAuditService({
        logToFile: false,
        enableRealTimeAlerts: true,
        alertThresholds: {
          [SecurityIncidentType.XSS_ATTEMPT]: { count: 2, timeWindow: 60000 }
        }
      });

      const logSpy = vi.spyOn(logger, 'error');

      // Generate incidents to trigger alert
      for (let i = 0; i < 3; i++) {
        await alertService.logIncident(
          SecurityIncidentType.XSS_ATTEMPT,
          SecuritySeverity.HIGH,
          SecurityComponent.INPUT_SANITIZATION,
          mockRequest as FastifyRequest,
          { description: `XSS attempt ${i}` }
        );
      }

      expect(logSpy).toHaveBeenCalledWith(
        'Security alert triggered',
        expect.objectContaining({
          type: SecurityIncidentType.XSS_ATTEMPT,
          incidentCount: 2
        })
      );

      alertService.shutdown();
      logSpy.mockRestore();
    });
  });

  describe('Data Management', () => {
    it('should clean up old incidents', async () => {
      const cleanupService = new SecurityAuditService({
        logToFile: false,
        retentionDays: 0 // Immediate cleanup for testing
      });

      await cleanupService.logManualIncident(
        SecurityIncidentType.XSS_ATTEMPT,
        SecuritySeverity.HIGH,
        SecurityComponent.INPUT_SANITIZATION,
        'Test incident'
      );

      const metricsBefore = cleanupService.getMetrics();
      expect(metricsBefore.totalIncidents).toBe(1);

      await cleanupService.cleanup();

      const metricsAfter = cleanupService.getMetrics();
      expect(metricsAfter.totalIncidents).toBe(0);

      cleanupService.shutdown();
    });

    it('should handle service shutdown gracefully', () => {
      const metrics = securityAuditService.getMetrics();
      expect(metrics.totalIncidents).toBeGreaterThanOrEqual(0);

      securityAuditService.shutdown();

      // After shutdown, metrics should be reset
      const metricsAfterShutdown = securityAuditService.getMetrics();
      expect(metricsAfterShutdown.totalIncidents).toBe(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing request properties gracefully', async () => {
      const minimalRequest = {
        method: 'GET',
        url: '/',
        ip: '127.0.0.1'
      } as FastifyRequest;

      const incidentId = await securityAuditService.logIncident(
        SecurityIncidentType.SUSPICIOUS_REQUEST,
        SecuritySeverity.LOW,
        SecurityComponent.MONITORING,
        minimalRequest,
        { description: 'Minimal request test' }
      );

      expect(incidentId).toBeDefined();

      const incident = securityAuditService.getIncident(incidentId);
      expect(incident).not.toBeNull();
      expect(incident!.source.userAgent).toBeUndefined();
    });

    it('should handle large payload gracefully', async () => {
      const largePayload = {
        data: 'x'.repeat(100000), // Large string
        nested: {
          array: new Array(1000).fill('test'),
          object: {}
        }
      };

      const incidentId = await securityAuditService.logIncident(
        SecurityIncidentType.SUSPICIOUS_REQUEST,
        SecuritySeverity.LOW,
        SecurityComponent.MONITORING,
        mockRequest as FastifyRequest,
        {
          description: 'Large payload test',
          payload: largePayload
        }
      );

      expect(incidentId).toBeDefined();

      const incident = securityAuditService.getIncident(incidentId);
      expect(incident).not.toBeNull();
      expect(incident!.details.payload).toBeDefined();
    });

    it('should handle concurrent incident logging', async () => {
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(
          securityAuditService.logIncident(
            SecurityIncidentType.RATE_LIMIT_EXCEEDED,
            SecuritySeverity.MEDIUM,
            SecurityComponent.RATE_LIMITING,
            { ...mockRequest, ip: `192.168.1.${i}` } as FastifyRequest,
            { description: `Concurrent incident ${i}` }
          )
        );
      }

      const incidentIds = await Promise.all(promises);

      expect(incidentIds).toHaveLength(10);
      expect(new Set(incidentIds).size).toBe(10); // All IDs should be unique

      const metrics = securityAuditService.getMetrics();
      expect(metrics.totalIncidents).toBeGreaterThanOrEqual(10);
    });
  });
});