/**
 * Pure Unit Tests - No setup.ts, no Fastify, no app initialization
 * Testing pure functions and algorithms only
 */

import { describe, test, expect } from 'vitest';

describe('Pure Unit Tests - Core Algorithms & Logic', () => {
  
  // =============================================================================
  // AUTHENTICATION & SECURITY ALGORITHMS
  // =============================================================================
  
  describe('Authentication & Security Algorithms', () => {
    
    test('bcrypt hash with different salt rounds', async () => {
      const bcrypt = await import('bcrypt');
      const password = 'testpassword123';
      
      const hash10 = await bcrypt.hash(password, 10);
      const hash12 = await bcrypt.hash(password, 12);
      const hash14 = await bcrypt.hash(password, 14);
      
      expect(hash10).not.toBe(hash12);
      expect(hash12).not.toBe(hash14);
      expect(hash10.length).toBeGreaterThan(50);
      expect(hash12.length).toBeGreaterThan(50);
      expect(hash14.length).toBeGreaterThan(50);
    });

    test('bcrypt handles edge cases', async () => {
      const bcrypt = await import('bcrypt');
      
      // Empty password
      const emptyHash = await bcrypt.hash('', 10);
      expect(emptyHash).toBeDefined();
      
      // Very long password
      const longPassword = 'a'.repeat(1000);
      const longHash = await bcrypt.hash(longPassword, 10);
      expect(longHash).toBeDefined();
      
      // Special characters
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const specialHash = await bcrypt.hash(specialPassword, 10);
      expect(specialHash).toBeDefined();
    });

    test('crypto AES-256-GCM encryption', () => {
      const crypto = require('crypto');
      const algorithm = 'aes-256-gcm';
      const key = crypto.scryptSync('test-key', 'salt', 32);
      const iv = crypto.randomBytes(16);
      
      const data = 'This is sensitive data';
      
      // Encrypt
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const tag = cipher.getAuthTag();
      
      // Decrypt
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      decipher.setAuthTag(tag);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      expect(decrypted).toBe(data);
      expect(encrypted).not.toBe(data);
    });

    test('crypto PBKDF2 key derivation', () => {
      const crypto = require('crypto');
      const password = 'test-password';
      const salt = crypto.randomBytes(32);
      
      const key1 = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
      const key2 = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
      
      expect(key1.toString('hex')).toBe(key2.toString('hex'));
      expect(key1.length).toBe(32);
    });

    test('crypto HMAC generation', () => {
      const crypto = require('crypto');
      const data = 'test-data';
      const secret = 'test-secret';
      
      const hmac1 = crypto.createHmac('sha256', secret).update(data).digest('hex');
      const hmac2 = crypto.createHmac('sha256', secret).update(data).digest('hex');
      
      expect(hmac1).toBe(hmac2);
      expect(hmac1).toMatch(/^[a-f0-9]{64}$/);
    });

    test('JWT token structure validation', () => {
      const jwt = require('jsonwebtoken');
      const payload = { userId: 123, email: 'test@example.com' };
      const secret = 'test-secret';
      
      const token = jwt.sign(payload, secret, { expiresIn: '1h' });
      const decoded = jwt.verify(token, secret);
      
      expect(token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
      expect(decoded.userId).toBe(123);
      expect(decoded.email).toBe('test@example.com');
    });

    test('password strength scoring algorithm', () => {
      const calculatePasswordStrength = (password: string): { score: number; feedback: string[] } => {
        let score = 0;
        const feedback: string[] = [];
        
        // Length check
        if (password.length >= 8) score += 1;
        else feedback.push('Use at least 8 characters');
        
        if (password.length >= 12) score += 1;
        
        // Character variety
        if (/[a-z]/.test(password)) score += 1;
        else feedback.push('Add lowercase letters');
        
        if (/[A-Z]/.test(password)) score += 1;
        else feedback.push('Add uppercase letters');
        
        if (/[0-9]/.test(password)) score += 1;
        else feedback.push('Add numbers');
        
        if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score += 1;
        else feedback.push('Add special characters');
        
        // Common patterns
        if (/(.)\1{2,}/.test(password)) {
          score -= 1;
          feedback.push('Avoid repeated characters');
        }
        
        if (/123|abc|qwe/i.test(password)) {
          score -= 1;
          feedback.push('Avoid common sequences');
        }
        
        return { score: Math.max(0, score), feedback };
      };
      
      const weak = calculatePasswordStrength('weak');
      const medium = calculatePasswordStrength('Password123');
      const strong = calculatePasswordStrength('StrongP@ssw0rd!');
      
      expect(weak.score).toBeLessThan(3);
      expect(medium.score).toBeGreaterThanOrEqual(3);
      expect(strong.score).toBeGreaterThanOrEqual(4);
    });
  });

  // =============================================================================
  // DATA VALIDATION ALGORITHMS
  // =============================================================================
  
  describe('Data Validation Algorithms', () => {
    
    test('comprehensive email validation', () => {
      const validateEmail = (email: string): { isValid: boolean; errors: string[] } => {
        const errors: string[] = [];
        
        if (!email || typeof email !== 'string') {
          errors.push('Email is required');
          return { isValid: false, errors };
        }
        
        if (email.length > 254) {
          errors.push('Email too long');
        }
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push('Invalid email format');
        }
        
        const [local, domain] = email.split('@');
        if (local && local.length > 64) {
          errors.push('Local part too long');
        }
        
        if (domain && domain.length > 253) {
          errors.push('Domain too long');
        }
        
        if (domain && domain.startsWith('.')) {
          errors.push('Domain cannot start with a dot');
        }
        
        if (email.includes('..')) {
          errors.push('Consecutive dots not allowed');
        }
        
        if (email.startsWith('.') || email.endsWith('.')) {
          errors.push('Email cannot start or end with a dot');
        }
        
        return { isValid: errors.length === 0, errors };
      };
      
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'admin@sub.domain.org',
        'test+tag@example.com',
        'user123@test-domain.com',
        'a@b.co'
      ];
      
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user@domain..com',
        'user@.domain.com',
        'user@domain.',
        'user name@domain.com',
        'user@domain com',
        'user..name@domain.com'
      ];
      
      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
      });
      
      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
      });
    });

    test('competency code validation algorithm', () => {
      const validateCompetencyCode = (code: string): { isValid: boolean; errors: string[] } => {
        const errors: string[] = [];
        
        if (!code || typeof code !== 'string') {
          errors.push('Code is required');
          return { isValid: false, errors };
        }
        
        const parts = code.split('.');
        if (parts.length !== 5) {
          errors.push('Code must have exactly 5 parts separated by dots');
          return { isValid: false, errors };
        }
        
        const [level, subject, domain, subdomain, number] = parts;
        
        const validLevels = ['CP', 'CE1', 'CE2'];
        if (!validLevels.includes(level)) {
          errors.push(`Level must be one of: ${validLevels.join(', ')}`);
        }
        
        const validSubjects = ['FR', 'MA', 'HG', 'EMC', 'ARTS', 'EPS'];
        if (!validSubjects.includes(subject)) {
          errors.push(`Subject must be one of: ${validSubjects.join(', ')}`);
        }
        
        const validDomains = ['L', 'N', 'E', 'C', 'A', 'P', 'S'];
        if (!validDomains.includes(domain)) {
          errors.push(`Domain must be one of: ${validDomains.join(', ')}`);
        }
        
        if (!/^[A-Z]{2}$/.test(subdomain)) {
          errors.push('Subdomain must be exactly 2 uppercase letters');
        }
        
        if (!/^\d{2}$/.test(number)) {
          errors.push('Number must be exactly 2 digits');
        }
        
        return { isValid: errors.length === 0, errors };
      };
      
      const validCodes = [
        'CP.FR.L.FL.01',
        'CE1.MA.N.CA.05',
        'CE2.FR.E.OR.10',
        'CP.HG.C.GE.15',
        'CE1.EMC.A.CI.20'
      ];
      
      const invalidCodes = [
        'INVALID',
        'CP.FR.L.FL',
        'CP.FR.L.FL.01.EXTRA',
        'CP.INVALID.L.FL.01',
        'CP.FR.X.FL.01',
        'CP.FR.L.FL.1',
        'CP.FR.L.FL.001'
      ];
      
      validCodes.forEach(code => {
        const result = validateCompetencyCode(code);
        expect(result.isValid).toBe(true);
      });
      
      invalidCodes.forEach(code => {
        const result = validateCompetencyCode(code);
        expect(result.isValid).toBe(false);
      });
    });

    test('student data validation algorithm', () => {
      const validateStudentData = (student: any): { isValid: boolean; errors: string[] } => {
        const errors: string[] = [];
        
        if (!student || typeof student !== 'object') {
          errors.push('Student data is required');
          return { isValid: false, errors };
        }
        
        // First name validation
        if (!student.prenom || typeof student.prenom !== 'string') {
          errors.push('First name is required');
        } else if (student.prenom.trim().length < 2) {
          errors.push('First name must be at least 2 characters');
        } else if (student.prenom.trim().length > 50) {
          errors.push('First name must be less than 50 characters');
        } else if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(student.prenom.trim())) {
          errors.push('First name contains invalid characters');
        }
        
        // Last name validation
        if (!student.nom || typeof student.nom !== 'string') {
          errors.push('Last name is required');
        } else if (student.nom.trim().length < 2) {
          errors.push('Last name must be at least 2 characters');
        } else if (student.nom.trim().length > 50) {
          errors.push('Last name must be less than 50 characters');
        } else if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(student.nom.trim())) {
          errors.push('Last name contains invalid characters');
        }
        
        // Email validation
        if (!student.email || typeof student.email !== 'string') {
          errors.push('Email is required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
          errors.push('Valid email is required');
        }
        
        // Age validation
        if (student.age !== undefined) {
          if (typeof student.age !== 'number' || !Number.isInteger(student.age)) {
            errors.push('Age must be an integer');
          } else if (student.age < 3 || student.age > 18) {
            errors.push('Age must be between 3 and 18');
          }
        }
        
        return { isValid: errors.length === 0, errors };
      };
      
      const validStudent = {
        prenom: 'Alice',
        nom: 'Dupont',
        email: 'alice.dupont@example.com',
        age: 8
      };
      
      const invalidStudent = {
        prenom: 'A',
        nom: '',
        email: 'invalid-email',
        age: 25
      };
      
      expect(validateStudentData(validStudent).isValid).toBe(true);
      expect(validateStudentData(invalidStudent).isValid).toBe(false);
    });
  });

  // =============================================================================
  // BUSINESS LOGIC ALGORITHMS
  // =============================================================================
  
  describe('Business Logic Algorithms', () => {
    
    test('competency progress calculation algorithm', () => {
      const calculateProgress = (completed: number, total: number): { 
        percentage: number; 
        status: string; 
        level: number;
        nextMilestone: number;
      } => {
        if (total === 0) return { 
          percentage: 0, 
          status: 'not_started', 
          level: 0,
          nextMilestone: 1
        };
        
        const percentage = Math.round((completed / total) * 100);
        let status: string;
        let level: number;
        let nextMilestone: number;
        
        if (percentage === 0) {
          status = 'not_started';
          level = 0;
          nextMilestone = 1;
        } else if (percentage < 25) {
          status = 'beginner';
          level = 1;
          nextMilestone = Math.ceil(total * 0.25);
        } else if (percentage < 50) {
          status = 'in_progress';
          level = 2;
          nextMilestone = Math.ceil(total * 0.5);
        } else if (percentage < 75) {
          status = 'advanced';
          level = 3;
          nextMilestone = Math.ceil(total * 0.75);
        } else if (percentage < 100) {
          status = 'expert';
          level = 4;
          nextMilestone = total;
        } else {
          status = 'mastered';
          level = 5;
          nextMilestone = total;
        }
        
        return { percentage, status, level, nextMilestone };
      };
      
      expect(calculateProgress(0, 10)).toEqual({ 
        percentage: 0, 
        status: 'not_started', 
        level: 0,
        nextMilestone: 1
      });
      expect(calculateProgress(2, 10)).toEqual({ 
        percentage: 20, 
        status: 'beginner', 
        level: 1,
        nextMilestone: 3
      });
      expect(calculateProgress(4, 10)).toEqual({ 
        percentage: 40, 
        status: 'in_progress', 
        level: 2,
        nextMilestone: 5
      });
      expect(calculateProgress(7, 10)).toEqual({ 
        percentage: 70, 
        status: 'advanced', 
        level: 3,
        nextMilestone: 8
      });
      expect(calculateProgress(9, 10)).toEqual({ 
        percentage: 90, 
        status: 'expert', 
        level: 4,
        nextMilestone: 10
      });
      expect(calculateProgress(10, 10)).toEqual({ 
        percentage: 100, 
        status: 'mastered', 
        level: 5,
        nextMilestone: 10
      });
    });

    test('exercise difficulty calculation algorithm', () => {
      const calculateDifficulty = (metrics: {
        successRate: number;
        timeSpent: number;
        attempts: number;
        hintsUsed: number;
      }): { difficulty: string; score: number; recommendations: string[] } => {
        const { successRate, timeSpent, attempts, hintsUsed } = metrics;
        let score = 0;
        const recommendations: string[] = [];
        
        // Success rate scoring (0-40 points)
        if (successRate >= 0.9) score += 40;
        else if (successRate >= 0.7) score += 30;
        else if (successRate >= 0.5) score += 20;
        else if (successRate >= 0.3) score += 10;
        
        // Time scoring (0-30 points)
        if (timeSpent <= 60) score += 30;
        else if (timeSpent <= 120) score += 25;
        else if (timeSpent <= 180) score += 20;
        else if (timeSpent <= 300) score += 10;
        
        // Attempts scoring (0-20 points)
        if (attempts === 1) score += 20;
        else if (attempts <= 2) score += 15;
        else if (attempts <= 3) score += 10;
        else if (attempts <= 5) score += 5;
        
        // Hints scoring (0-10 points)
        if (hintsUsed === 0) score += 10;
        else if (hintsUsed <= 1) score += 7;
        else if (hintsUsed <= 2) score += 5;
        else if (hintsUsed <= 3) score += 2;
        
        let difficulty: string;
        if (score >= 80) difficulty = 'easy';
        else if (score >= 60) difficulty = 'medium';
        else if (score >= 40) difficulty = 'hard';
        else difficulty = 'very_hard';
        
        // Generate recommendations
        if (successRate < 0.5) recommendations.push('Practice more similar exercises');
        if (timeSpent > 300) recommendations.push('Take breaks and review concepts');
        if (attempts > 5) recommendations.push('Ask for help or use hints');
        if (hintsUsed > 3) recommendations.push('Review prerequisite knowledge');
        
        return { difficulty, score, recommendations };
      };
      
      const easyMetrics = { successRate: 0.95, timeSpent: 45, attempts: 1, hintsUsed: 0 };
      const mediumMetrics = { successRate: 0.7, timeSpent: 150, attempts: 2, hintsUsed: 1 };
      const hardMetrics = { successRate: 0.3, timeSpent: 400, attempts: 6, hintsUsed: 4 };
      
      expect(calculateDifficulty(easyMetrics).difficulty).toBe('easy');
      expect(calculateDifficulty(mediumMetrics).difficulty).toBe('medium');
      expect(calculateDifficulty(hardMetrics).difficulty).toBe('very_hard');
    });

    test('grade calculation algorithm', () => {
      const calculateGrade = (score: number, total: number, weights?: { [key: string]: number }): { 
        grade: string; 
        percentage: number; 
        passed: boolean;
        gpa: number;
        feedback: string;
      } => {
        const percentage = Math.round((score / total) * 100);
        let grade: string;
        let passed: boolean;
        let gpa: number;
        let feedback: string;
        
        if (percentage >= 97) { 
          grade = 'A+'; 
          passed = true; 
          gpa = 4.0;
          feedback = 'Excellent work!';
        } else if (percentage >= 93) { 
          grade = 'A'; 
          passed = true; 
          gpa = 4.0;
          feedback = 'Great job!';
        } else if (percentage >= 90) { 
          grade = 'A-'; 
          passed = true; 
          gpa = 3.7;
          feedback = 'Well done!';
        } else if (percentage >= 87) { 
          grade = 'B+'; 
          passed = true; 
          gpa = 3.3;
          feedback = 'Good work!';
        } else if (percentage >= 83) { 
          grade = 'B'; 
          passed = true; 
          gpa = 3.0;
          feedback = 'Nice job!';
        } else if (percentage >= 80) { 
          grade = 'B-'; 
          passed = true; 
          gpa = 2.7;
          feedback = 'Keep it up!';
        } else if (percentage >= 77) { 
          grade = 'C+'; 
          passed = true; 
          gpa = 2.3;
          feedback = 'Not bad!';
        } else if (percentage >= 73) { 
          grade = 'C'; 
          passed = true; 
          gpa = 2.0;
          feedback = 'Average work.';
        } else if (percentage >= 70) { 
          grade = 'C-'; 
          passed = true; 
          gpa = 1.7;
          feedback = 'Barely passing.';
        } else if (percentage >= 67) { 
          grade = 'D+'; 
          passed = true; 
          gpa = 1.3;
          feedback = 'Needs improvement.';
        } else if (percentage >= 65) { 
          grade = 'D'; 
          passed = true; 
          gpa = 1.0;
          feedback = 'Poor performance.';
        } else { 
          grade = 'F'; 
          passed = false; 
          gpa = 0.0;
          feedback = 'Failed. Please retake.';
        }
        
        return { grade, percentage, passed, gpa, feedback };
      };
      
      expect(calculateGrade(95, 100)).toEqual({ 
        grade: 'A', 
        percentage: 95, 
        passed: true, 
        gpa: 4.0,
        feedback: 'Great job!'
      });
      expect(calculateGrade(85, 100)).toEqual({ 
        grade: 'B', 
        percentage: 85, 
        passed: true, 
        gpa: 3.0,
        feedback: 'Nice job!'
      });
      expect(calculateGrade(55, 100)).toEqual({ 
        grade: 'F', 
        percentage: 55, 
        passed: false, 
        gpa: 0.0,
        feedback: 'Failed. Please retake.'
      });
    });

    test('session timeout calculation algorithm', () => {
      const calculateSessionTimeout = (userType: string, lastActivity: Date, isActive: boolean = true): { 
        timeoutMinutes: number; 
        warningMinutes: number;
        status: string;
      } => {
        const now = new Date();
        const timeSinceActivity = now.getTime() - lastActivity.getTime();
        const minutesSinceActivity = Math.floor(timeSinceActivity / (1000 * 60));
        
        let baseTimeoutMinutes: number;
        let warningMinutes: number;
        
        switch (userType) {
          case 'student':
            baseTimeoutMinutes = 30;
            warningMinutes = 25;
            break;
          case 'teacher':
            baseTimeoutMinutes = 60;
            warningMinutes = 50;
            break;
          case 'admin':
            baseTimeoutMinutes = 120;
            warningMinutes = 100;
            break;
          default:
            baseTimeoutMinutes = 15;
            warningMinutes = 10;
        }
        
        const remainingMinutes = Math.max(0, baseTimeoutMinutes - minutesSinceActivity);
        let status: string;
        
        if (!isActive) {
          status = 'inactive';
        } else if (remainingMinutes <= 0) {
          status = 'expired';
        } else if (remainingMinutes <= warningMinutes) {
          status = 'warning';
        } else {
          status = 'active';
        }
        
        return { 
          timeoutMinutes: remainingMinutes, 
          warningMinutes: Math.max(0, warningMinutes - minutesSinceActivity),
          status 
        };
      };
      
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
      
      expect(calculateSessionTimeout('student', fiveMinutesAgo).status).toBe('warning');
      expect(calculateSessionTimeout('student', thirtyMinutesAgo).status).toBe('expired');
      expect(calculateSessionTimeout('teacher', fiveMinutesAgo).timeoutMinutes).toBe(55);
    });
  });

  // =============================================================================
  // UTILITY ALGORITHMS
  // =============================================================================
  
  describe('Utility Algorithms', () => {
    
    test('cache key generation algorithm', () => {
      const generateCacheKey = (type: string, params: any): string => {
        const { level, subject, limit, offset, filters, sort, order } = params;
        
        const parts = [type];
        parts.push(level || 'all');
        parts.push(subject || 'all');
        parts.push(limit || 100);
        parts.push(offset || 0);
        
        if (filters && Object.keys(filters).length > 0) {
          const filterStr = Object.entries(filters)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}:${v}`)
            .join(',');
          parts.push(filterStr);
        }
        
        if (sort) {
          parts.push(`sort:${sort}`);
        }
        
        if (order) {
          parts.push(`order:${order}`);
        }
        
        return parts.join(':');
      };
      
      expect(generateCacheKey('comp:list', { level: 'CE2', subject: 'FR', limit: 10, offset: 0 }))
        .toBe('comp:list:CE2:FR:10:0');
      
      expect(generateCacheKey('comp:list', { level: 'CP' }))
        .toBe('comp:list:CP:all:100:0');
      
      expect(generateCacheKey('comp:list', { 
        level: 'CE1', 
        subject: 'MA', 
        filters: { difficulty: 'easy', status: 'active' },
        sort: 'name',
        order: 'asc'
      })).toBe('comp:list:CE1:MA:100:0:difficulty:easy,status:active:sort:name:order:asc');
    });

    test('string sanitization algorithm', () => {
      const sanitizeString = (input: string, options: { 
        maxLength?: number; 
        allowHtml?: boolean; 
        preserveWhitespace?: boolean;
      } = {}): { sanitized: string; warnings: string[] } => {
        const { maxLength = 1000, allowHtml = false, preserveWhitespace = false } = options;
        const warnings: string[] = [];
        let sanitized = input;
        
        if (!preserveWhitespace) {
          sanitized = sanitized.trim();
        }
        
        if (sanitized.length > maxLength) {
          sanitized = sanitized.substring(0, maxLength);
          warnings.push(`String truncated to ${maxLength} characters`);
        }
        
        if (!allowHtml) {
          const originalLength = sanitized.length;
          sanitized = sanitized
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/[&"']/g, (match) => {
              switch (match) {
                case '&': return '&amp;';
                case '"': return '&quot;';
                case "'": return '&#x27;';
                default: return match;
              }
            });
          
          if (sanitized.length !== originalLength) {
            warnings.push('HTML characters were escaped');
          }
        }
        
        // Remove control characters
        sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
        
        return { sanitized, warnings };
      };
      
      const testInput = '  <script>alert("test")</script>  ';
      const result = sanitizeString(testInput);
      
      expect(result.sanitized).toBe('scriptalert(&quot;test&quot;)/script');
      expect(result.warnings).toContain('HTML characters were escaped');
    });

    test('array operations algorithms', () => {
      const removeDuplicates = <T>(array: T[], key?: keyof T): T[] => {
        if (!key) {
          return [...new Set(array)];
        }
        
        const seen = new Set();
        return array.filter(item => {
          const value = item[key];
          if (seen.has(value)) {
            return false;
          }
          seen.add(value);
          return true;
        });
      };
      
      const chunkArray = <T>(array: T[], size: number): T[][] => {
        if (size <= 0) return [];
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
          chunks.push(array.slice(i, i + size));
        }
        return chunks;
      };
      
      const shuffleArray = <T>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };
      
      const numbers = [1, 2, 2, 3, 3, 3, 4, 5];
      const unique = removeDuplicates(numbers);
      const chunks = chunkArray(unique, 3);
      
      expect(unique).toEqual([1, 2, 3, 4, 5]);
      expect(chunks).toEqual([[1, 2, 3], [4, 5]]);
      
      const shuffled = shuffleArray([1, 2, 3, 4, 5]);
      expect(shuffled).toHaveLength(5);
      expect(shuffled).toEqual(expect.arrayContaining([1, 2, 3, 4, 5]));
    });

    test('object deep cloning algorithm', () => {
      const deepClone = <T>(obj: T): T => {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
        if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
        if (obj instanceof RegExp) return new RegExp(obj) as unknown as T;
        if (obj instanceof Map) {
          const cloned = new Map();
          for (const [key, value] of obj) {
            cloned.set(deepClone(key), deepClone(value));
          }
          return cloned as unknown as T;
        }
        if (obj instanceof Set) {
          const cloned = new Set();
          for (const value of obj) {
            cloned.add(deepClone(value));
          }
          return cloned as unknown as T;
        }
        if (typeof obj === 'object') {
          const cloned = {} as T;
          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              cloned[key] = deepClone(obj[key]);
            }
          }
          return cloned;
        }
        return obj;
      };
      
      const original = {
        name: 'test',
        nested: { value: 123, array: [1, 2, 3] },
        date: new Date('2024-01-01'),
        regex: /test/gi,
        map: new Map([['key', 'value']]),
        set: new Set([1, 2, 3])
      };
      
      const cloned = deepClone(original);
      cloned.nested.value = 456;
      cloned.nested.array.push(4);
      
      expect(original.nested.value).toBe(123);
      expect(original.nested.array).toEqual([1, 2, 3]);
      expect(cloned.nested.value).toBe(456);
      expect(cloned.nested.array).toEqual([1, 2, 3, 4]);
      expect(cloned.date).not.toBe(original.date);
      expect(cloned.date.getTime()).toBe(original.date.getTime());
    });
  });

  // =============================================================================
  // PERFORMANCE ALGORITHMS
  // =============================================================================
  
  describe('Performance Algorithms', () => {
    
    test('debounce algorithm', (done) => {
      const debounce = <T extends (...args: any[]) => any>(func: T, delay: number): T => {
        let timeoutId: NodeJS.Timeout;
        return ((...args: any[]) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => func.apply(null, args), delay);
        }) as T;
      };
      
      let callCount = 0;
      const debouncedFunction = debounce(() => {
        callCount++;
      }, 100);
      
      // Call multiple times quickly
      debouncedFunction();
      debouncedFunction();
      debouncedFunction();
      
      // Should only be called once after delay
      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 150);
    });

    test('throttle algorithm', (done) => {
      const throttle = <T extends (...args: any[]) => any>(func: T, delay: number): T => {
        let lastCall = 0;
        return ((...args: any[]) => {
          const now = Date.now();
          if (now - lastCall >= delay) {
            lastCall = now;
            return func.apply(null, args);
          }
        }) as T;
      };
      
      let callCount = 0;
      const throttledFunction = throttle(() => {
        callCount++;
      }, 100);
      
      // Call multiple times
      throttledFunction();
      throttledFunction();
      throttledFunction();
      
      setTimeout(() => {
        throttledFunction();
        throttledFunction();
      }, 50);
      
      setTimeout(() => {
        throttledFunction();
        throttledFunction();
      }, 150);
      
      // Should be called at most 3 times
      setTimeout(() => {
        expect(callCount).toBeLessThanOrEqual(3);
        done();
      }, 200);
    });

    test('memoization algorithm', () => {
      const memoize = <T extends (...args: any[]) => any>(func: T, maxSize: number = 100): T => {
        const cache = new Map();
        return ((...args: any[]) => {
          const key = JSON.stringify(args);
          if (cache.has(key)) {
            return cache.get(key);
          }
          
          if (cache.size >= maxSize) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
          }
          
          const result = func.apply(null, args);
          cache.set(key, result);
          return result;
        }) as T;
      };
      
      let callCount = 0;
      const expensiveFunction = memoize((n: number) => {
        callCount++;
        return n * n;
      }, 5);
      
      expect(expensiveFunction(5)).toBe(25);
      expect(expensiveFunction(5)).toBe(25);
      expect(expensiveFunction(5)).toBe(25);
      expect(callCount).toBe(1);
      
      expect(expensiveFunction(10)).toBe(100);
      expect(callCount).toBe(2);
    });

    test('batch processing algorithm', () => {
      const processBatch = async <T>(
        items: T[], 
        batchSize: number, 
        processor: (batch: T[]) => Promise<void>,
        delay: number = 0
      ): Promise<void> => {
        for (let i = 0; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize);
          await processor(batch);
          if (delay > 0 && i + batchSize < items.length) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      };
      
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const processedBatches: number[][] = [];
      
      return processBatch(items, 3, async (batch) => {
        processedBatches.push(batch);
      }).then(() => {
        expect(processedBatches).toEqual([
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
          [10]
        ]);
      });
    });
  });
});
