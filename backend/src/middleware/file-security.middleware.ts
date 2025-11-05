// COMPREHENSIVE FILE SECURITY MIDDLEWARE
// Multi-layer protection for file operations

import { FastifyRequest, FastifyReply } from 'fastify';
import { pathSecurity } from '../security/path-security.service';
import { logger } from '../utils/logger';

interface FileSecurityOptions {
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  requireAuthentication?: boolean;
  rateLimitPerUser?: number; // files per hour
  virusScanEnabled?: boolean;
  contentScanEnabled?: boolean;
}

interface FileSecurityContext {
  userId?: string;
  userRole?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: number;
}

interface SecurityThreat {
  type: 'path_traversal' | 'malicious_file' | 'rate_limit' | 'size_limit' | 'mime_type' | 'content_scan';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  blocked: boolean;
}

export class FileSecurityMiddleware {
  private static userUploadCounts = new Map<string, { count: number; resetTime: number }>();
  private static blockedIPs = new Set<string>();
  private static suspiciousActivities = new Map<string, SecurityThreat[]>();

  /**
   * Main file security middleware
   */
  static async validateFileRequest(
    request: FastifyRequest,
    reply: FastifyReply,
    options: FileSecurityOptions = {}
  ): Promise<boolean> {
    const context = FileSecurityMiddleware.extractSecurityContext(request);
    const threats: SecurityThreat[] = [];

    // Check if IP is blocked
    if (FileSecurityMiddleware.blockedIPs.has(context.ipAddress)) {
      const threat: SecurityThreat = {
        type: 'path_traversal',
        severity: 'critical',
        details: 'IP address is blocked due to previous security violations',
        blocked: true
      };
      threats.push(threat);
      FileSecurityMiddleware.recordThreat(context, threat);

      logger.error('Blocked IP attempted file access', context);
      reply.status(403).send({
        success: false,
        error: 'Access denied due to security policy'
      });
      return false;
    }

    // Rate limiting check
    if (options.rateLimitPerUser && context.userId) {
      const rateLimitThreat = FileSecurityMiddleware.checkRateLimit(
        context.userId,
        options.rateLimitPerUser
      );
      if (rateLimitThreat) {
        threats.push(rateLimitThreat);
        if (rateLimitThreat.blocked) {
          reply.status(429).send({
            success: false,
            error: 'Rate limit exceeded. Please try again later.'
          });
          return false;
        }
      }
    }

    // Log all security events
    FileSecurityMiddleware.logSecurityEvent(context, threats);

    return threats.every(threat => !threat.blocked);
  }

  /**
   * Validate file upload specifically
   */
  static async validateFileUpload(
    file: any,
    context: FileSecurityContext,
    options: FileSecurityOptions = {}
  ): Promise<{ valid: boolean; threats: SecurityThreat[] }> {
    const threats: SecurityThreat[] = [];

    // File size validation
    if (options.maxFileSize && file.size > options.maxFileSize) {
      threats.push({
        type: 'size_limit',
        severity: 'medium',
        details: `File size ${file.size} exceeds limit ${options.maxFileSize}`,
        blocked: true
      });
    }

    // MIME type validation
    if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(file.mimetype)) {
      threats.push({
        type: 'mime_type',
        severity: 'medium',
        details: `MIME type ${file.mimetype} not in allowed list`,
        blocked: true
      });
    }

    // Filename security validation
    const filenameValidation = pathSecurity.validatePath(file.filename);
    if (!filenameValidation.isValid) {
      threats.push({
        type: 'path_traversal',
        severity: 'high',
        details: `Filename validation failed: ${filenameValidation.errors.join(', ')}`,
        blocked: true
      });
    }

    // Content scanning (basic)
    if (options.contentScanEnabled) {
      const contentThreats = await FileSecurityMiddleware.scanFileContent(file);
      threats.push(...contentThreats);
    }

    // Magic number validation (file header check)
    const magicNumberThreat = FileSecurityMiddleware.validateMagicNumbers(file);
    if (magicNumberThreat) {
      threats.push(magicNumberThreat);
    }

    // Record all threats
    threats.forEach(threat => {
      FileSecurityMiddleware.recordThreat(context, threat);
    });

    const isValid = threats.every(threat => !threat.blocked);
    return { valid: isValid, threats };
  }

  /**
   * Validate file download request
   */
  static async validateFileDownload(
    filePath: string,
    context: FileSecurityContext
  ): Promise<{ valid: boolean; secureFilePath?: string; threats: SecurityThreat[] }> {
    const threats: SecurityThreat[] = [];

    // Path security validation
    const pathValidation = pathSecurity.validatePath(filePath);
    if (!pathValidation.isValid) {
      threats.push({
        type: 'path_traversal',
        severity: 'critical',
        details: `Path traversal attempt: ${pathValidation.securityViolations.join(', ')}`,
        blocked: true
      });

      // Immediate IP blocking for path traversal attempts
      if (pathValidation.securityViolations.length > 0) {
        FileSecurityMiddleware.blockIP(context.ipAddress, 'Path traversal attempt');
      }
    }

    // File access validation
    const fileAccess = await pathSecurity.safeFileAccess(filePath, 'read');
    if (!fileAccess.success) {
      threats.push({
        type: 'path_traversal',
        severity: 'high',
        details: `File access failed: ${fileAccess.error}`,
        blocked: true
      });
    }

    threats.forEach(threat => {
      FileSecurityMiddleware.recordThreat(context, threat);
    });

    const isValid = threats.every(threat => !threat.blocked);
    return {
      valid: isValid,
      secureFilePath: isValid ? fileAccess.path : undefined,
      threats
    };
  }

  /**
   * Extract security context from request
   */
  private static extractSecurityContext(request: FastifyRequest): FileSecurityContext {
    return {
      userId: (request as any).user?.studentId?.toString(),
      userRole: (request as any).user?.role,
      ipAddress: request.ip || request.socket.remoteAddress || 'unknown',
      userAgent: request.headers['user-agent'] || 'unknown',
      timestamp: Date.now()
    };
  }

  /**
   * Rate limiting for file operations
   */
  private static checkRateLimit(
    userId: string,
    maxUploadsPerHour: number
  ): SecurityThreat | null {
    const now = Date.now();
    const hourInMs = 60 * 60 * 1000;

    const userStats = FileSecurityMiddleware.userUploadCounts.get(userId);

    if (!userStats || now > userStats.resetTime) {
      // Reset or initialize counter
      FileSecurityMiddleware.userUploadCounts.set(userId, {
        count: 1,
        resetTime: now + hourInMs
      });
      return null;
    }

    userStats.count++;

    if (userStats.count > maxUploadsPerHour) {
      return {
        type: 'rate_limit',
        severity: 'medium',
        details: `Rate limit exceeded: ${userStats.count}/${maxUploadsPerHour} uploads per hour`,
        blocked: true
      };
    }

    // Warning threshold (80% of limit)
    if (userStats.count > maxUploadsPerHour * 0.8) {
      return {
        type: 'rate_limit',
        severity: 'low',
        details: `Approaching rate limit: ${userStats.count}/${maxUploadsPerHour} uploads per hour`,
        blocked: false
      };
    }

    return null;
  }

  /**
   * Basic content scanning for malicious patterns
   */
  private static async scanFileContent(file: any): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];

    try {
      // Get file buffer for scanning
      let buffer: Buffer;
      if (file.toBuffer) {
        buffer = await file.toBuffer();
      } else if (file.data) {
        buffer = file.data;
      } else {
        return threats; // Can't scan without buffer
      }

      // Convert to string for pattern matching (first 1KB only for performance)
      const content = buffer.toString('utf8', 0, Math.min(1024, buffer.length));

      // Malicious script patterns
      const scriptPatterns = [
        /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /data:[\w\/]*;base64/gi,
        /eval\s*\(/gi,
        /document\.write/gi,
        /window\.location/gi
      ];

      for (const pattern of scriptPatterns) {
        if (pattern.test(content)) {
          threats.push({
            type: 'malicious_file',
            severity: 'high',
            details: `Potentially malicious script pattern detected: ${pattern.toString()}`,
            blocked: true
          });
        }
      }

      // PHP/Server-side script patterns
      const serverScriptPatterns = [
        /<\?php/gi,
        /<\?=/gi,
        /<%[\s\S]*?%>/gi,
        /exec\s*\(/gi,
        /system\s*\(/gi,
        /shell_exec/gi
      ];

      for (const pattern of serverScriptPatterns) {
        if (pattern.test(content)) {
          threats.push({
            type: 'malicious_file',
            severity: 'critical',
            details: `Server-side script pattern detected: ${pattern.toString()}`,
            blocked: true
          });
        }
      }

    } catch (error) {
      logger.warn('File content scanning failed', { error });
    }

    return threats;
  }

  /**
   * Validate file magic numbers (file headers)
   */
  private static validateMagicNumbers(file: any): SecurityThreat | null {
    if (!file.data || !Buffer.isBuffer(file.data)) {
      return null;
    }

    const buffer = file.data;
    const mimeType = file.mimetype;

    // Common magic numbers for validation
    const magicNumbers: Record<string, Buffer[]> = {
      'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
      'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47])],
      'image/gif': [Buffer.from('GIF87a'), Buffer.from('GIF89a')],
      'application/pdf': [Buffer.from('%PDF')],
      'image/webp': [Buffer.from('WEBP', 'ascii')],
    };

    const expectedHeaders = magicNumbers[mimeType];
    if (!expectedHeaders) {
      return null; // No validation available for this MIME type
    }

    const isValid = expectedHeaders.some(expectedHeader =>
      buffer.subarray(0, expectedHeader.length).equals(expectedHeader) ||
      (mimeType === 'image/webp' && buffer.subarray(8, 12).equals(expectedHeader))
    );

    if (!isValid) {
      return {
        type: 'malicious_file',
        severity: 'high',
        details: `File header doesn't match declared MIME type: ${mimeType}`,
        blocked: true
      };
    }

    return null;
  }

  /**
   * Record security threat
   */
  private static recordThreat(context: FileSecurityContext, threat: SecurityThreat): void {
    const key = context.userId || context.ipAddress;

    if (!FileSecurityMiddleware.suspiciousActivities.has(key)) {
      FileSecurityMiddleware.suspiciousActivities.set(key, []);
    }

    const activities = FileSecurityMiddleware.suspiciousActivities.get(key)!;
    activities.push(threat);

    // Keep only recent activities (last 24 hours)
    const dayInMs = 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - dayInMs;
    const recentActivities = activities.filter(activity =>
      activity.type !== 'rate_limit' || context.timestamp > cutoff
    );

    FileSecurityMiddleware.suspiciousActivities.set(key, recentActivities);

    // Auto-block for critical threats
    if (threat.severity === 'critical' && threat.blocked) {
      FileSecurityMiddleware.blockIP(context.ipAddress, threat.details);
    }
  }

  /**
   * Block IP address
   */
  private static blockIP(ipAddress: string, reason: string): void {
    FileSecurityMiddleware.blockedIPs.add(ipAddress);

    logger.error('IP address blocked due to security violation', {
      ipAddress,
      reason,
      timestamp: new Date().toISOString()
    });

    // Auto-unblock after 24 hours
    setTimeout(() => {
      FileSecurityMiddleware.blockedIPs.delete(ipAddress);
      logger.info('IP address auto-unblocked', { ipAddress });
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Log security event
   */
  private static logSecurityEvent(context: FileSecurityContext, threats: SecurityThreat[]): void {
    if (threats.length > 0) {
      const blockedThreats = threats.filter(t => t.blocked);
      const warningThreats = threats.filter(t => !t.blocked);

      if (blockedThreats.length > 0) {
        logger.error('File security threats detected and blocked', {
          context,
          blockedThreats,
          totalThreats: threats.length
        });
      } else if (warningThreats.length > 0) {
        logger.warn('File security warnings detected', {
          context,
          warningThreats,
          totalThreats: threats.length
        });
      }
    }
  }

  /**
   * Get security statistics
   */
  static getSecurityStats(): {
    blockedIPs: number;
    suspiciousActivities: number;
    activeRateLimits: number;
    totalThreats: number;
  } {
    const totalThreats = Array.from(FileSecurityMiddleware.suspiciousActivities.values())
      .reduce((sum, activities) => sum + activities.length, 0);

    return {
      blockedIPs: FileSecurityMiddleware.blockedIPs.size,
      suspiciousActivities: FileSecurityMiddleware.suspiciousActivities.size,
      activeRateLimits: FileSecurityMiddleware.userUploadCounts.size,
      totalThreats
    };
  }

  /**
   * Manually unblock IP
   */
  static unblockIP(ipAddress: string): boolean {
    return FileSecurityMiddleware.blockedIPs.delete(ipAddress);
  }

  /**
   * Clear user rate limit
   */
  static clearUserRateLimit(userId: string): boolean {
    return FileSecurityMiddleware.userUploadCounts.delete(userId);
  }
}