/**
 * Comprehensive Unit Tests for EmailService
 * Tests all EmailService methods with proper mocking
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { EmailService, EmailOptions } from '../services/email.service';
import { AuditTrailService } from '../services/audit-trail.service';

// Mock nodemailer
const mockTransporter = {
  sendMail: vi.fn(),
  verify: vi.fn()
};

vi.mock('nodemailer', () => ({
  createTransporter: vi.fn(() => mockTransporter),
  createTransport: vi.fn(() => mockTransporter)
}));

// Mock config
vi.mock('../config/config', () => ({
  config: {
    NODE_ENV: 'test'
  },
  emailConfig: {
    host: 'smtp.test.com',
    port: 587,
    user: 'test@test.com',
    pass: 'testpass',
    from: 'noreply@test.com',
    supportEmail: 'support@test.com'
  },
  gdprConfig: {
    dataRetentionDays: 30
  },
  dbConfig: {
    host: 'localhost',
    port: 3306,
    user: 'test',
    password: 'test',
    database: 'test'
  },
  cookieConfig: {
    secret: 'test-cookie-secret',
    secure: false,
    httpOnly: true,
    sameSite: 'lax'
  },
  jwtConfig: {
    secret: 'test-jwt-secret',
    expiresIn: '1h',
    refreshSecret: 'test-refresh-secret',
    refreshExpiresIn: '7d'
  },
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

import * as nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

describe('EmailService Comprehensive Tests', () => {
  let emailService: EmailService;
  let mockAuditService: any;

  beforeEach(() => {
    emailService = new EmailService();
    mockAuditService = new AuditTrailService();
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should initialize with test transporter in test environment', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        streamTransport: true,
        newline: 'unix',
        buffer: true
      });
    });

    test('should initialize audit service', () => {
      expect(AuditTrailService).toHaveBeenCalled();
    });
  });

  describe('sendEmail', () => {
    test('should send email successfully in test mode', async () => {
      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        template: 'user-registration-welcome',
        variables: {
          userName: 'John Doe',
          username: 'johndoe',
          email: 'test@example.com',
          createdAt: '2024-01-01',
          loginUrl: 'https://test.com/login'
        }
      };

      await emailService.sendEmail(emailOptions);

      expect(logger.info).toHaveBeenCalledWith('📧 Email would be sent:', {
        to: 'test@example.com',
        subject: 'Test Subject',
        template: 'user-registration-welcome'
      });

      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        entityType: 'user_session',
        entityId: 'test@example.com',
        action: 'create',
        userId: null,
        details: {
          emailType: 'gdpr_notification',
          template: 'user-registration-welcome',
          to: 'test@example.com',
          subject: 'Test Subject',
          messageId: 'test-message-id',
          accepted: ['test@example.com'],
          rejected: []
        },
        severity: 'low',
        category: 'compliance'
      });
    });

    test('should handle email sending errors', async () => {
      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        template: 'invalid-template',
        variables: {}
      };

      // Mock logger.error to throw
      vi.mocked(logger.error).mockImplementation(() => {
        throw new Error('Template error');
      });

      await expect(emailService.sendEmail(emailOptions)).rejects.toThrow('Failed to send email');
    });

    test('should send email with attachments', async () => {
      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Test with Attachments',
        template: 'user-registration-welcome',
        variables: {
          userName: 'John Doe',
          username: 'johndoe',
          email: 'test@example.com',
          createdAt: '2024-01-01',
          loginUrl: 'https://test.com/login'
        },
        attachments: [
          {
            filename: 'test.pdf',
            content: Buffer.from('test content')
          }
        ]
      };

      await emailService.sendEmail(emailOptions);

      expect(logger.info).toHaveBeenCalledWith('📧 Email would be sent:', {
        to: 'test@example.com',
        subject: 'Test with Attachments',
        template: 'user-registration-welcome'
      });
    });
  });

  describe('renderTemplate', () => {
    test('should render user registration welcome template', async () => {
      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Welcome',
        template: 'user-registration-welcome',
        variables: {
          userName: 'John Doe',
          username: 'johndoe',
          email: 'test@example.com',
          createdAt: '2024-01-01',
          loginUrl: 'https://test.com/login'
        }
      };

      await emailService.sendEmail(emailOptions);

      // The template should be rendered and logged
      expect(logger.info).toHaveBeenCalled();
    });

    test('should render user registration verification template', async () => {
      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Verify Email',
        template: 'user-registration-verification',
        variables: {
          userName: 'John Doe',
          verificationUrl: 'https://test.com/verify',
          expiryDate: '2024-01-02'
        }
      };

      await emailService.sendEmail(emailOptions);

      expect(logger.info).toHaveBeenCalled();
    });

    test('should render password reset template', async () => {
      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Password Reset',
        template: 'password-reset',
        variables: {
          userName: 'John Doe',
          resetUrl: 'https://test.com/reset',
          expiryDate: '2024-01-02'
        }
      };

      await emailService.sendEmail(emailOptions);

      expect(logger.info).toHaveBeenCalled();
    });

    test('should render GDPR consent template', async () => {
      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'GDPR Consent',
        template: 'gdpr-consent-request',
        variables: {
          userName: 'John Doe',
          consentUrl: 'https://test.com/consent',
          expiryDate: '2024-01-02'
        }
      };

      await emailService.sendEmail(emailOptions);

      expect(logger.info).toHaveBeenCalled();
    });

    test('should render GDPR data export template', async () => {
      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Data Export',
        template: 'gdpr-data-export',
        variables: {
          userName: 'John Doe',
          downloadUrl: 'https://test.com/download',
          expiryDate: '2024-01-02'
        }
      };

      await emailService.sendEmail(emailOptions);

      expect(logger.info).toHaveBeenCalled();
    });

    test('should render GDPR data deletion template', async () => {
      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Data Deletion',
        template: 'gdpr-data-deletion',
        variables: {
          userName: 'John Doe',
          deletionDate: '2024-01-02'
        }
      };

      await emailService.sendEmail(emailOptions);

      expect(logger.info).toHaveBeenCalled();
    });

    test('should render lesson completion template', async () => {
      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Lesson Completed',
        template: 'lesson-completion',
        variables: {
          userName: 'John Doe',
          lessonName: 'Math Lesson 1',
          score: 95,
          nextLessonUrl: 'https://test.com/next'
        }
      };

      await emailService.sendEmail(emailOptions);

      expect(logger.info).toHaveBeenCalled();
    });

    test('should render progress report template', async () => {
      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Progress Report',
        template: 'progress-report',
        variables: {
          userName: 'John Doe',
          period: 'January 2024',
          totalLessons: 10,
          completedLessons: 8,
          averageScore: 85,
          reportUrl: 'https://test.com/report'
        }
      };

      await emailService.sendEmail(emailOptions);

      expect(logger.info).toHaveBeenCalled();
    });

    test('should render account security alert template', async () => {
      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Security Alert',
        template: 'account-security-alert',
        variables: {
          userName: 'John Doe',
          alertType: 'login',
          timestamp: '2024-01-01 10:00:00',
          ipAddress: '192.168.1.1',
          actionUrl: 'https://test.com/security'
        }
      };

      await emailService.sendEmail(emailOptions);

      expect(logger.info).toHaveBeenCalled();
    });

    test('should render system maintenance template', async () => {
      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'System Maintenance',
        template: 'system-maintenance',
        variables: {
          userName: 'John Doe',
          maintenanceDate: '2024-01-02',
          startTime: '02:00',
          endTime: '04:00',
          affectedServices: 'Login, Lessons'
        }
      };

      await emailService.sendEmail(emailOptions);

      expect(logger.info).toHaveBeenCalled();
    });

    test('should handle unknown template gracefully', async () => {
      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Unknown Template',
        template: 'unknown-template',
        variables: {}
      };

      await emailService.sendEmail(emailOptions);

      expect(logger.info).toHaveBeenCalled();
    });
  });

  describe('sendBulkEmail', () => {
    test('should send bulk emails successfully', async () => {
      const recipients = [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com'
      ];

      const template = 'user-registration-welcome';
      const variables = {
        userName: 'User',
        username: 'user',
        email: 'user@example.com',
        createdAt: '2024-01-01',
        loginUrl: 'https://test.com/login'
      };

      await emailService.sendBulkEmail(recipients, template, variables);

      // Should log for each recipient
      expect(logger.info).toHaveBeenCalledTimes(recipients.length);
    });

    test('should handle bulk email errors gracefully', async () => {
      const recipients = ['invalid-email', 'valid@example.com'];
      const template = 'user-registration-welcome';
      const variables = {};

      await emailService.sendBulkEmail(recipients, template, variables);

      // Should still log for valid emails
      expect(logger.info).toHaveBeenCalled();
    });
  });

  describe('sendWelcomeEmail', () => {
    test('should send welcome email with correct template', async () => {
      const userData = {
        email: 'test@example.com',
        prenom: 'John',
        nom: 'Doe',
        username: 'johndoe'
      };

      await emailService.sendWelcomeEmail(userData);

      expect(logger.info).toHaveBeenCalledWith('📧 Email would be sent:', {
        to: 'test@example.com',
        subject: 'Bienvenue sur RevEd Kids !',
        template: 'user-registration-welcome'
      });
    });
  });

  describe('sendPasswordResetEmail', () => {
    test('should send password reset email', async () => {
      const userData = {
        email: 'test@example.com',
        prenom: 'John',
        nom: 'Doe'
      };
      const resetToken = 'reset-token-123';

      await emailService.sendPasswordResetEmail(userData, resetToken);

      expect(logger.info).toHaveBeenCalledWith('📧 Email would be sent:', {
        to: 'test@example.com',
        subject: 'Réinitialisation de votre mot de passe',
        template: 'password-reset'
      });
    });
  });

  describe('sendGDPRConsentEmail', () => {
    test('should send GDPR consent email', async () => {
      const userData = {
        email: 'test@example.com',
        prenom: 'John',
        nom: 'Doe'
      };
      const consentToken = 'consent-token-123';

      await emailService.sendGDPRConsentEmail(userData, consentToken);

      expect(logger.info).toHaveBeenCalledWith('📧 Email would be sent:', {
        to: 'test@example.com',
        subject: 'Consentement RGPD requis',
        template: 'gdpr-consent-request'
      });
    });
  });

  describe('sendDataExportEmail', () => {
    test('should send data export email', async () => {
      const userData = {
        email: 'test@example.com',
        prenom: 'John',
        nom: 'Doe'
      };
      const downloadUrl = 'https://test.com/download';

      await emailService.sendDataExportEmail(userData, downloadUrl);

      expect(logger.info).toHaveBeenCalledWith('📧 Email would be sent:', {
        to: 'test@example.com',
        subject: 'Export de vos données personnelles',
        template: 'gdpr-data-export'
      });
    });
  });

  describe('sendDataDeletionEmail', () => {
    test('should send data deletion email', async () => {
      const userData = {
        email: 'test@example.com',
        prenom: 'John',
        nom: 'Doe'
      };

      await emailService.sendDataDeletionEmail(userData);

      expect(logger.info).toHaveBeenCalledWith('📧 Email would be sent:', {
        to: 'test@example.com',
        subject: 'Suppression de vos données personnelles',
        template: 'gdpr-data-deletion'
      });
    });
  });

  describe('sendLessonCompletionEmail', () => {
    test('should send lesson completion email', async () => {
      const userData = {
        email: 'test@example.com',
        prenom: 'John',
        nom: 'Doe'
      };
      const lessonData = {
        name: 'Math Lesson 1',
        score: 95,
        nextLessonUrl: 'https://test.com/next'
      };

      await emailService.sendLessonCompletionEmail(userData, lessonData);

      expect(logger.info).toHaveBeenCalledWith('📧 Email would be sent:', {
        to: 'test@example.com',
        subject: 'Félicitations ! Leçon terminée',
        template: 'lesson-completion'
      });
    });
  });

  describe('sendProgressReportEmail', () => {
    test('should send progress report email', async () => {
      const userData = {
        email: 'test@example.com',
        prenom: 'John',
        nom: 'Doe'
      };
      const reportData = {
        period: 'January 2024',
        totalLessons: 10,
        completedLessons: 8,
        averageScore: 85,
        reportUrl: 'https://test.com/report'
      };

      await emailService.sendProgressReportEmail(userData, reportData);

      expect(logger.info).toHaveBeenCalledWith('📧 Email would be sent:', {
        to: 'test@example.com',
        subject: 'Rapport de progression',
        template: 'progress-report'
      });
    });
  });

  describe('sendSecurityAlertEmail', () => {
    test('should send security alert email', async () => {
      const userData = {
        email: 'test@example.com',
        prenom: 'John',
        nom: 'Doe'
      };
      const alertData = {
        type: 'login',
        timestamp: '2024-01-01 10:00:00',
        ipAddress: '192.168.1.1',
        actionUrl: 'https://test.com/security'
      };

      await emailService.sendSecurityAlertEmail(userData, alertData);

      expect(logger.info).toHaveBeenCalledWith('📧 Email would be sent:', {
        to: 'test@example.com',
        subject: 'Alerte de sécurité',
        template: 'account-security-alert'
      });
    });
  });

  describe('sendMaintenanceNotificationEmail', () => {
    test('should send maintenance notification email', async () => {
      const userData = {
        email: 'test@example.com',
        prenom: 'John',
        nom: 'Doe'
      };
      const maintenanceData = {
        date: '2024-01-02',
        startTime: '02:00',
        endTime: '04:00',
        affectedServices: 'Login, Lessons'
      };

      await emailService.sendMaintenanceNotificationEmail(userData, maintenanceData);

      expect(logger.info).toHaveBeenCalledWith('📧 Email would be sent:', {
        to: 'test@example.com',
        subject: 'Maintenance programmée',
        template: 'system-maintenance'
      });
    });
  });

  describe('verifyConnection', () => {
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

  describe('getEmailStats', () => {
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

  describe('Error Handling', () => {
    test('should handle template rendering errors', async () => {
      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Test',
        template: 'user-registration-welcome',
        variables: {
          // Missing required variables
        }
      };

      await emailService.sendEmail(emailOptions);

      // Should still log the attempt
      expect(logger.info).toHaveBeenCalled();
    });

    test('should handle audit service errors gracefully', async () => {
      mockAuditService.logAction.mockRejectedValue(new Error('Audit error'));

      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Test',
        template: 'user-registration-welcome',
        variables: {
          userName: 'John Doe',
          username: 'johndoe',
          email: 'test@example.com',
          createdAt: '2024-01-01',
          loginUrl: 'https://test.com/login'
        }
      };

      await emailService.sendEmail(emailOptions);

      // Should still log the email attempt
      expect(logger.info).toHaveBeenCalled();
    });
  });
});
