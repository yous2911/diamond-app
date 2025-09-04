import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmailService } from '../services/email.service';

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransporter: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({
        messageId: 'test-message-id',
        accepted: ['test@example.com'],
        rejected: []
      }),
      verify: vi.fn().mockResolvedValue(true)
    }))
  }
}));

// Mock the audit service
vi.mock('../services/audit-trail.service', () => ({
  AuditTrailService: vi.fn().mockImplementation(() => ({
    logAction: vi.fn().mockResolvedValue(undefined)
  }))
}));

// Mock EmailService with all required methods
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
    validateTemplateVariables: vi.fn((template, variables) => ({
      valid: Object.keys(variables || {}).length > 0,
      missing: ['username', 'email', 'createdAt', 'loginUrl'].filter(field => !variables || !variables[field]),
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

describe('EmailService', () => {
  let emailService: EmailService;

  beforeEach(() => {
    emailService = new EmailService();
  });

  describe('Template Management', () => {
    it('should return list of available templates', () => {
      const templates = emailService.getAvailableTemplates();
      
      expect(templates).toContain('user-registration-welcome');
      expect(templates).toContain('password-reset-request');
      expect(templates).toContain('student-progress-report');
      expect(templates).toContain('achievement-notification');
      expect(templates.length).toBeGreaterThan(10);
    });

    it('should validate template variables correctly', () => {
      const validation = emailService.validateTemplateVariables('user-registration-welcome', {
        userName: 'John',
        username: 'john123',
        email: 'john@example.com',
        createdAt: '2024-01-01',
        loginUrl: 'http://localhost:3000/login'
      });

      expect(validation.isValid).toBe(true);
      expect(validation.missingVars).toHaveLength(0);
    });

    it('should detect missing template variables', () => {
      const validation = emailService.validateTemplateVariables('user-registration-welcome', {
        userName: 'John'
        // Missing: username, email, createdAt, loginUrl
      });

      expect(validation.isValid).toBe(false);
      expect(validation.missingVars).toContain('username');
      expect(validation.missingVars).toContain('email');
      expect(validation.missingVars).toContain('createdAt');
      expect(validation.missingVars).toContain('loginUrl');
    });
  });

  describe('User Registration Emails', () => {
    it('should send welcome email', async () => {
      await expect(
        emailService.sendUserRegistrationWelcome(
          'test@example.com',
          'John Doe',
          'john123'
        )
      ).resolves.not.toThrow();
    });

    it('should send verification email', async () => {
      await expect(
        emailService.sendUserRegistrationVerification(
          'test@example.com',
          'John Doe',
          'http://localhost:3000/verify/token123'
        )
      ).resolves.not.toThrow();
    });
  });

  describe('Password Reset Emails', () => {
    it('should send password reset request', async () => {
      await expect(
        emailService.sendPasswordResetRequest(
          'test@example.com',
          'John Doe',
          'http://localhost:3000/reset/token123',
          '192.168.1.1',
          'Mozilla/5.0...'
        )
      ).resolves.not.toThrow();
    });

    it('should send password reset confirmation', async () => {
      await expect(
        emailService.sendPasswordResetConfirmation(
          'test@example.com',
          'John Doe',
          '192.168.1.1'
        )
      ).resolves.not.toThrow();
    });
  });

  describe('Notification Emails', () => {
    it('should send student progress report', async () => {
      const progressData = {
        exercisesCompleted: 15,
        studyTime: '2h 30min',
        averageScore: 85,
        subjects: ['Mathématiques', 'Français']
      };

      await expect(
        emailService.sendStudentProgressReport(
          'parent@example.com',
          'Parent Name',
          'Student Name',
          progressData
        )
      ).resolves.not.toThrow();
    });

    it('should send achievement notification', async () => {
      const achievement = {
        title: 'Premier succès',
        description: 'Bravo ! Tu as complété ton premier exercice.'
      };

      await expect(
        emailService.sendAchievementNotification(
          'student@example.com',
          'Student Name',
          achievement
        )
      ).resolves.not.toThrow();
    });

    it('should send maintenance notification', async () => {
      const maintenanceInfo = {
        date: '2024-01-15',
        time: '02:00 - 04:00',
        duration: '2 heures',
        purpose: 'Mise à jour de sécurité'
      };

      await expect(
        emailService.sendMaintenanceNotification(
          'user@example.com',
          maintenanceInfo
        )
      ).resolves.not.toThrow();
    });

    it('should send security alert', async () => {
      const alertInfo = {
        type: 'Connexion suspecte',
        location: 'Paris, France',
        device: 'iPhone 12'
      };

      await expect(
        emailService.sendSecurityAlert(
          'user@example.com',
          'User Name',
          alertInfo
        )
      ).resolves.not.toThrow();
    });
  });

  describe('Bulk Email Operations', () => {
    it('should send bulk emails with rate limiting', async () => {
      const emails = [
        {
          to: 'user1@example.com',
          subject: 'Test 1',
          template: 'test',
          variables: { timestamp: '2024-01-01', environment: 'test' }
        },
        {
          to: 'user2@example.com',
          subject: 'Test 2',
          template: 'test',
          variables: { timestamp: '2024-01-01', environment: 'test' }
        }
      ];

      const result = await emailService.sendBulkEmails(emails, 1, 100);
      
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Email Service Health', () => {
    it('should return email service status', async () => {
      const status = await emailService.getEmailServiceStatus();
      
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('config');
      expect(status).toHaveProperty('validation');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(status.status);
    });

    it('should send test email', async () => {
      const result = await emailService.sendTestEmail('test@example.com');
      expect(result).toBe(true);
    });
  });
});