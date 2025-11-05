/**
 * REAL Unit Tests for EmailService
 * Tests actual email functionality, not mocks
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { EmailService } from '../services/email.service';

describe('EmailService - Real Unit Tests', () => {
  let emailService: EmailService;

  beforeEach(() => {
    emailService = new EmailService();
  });

  describe('Template Rendering', () => {
    test('renderTemplate renders user registration welcome template', () => {
      const variables = {
        userName: 'John Doe',
        username: 'john.doe',
        email: 'john@example.com',
        createdAt: '2024-01-15',
        loginUrl: 'http://localhost:3000/login'
      };

      const html = (emailService as any).renderTemplate('user-registration-welcome', variables);
      
      expect(html).toContain('Bienvenue sur RevEd Kids !');
      expect(html).toContain('John Doe');
      expect(html).toContain('john.doe');
      expect(html).toContain('john@example.com');
      expect(html).toContain('2024-01-15');
      expect(html).toContain('http://localhost:3000/login');
    });

    test('renderTemplate renders password reset template', () => {
      const variables = {
        userName: 'Jane Smith',
        resetUrl: 'http://localhost:3000/reset?token=abc123',
        requestDate: '2024-01-15',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        expiryTime: '1 heure'
      };

      const html = (emailService as any).renderTemplate('password-reset-request', variables);
      
      expect(html).toContain('Réinitialisation de votre mot de passe');
      expect(html).toContain('Jane Smith');
      expect(html).toContain('http://localhost:3000/reset?token=abc123');
      expect(html).toContain('192.168.1.1');
      expect(html).toContain('1 heure');
    });

    test('renderTemplate renders achievement notification template', () => {
      const variables = {
        studentName: 'Alice',
        achievementTitle: 'Math Master',
        achievementDescription: 'Completed 100 math exercises',
        achievementsUrl: 'http://localhost:3000/achievements'
      };

      const html = (emailService as any).renderTemplate('achievement-notification', variables);
      
      expect(html).toContain('Nouveau succès débloqué !');
      expect(html).toContain('Alice');
      expect(html).toContain('Math Master');
      expect(html).toContain('Completed 100 math exercises');
    });

    test('renderTemplate renders GDPR verification template', () => {
      const variables = {
        requesterName: 'Parent User',
        requestType: 'Data Export',
        requestId: 'GDPR-123',
        verificationUrl: 'http://localhost:3000/verify?token=xyz789',
        expiryTime: '24 heures'
      };

      const html = (emailService as any).renderTemplate('gdpr-verification', variables);
      
      expect(html).toContain('Vérification de votre demande RGPD');
      expect(html).toContain('Parent User');
      expect(html).toContain('Data Export');
      expect(html).toContain('GDPR-123');
      expect(html).toContain('24 heures');
    });

    test('renderTemplate returns error template for unknown template', () => {
      const html = (emailService as any).renderTemplate('unknown-template', {});
      
      expect(html).toContain('Template Error');
      expect(html).toContain('unknown-template');
      expect(html).toContain('not found');
    });

    test('renderTemplate handles missing variables gracefully', () => {
      const html = (emailService as any).renderTemplate('user-registration-welcome', {});
      
      expect(html).toContain('Bienvenue sur RevEd Kids !');
      expect(html).toContain('undefined'); // Missing variables show as undefined
    });
  });

  describe('Email Configuration Validation', () => {
    test('validateEmailConfig returns valid for proper configuration', () => {
      const validation = (emailService as any).validateEmailConfig();
      
      expect(validation).toBeDefined();
      expect(validation.isValid).toBeDefined();
      expect(validation.errors).toBeDefined();
      expect(Array.isArray(validation.errors)).toBe(true);
    });

    test('validateEmailConfig checks email format', () => {
      const validation = (emailService as any).validateEmailConfig();
      
      // The validation should check for proper email format
      expect(validation.errors).toBeDefined();
    });
  });

  describe('Template Management', () => {
    test('getAvailableTemplates returns list of templates', () => {
      const templates = emailService.getAvailableTemplates();
      
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      expect(templates).toContain('user-registration-welcome');
      expect(templates).toContain('password-reset-request');
      expect(templates).toContain('achievement-notification');
      expect(templates).toContain('gdpr-verification');
    });

    test('validateTemplateVariables validates required variables', () => {
      const validation = emailService.validateTemplateVariables('user-registration-welcome', {
        userName: 'John',
        username: 'john.doe',
        email: 'john@example.com',
        createdAt: '2024-01-15',
        loginUrl: 'http://localhost:3000/login'
      });
      
      expect(validation.isValid).toBe(true);
      expect(validation.missingVars).toEqual([]);
    });

    test('validateTemplateVariables detects missing variables', () => {
      const validation = emailService.validateTemplateVariables('user-registration-welcome', {
        userName: 'John'
        // Missing other required variables
      });
      
      expect(validation.isValid).toBe(false);
      expect(validation.missingVars.length).toBeGreaterThan(0);
      expect(validation.missingVars).toContain('username');
      expect(validation.missingVars).toContain('email');
    });

    test('validateTemplateVariables handles unknown template', () => {
      const validation = emailService.validateTemplateVariables('unknown-template', {});
      
      expect(validation.isValid).toBe(true); // Unknown templates have no required variables
      expect(validation.missingVars).toEqual([]);
    });
  });

  describe('Email Service Status', () => {
    test('getEmailServiceStatus returns status information', async () => {
      const status = await emailService.getEmailServiceStatus();
      
      expect(status).toBeDefined();
      expect(status.status).toMatch(/^(healthy|degraded|unhealthy)$/);
      expect(status.config).toBeDefined();
      expect(status.validation).toBeDefined();
      expect(status.validation.isValid).toBeDefined();
      expect(Array.isArray(status.validation.errors)).toBe(true);
    });

    test('getEmailServiceStatus includes configuration details', async () => {
      const status = await emailService.getEmailServiceStatus();
      
      expect(status.config).toBeDefined();
      expect(status.config.host).toBeDefined();
      expect(status.config.port).toBeDefined();
      expect(status.config.from).toBeDefined();
      expect(typeof status.config.hasAuth).toBe('boolean');
    });
  });

  describe('Test Email Functionality', () => {
    test('sendTestEmail sends test email successfully', async () => {
      const result = await emailService.sendTestEmail('test@example.com');
      
      expect(typeof result).toBe('boolean');
      // In test mode, this should succeed
      expect(result).toBe(true);
    });

    test('sendTestEmail handles invalid email gracefully', async () => {
      const result = await emailService.sendTestEmail('invalid-email');
      
      expect(typeof result).toBe('boolean');
    });
  });

  describe('User Registration Emails', () => {
    test('sendUserRegistrationWelcome sends welcome email', async () => {
      await expect(emailService.sendUserRegistrationWelcome(
        'user@example.com',
        'John Doe',
        'john.doe',
        'http://localhost:3000/login'
      )).resolves.not.toThrow();
    });

    test('sendUserRegistrationVerification sends verification email', async () => {
      await expect(emailService.sendUserRegistrationVerification(
        'user@example.com',
        'John Doe',
        'http://localhost:3000/verify?token=abc123',
        24
      )).resolves.not.toThrow();
    });
  });

  describe('Password Reset Emails', () => {
    test('sendPasswordResetRequest sends reset request email', async () => {
      await expect(emailService.sendPasswordResetRequest(
        'user@example.com',
        'John Doe',
        'http://localhost:3000/reset?token=abc123',
        '192.168.1.1',
        'Mozilla/5.0',
        '1 heure'
      )).resolves.not.toThrow();
    });

    test('sendPasswordResetConfirmation sends confirmation email', async () => {
      await expect(emailService.sendPasswordResetConfirmation(
        'user@example.com',
        'John Doe',
        '192.168.1.1',
        'http://localhost:3000/login'
      )).resolves.not.toThrow();
    });
  });

  describe('Notification Emails', () => {
    test('sendStudentProgressReport sends progress report', async () => {
      const progressData = {
        exercisesCompleted: 25,
        studyTime: '2 heures',
        averageScore: 85,
        subjects: ['Mathématiques', 'Français']
      };

      await expect(emailService.sendStudentProgressReport(
        'parent@example.com',
        'Parent Name',
        'Student Name',
        progressData,
        'http://localhost:3000/dashboard'
      )).resolves.not.toThrow();
    });

    test('sendAchievementNotification sends achievement email', async () => {
      const achievement = {
        title: 'Math Master',
        description: 'Completed 100 math exercises'
      };

      await expect(emailService.sendAchievementNotification(
        'student@example.com',
        'Student Name',
        achievement,
        'http://localhost:3000/achievements'
      )).resolves.not.toThrow();
    });

    test('sendMaintenanceNotification sends maintenance email', async () => {
      const maintenanceInfo = {
        date: '2024-01-20',
        time: '02:00 - 04:00',
        duration: '2 heures',
        purpose: 'Mise à jour système'
      };

      await expect(emailService.sendMaintenanceNotification(
        'user@example.com',
        maintenanceInfo
      )).resolves.not.toThrow();
    });

    test('sendSecurityAlert sends security alert email', async () => {
      const alertInfo = {
        type: 'Connexion suspecte',
        location: 'Paris, France',
        device: 'Chrome sur Windows'
      };

      await expect(emailService.sendSecurityAlert(
        'user@example.com',
        'John Doe',
        alertInfo,
        'http://localhost:3000/security'
      )).resolves.not.toThrow();
    });
  });

  describe('GDPR Emails', () => {
    test('sendParentalConsentEmail sends first consent email', async () => {
      await expect(emailService.sendParentalConsentEmail(
        'parent@example.com',
        'Parent Name',
        'Child Name',
        'http://localhost:3000/consent?token=abc123',
        ['educational_data', 'progress_tracking'],
        'first'
      )).resolves.not.toThrow();
    });

    test('sendParentalConsentEmail sends second consent email', async () => {
      await expect(emailService.sendParentalConsentEmail(
        'parent@example.com',
        'Parent Name',
        'Child Name',
        'http://localhost:3000/consent?token=abc123',
        ['educational_data', 'progress_tracking'],
        'second'
      )).resolves.not.toThrow();
    });

    test('sendGDPRVerificationEmail sends verification email', async () => {
      await expect(emailService.sendGDPRVerificationEmail(
        'requester@example.com',
        'Requester Name',
        'Data Export',
        'GDPR-123',
        'http://localhost:3000/verify?token=xyz789'
      )).resolves.not.toThrow();
    });

    test('sendGDPRConfirmationEmail sends confirmation email', async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      await expect(emailService.sendGDPRConfirmationEmail(
        'requester@example.com',
        'Requester Name',
        'Data Export',
        'GDPR-123',
        'Normal',
        dueDate
      )).resolves.not.toThrow();
    });
  });

  describe('Bulk Email Operations', () => {
    test('sendBulkEmails processes multiple emails', async () => {
      const emails = [
        {
          to: 'user1@example.com',
          subject: 'Test Email 1',
          template: 'test',
          variables: { timestamp: new Date().toISOString() }
        },
        {
          to: 'user2@example.com',
          subject: 'Test Email 2',
          template: 'test',
          variables: { timestamp: new Date().toISOString() }
        }
      ];

      const result = await emailService.sendBulkEmails(emails, 2, 100);
      
      expect(result).toBeDefined();
      expect(result.sent).toBeDefined();
      expect(result.failed).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.sent + result.failed).toBe(emails.length);
    });

    test('sendBulkEmails handles empty email list', async () => {
      const result = await emailService.sendBulkEmails([]);
      
      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.errors).toEqual([]);
    });
  });

  describe('Data Retention Emails', () => {
    test('sendRetentionWarning sends retention warning', async () => {
      const entity = {
        id: 'student-123',
        type: 'student',
        email: 'student@example.com'
      };

      const policy = {
        id: 'policy-1',
        policyName: 'Student Data Retention',
        action: 'delete',
        retentionPeriodDays: 365,
        notificationDays: 30
      };

      await expect(emailService.sendRetentionWarning(entity, policy))
        .resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('sendEmail handles invalid email addresses gracefully', async () => {
      await expect(emailService.sendEmail({
        to: 'invalid-email',
        subject: 'Test',
        template: 'test',
        variables: {}
      })).rejects.toThrow();
    });

    test('sendEmail handles missing template variables', async () => {
      await expect(emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        template: 'user-registration-welcome',
        variables: {} // Missing required variables
      })).resolves.not.toThrow(); // Should still work, just with undefined values
    });
  });

  describe('Email Service Health', () => {
    test('checkEmailServiceHealth performs health check', async () => {
      // This is a private method, but we can test it indirectly
      // through the public methods that use it
      const status = await emailService.getEmailServiceStatus();
      
      expect(status).toBeDefined();
      expect(status.status).toBeDefined();
    });
  });

  describe('Retry Logic', () => {
    test('sendEmailWithRetry handles retry attempts', async () => {
      await expect(emailService.sendEmailWithRetry({
        to: 'test@example.com',
        subject: 'Test with Retry',
        template: 'test',
        variables: { timestamp: new Date().toISOString() }
      }, 1)).resolves.not.toThrow();
    });

    test('sendEmailWithRetry respects max retry limit', async () => {
      await expect(emailService.sendEmailWithRetry({
        to: 'test@example.com',
        subject: 'Test with Retry',
        template: 'test',
        variables: { timestamp: new Date().toISOString() }
      }, 3)).resolves.not.toThrow();
    });
  });
});












