/**
 * Standalone Unit Tests for EmailService
 * Tests EmailService methods without complex setup dependencies
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock nodemailer
const mockTransporter = {
  sendMail: vi.fn(),
  verify: vi.fn()
};

vi.mock('nodemailer', () => ({
  createTransport: vi.fn(() => mockTransporter)
}));

// Mock all config dependencies
vi.mock('../config/config', () => ({
  config: { NODE_ENV: 'test' },
  emailConfig: {
    host: 'smtp.test.com',
    port: 587,
    user: 'test@test.com',
    pass: 'testpass',
    from: 'noreply@test.com',
    supportEmail: 'support@test.com'
  },
  gdprConfig: { dataRetentionDays: 30 },
  dbConfig: { host: 'localhost', port: 3306, user: 'test', password: 'test', database: 'test' },
  cookieConfig: { secret: 'test-cookie-secret', secure: false, httpOnly: true, sameSite: 'lax' },
  jwtConfig: { secret: 'test-jwt-secret', expiresIn: '1h', refreshSecret: 'test-refresh-secret', refreshExpiresIn: '7d' },
  isProduction: false
}));

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

// Mock AuditTrailService
vi.mock('../services/audit-trail.service', () => ({
  AuditTrailService: vi.fn().mockImplementation(() => ({
    logAction: vi.fn().mockResolvedValue(undefined)
  }))
}));

// Import after mocks
import { EmailService } from '../services/email.service';
import { logger } from '../utils/logger';

describe('EmailService Standalone Tests', () => {
  let emailService: EmailService;

  beforeEach(() => {
    emailService = new EmailService();
    vi.clearAllMocks();
  });

  describe('Template Rendering', () => {
    test('should render user registration welcome template', () => {
      const template = 'user-registration-welcome';
      const variables = {
        userName: 'John Doe',
        username: 'johndoe',
        email: 'test@example.com',
        createdAt: '2024-01-01',
        loginUrl: 'https://test.com/login'
      };

      // Access private method through any type
      const result = (emailService as any).renderTemplate(template, variables);

      expect(result).toContain('Bienvenue sur RevEd Kids !');
      expect(result).toContain('John Doe');
      expect(result).toContain('johndoe');
      expect(result).toContain('test@example.com');
      expect(result).toContain('2024-01-01');
      expect(result).toContain('https://test.com/login');
    });

    test('should render password reset template', () => {
      const template = 'password-reset';
      const variables = {
        userName: 'John Doe',
        resetUrl: 'https://test.com/reset',
        expiryDate: '2024-01-02'
      };

      const result = (emailService as any).renderTemplate(template, variables);

      expect(result).toContain('Réinitialisation de votre mot de passe');
      expect(result).toContain('John Doe');
      expect(result).toContain('https://test.com/reset');
      expect(result).toContain('2024-01-02');
    });

    test('should render GDPR consent template', () => {
      const template = 'gdpr-consent-request';
      const variables = {
        userName: 'John Doe',
        consentUrl: 'https://test.com/consent',
        expiryDate: '2024-01-02'
      };

      const result = (emailService as any).renderTemplate(template, variables);

      expect(result).toContain('Consentement RGPD requis');
      expect(result).toContain('John Doe');
      expect(result).toContain('https://test.com/consent');
    });

    test('should render lesson completion template', () => {
      const template = 'lesson-completion';
      const variables = {
        userName: 'John Doe',
        lessonName: 'Math Lesson 1',
        score: 95,
        nextLessonUrl: 'https://test.com/next'
      };

      const result = (emailService as any).renderTemplate(template, variables);

      expect(result).toContain('Félicitations ! Leçon terminée');
      expect(result).toContain('John Doe');
      expect(result).toContain('Math Lesson 1');
      expect(result).toContain('95');
      expect(result).toContain('https://test.com/next');
    });

    test('should render progress report template', () => {
      const template = 'progress-report';
      const variables = {
        userName: 'John Doe',
        period: 'January 2024',
        totalLessons: 10,
        completedLessons: 8,
        averageScore: 85,
        reportUrl: 'https://test.com/report'
      };

      const result = (emailService as any).renderTemplate(template, variables);

      expect(result).toContain('Rapport de progression');
      expect(result).toContain('John Doe');
      expect(result).toContain('January 2024');
      expect(result).toContain('10');
      expect(result).toContain('8');
      expect(result).toContain('85');
      expect(result).toContain('https://test.com/report');
    });

    test('should render security alert template', () => {
      const template = 'account-security-alert';
      const variables = {
        userName: 'John Doe',
        alertType: 'login',
        timestamp: '2024-01-01 10:00:00',
        ipAddress: '192.168.1.1',
        actionUrl: 'https://test.com/security'
      };

      const result = (emailService as any).renderTemplate(template, variables);

      expect(result).toContain('Alerte de sécurité');
      expect(result).toContain('John Doe');
      expect(result).toContain('login');
      expect(result).toContain('2024-01-01 10:00:00');
      expect(result).toContain('192.168.1.1');
      expect(result).toContain('https://test.com/security');
    });

    test('should render system maintenance template', () => {
      const template = 'system-maintenance';
      const variables = {
        userName: 'John Doe',
        maintenanceDate: '2024-01-02',
        startTime: '02:00',
        endTime: '04:00',
        affectedServices: 'Login, Lessons'
      };

      const result = (emailService as any).renderTemplate(template, variables);

      expect(result).toContain('Maintenance programmée');
      expect(result).toContain('John Doe');
      expect(result).toContain('2024-01-02');
      expect(result).toContain('02:00');
      expect(result).toContain('04:00');
      expect(result).toContain('Login, Lessons');
    });

    test('should handle unknown template gracefully', () => {
      const template = 'unknown-template';
      const variables = {};

      const result = (emailService as any).renderTemplate(template, variables);

      expect(result).toBe('');
    });

    test('should handle missing variables gracefully', () => {
      const template = 'user-registration-welcome';
      const variables = {}; // Missing required variables

      const result = (emailService as any).renderTemplate(template, variables);

      expect(result).toContain('Bienvenue sur RevEd Kids !');
      expect(result).toContain('undefined'); // Should show undefined for missing variables
    });
  });

  describe('Email Statistics', () => {
    test('should return email statistics', () => {
      const stats = emailService.getEmailStats();

      expect(stats).toEqual({
        totalSent: 0,
        totalFailed: 0,
        lastSent: null,
        isConnected: true
      });
    });
  });

  describe('Connection Verification', () => {
    test('should verify connection successfully', async () => {
      mockTransporter.verify.mockResolvedValue(true);

      await emailService.verifyConnection();

      expect(mockTransporter.verify).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Email service connection verified');
    });

    test('should handle connection verification failure', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));

      await emailService.verifyConnection();

      expect(mockTransporter.verify).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('Email service connection failed:', expect.any(Error));
    });
  });

  describe('Template Validation', () => {
    test('should validate all email templates exist', () => {
      const templates = [
        'user-registration-welcome',
        'user-registration-verification',
        'password-reset',
        'gdpr-consent-request',
        'gdpr-data-export',
        'gdpr-data-deletion',
        'lesson-completion',
        'progress-report',
        'account-security-alert',
        'system-maintenance'
      ];

      templates.forEach(template => {
        const result = (emailService as any).renderTemplate(template, {});
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      });
    });

    test('should handle template with special characters', () => {
      const template = 'user-registration-welcome';
      const variables = {
        userName: 'José María',
        username: 'jose.maria',
        email: 'josé@example.com',
        createdAt: '2024-01-01',
        loginUrl: 'https://test.com/login?param=value&other=test'
      };

      const result = (emailService as any).renderTemplate(template, variables);

      expect(result).toContain('José María');
      expect(result).toContain('josé@example.com');
      expect(result).toContain('https://test.com/login?param=value&other=test');
    });

    test('should handle template with HTML content', () => {
      const template = 'lesson-completion';
      const variables = {
        userName: 'John Doe',
        lessonName: 'Math & Science Lesson',
        score: 95,
        nextLessonUrl: 'https://test.com/next'
      };

      const result = (emailService as any).renderTemplate(template, variables);

      expect(result).toContain('<div');
      expect(result).toContain('<h2');
      expect(result).toContain('<p');
      expect(result).toContain('Math &amp; Science Lesson'); // Should escape HTML
    });
  });

  describe('Error Handling', () => {
    test('should handle template rendering with null variables', () => {
      const template = 'user-registration-welcome';
      const variables = {
        userName: null,
        username: undefined,
        email: 'test@example.com',
        createdAt: '2024-01-01',
        loginUrl: 'https://test.com/login'
      };

      const result = (emailService as any).renderTemplate(template, variables);

      expect(result).toContain('Bienvenue sur RevEd Kids !');
      expect(result).toContain('test@example.com');
    });

    test('should handle template rendering with empty string variables', () => {
      const template = 'password-reset';
      const variables = {
        userName: '',
        resetUrl: 'https://test.com/reset',
        expiryDate: ''
      };

      const result = (emailService as any).renderTemplate(template, variables);

      expect(result).toContain('Réinitialisation de votre mot de passe');
      expect(result).toContain('https://test.com/reset');
    });
  });
});









