// COMPREHENSIVE PATH TRAVERSAL PROTECTION SERVICE
// Production-grade security for file operations

import * as path from 'path';
import * as fs from 'fs/promises';
import { config } from '../config/config';
import { logger } from '../utils/logger';

interface PathValidationResult {
  isValid: boolean;
  normalizedPath?: string;
  errors: string[];
  securityViolations: string[];
}

interface SecurityConfig {
  allowedDirectories: string[];
  blockedPatterns: RegExp[];
  maxPathLength: number;
  allowedFileExtensions: string[];
  blockedFileExtensions: string[];
  caseSensitive: boolean;
}

export class PathSecurityService {
  private static instance: PathSecurityService;
  private securityConfig: SecurityConfig;

  private constructor() {
    this.securityConfig = {
      // Only allow access to these base directories
      allowedDirectories: [
        path.resolve(config.UPLOAD_PATH || './uploads'),
        path.resolve('./public'),
        path.resolve('./temp'),
        path.resolve('./cache')
      ],

      // Blocked patterns that indicate potential attacks
      blockedPatterns: [
        /\.\./g, // Parent directory traversal
        /\/\.\./g, // Unix path traversal
        /\\\.\./g, // Windows path traversal
        /\0/g, // Null byte injection
        /[\x00-\x1f\x7f-\x9f]/g, // Control characters
        /[<>:"|?*]/g, // Invalid Windows filename characters
        /^\./g, // Hidden files (starting with dot)
        /\/$/g, // Paths ending with slash
        /\/\//g, // Double slashes
        /\\\\+/g, // Multiple backslashes
        /^\s|\s$/g, // Leading/trailing whitespace
        /[^a-zA-Z0-9._\-\/\\]/g, // Only allow safe characters
      ],

      maxPathLength: 260, // Windows MAX_PATH limit

      // Allowed file extensions (whitelist approach)
      allowedFileExtensions: [
        '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico',
        '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv',
        '.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac',
        '.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt',
        '.xls', '.xlsx', '.csv', '.ods',
        '.ppt', '.pptx', '.odp',
        '.zip', '.rar', '.7z', '.tar', '.gz',
        '.json', '.xml', '.yml', '.yaml', '.md'
      ],

      // Dangerous file extensions (blacklist)
      blockedFileExtensions: [
        '.exe', '.bat', '.cmd', '.com', '.scr', '.pif', '.vbs', '.js', '.jar',
        '.msi', '.dll', '.sh', '.ps1', '.php', '.asp', '.jsp', '.py', '.pl',
        '.rb', '.go', '.c', '.cpp', '.h', '.hpp', '.asm', '.s',
        '.htaccess', '.htpasswd', '.config', '.conf', '.ini'
      ],

      caseSensitive: process.platform !== 'win32'
    };
  }

  public static getInstance(): PathSecurityService {
    if (!PathSecurityService.instance) {
      PathSecurityService.instance = new PathSecurityService();
    }
    return PathSecurityService.instance;
  }

  /**
   * Comprehensive path validation and sanitization
   */
  public validatePath(inputPath: string, baseDirectory?: string): PathValidationResult {
    const errors: string[] = [];
    const securityViolations: string[] = [];

    // Basic validation
    if (!inputPath || typeof inputPath !== 'string') {
      errors.push('Path must be a non-empty string');
      return { isValid: false, errors, securityViolations };
    }

    // Length validation
    if (inputPath.length > this.securityConfig.maxPathLength) {
      errors.push(`Path exceeds maximum length of ${this.securityConfig.maxPathLength} characters`);
      securityViolations.push('EXCESSIVE_PATH_LENGTH');
    }

    // Check for malicious patterns
    for (const pattern of this.securityConfig.blockedPatterns) {
      if (pattern.test(inputPath)) {
        securityViolations.push(`BLOCKED_PATTERN: ${pattern.toString()}`);
        errors.push(`Path contains blocked pattern: ${pattern.toString()}`);
      }
    }

    // Normalize the path
    let normalizedPath: string;
    try {
      normalizedPath = path.normalize(inputPath);
    } catch (error) {
      errors.push('Failed to normalize path');
      securityViolations.push('PATH_NORMALIZATION_FAILED');
      return { isValid: false, errors, securityViolations };
    }

    // Additional normalization checks
    if (normalizedPath !== inputPath) {
      logger.warn('Path was modified during normalization', {
        original: inputPath,
        normalized: normalizedPath
      });
    }

    // Resolve against base directory
    const targetBaseDir = baseDirectory || this.securityConfig.allowedDirectories[0];
    let resolvedPath: string;

    try {
      resolvedPath = path.resolve(targetBaseDir, normalizedPath);
    } catch (error) {
      errors.push('Failed to resolve path');
      securityViolations.push('PATH_RESOLUTION_FAILED');
      return { isValid: false, errors, securityViolations };
    }

    // Check if resolved path is within allowed directories
    const isWithinAllowedDirectory = this.securityConfig.allowedDirectories.some(allowedDir => {
      const resolvedAllowedDir = path.resolve(allowedDir);
      return resolvedPath.startsWith(resolvedAllowedDir + path.sep) || resolvedPath === resolvedAllowedDir;
    });

    if (!isWithinAllowedDirectory) {
      securityViolations.push('PATH_TRAVERSAL_ATTEMPT');
      errors.push('Path attempts to access unauthorized directory');
    }

    // File extension validation
    const fileExtension = path.extname(normalizedPath).toLowerCase();

    if (fileExtension && this.securityConfig.blockedFileExtensions.includes(fileExtension)) {
      securityViolations.push(`DANGEROUS_FILE_EXTENSION: ${fileExtension}`);
      errors.push(`File extension ${fileExtension} is not allowed`);
    }

    if (fileExtension && !this.securityConfig.allowedFileExtensions.includes(fileExtension)) {
      errors.push(`File extension ${fileExtension} is not in whitelist`);
    }

    // Additional security checks
    this.performAdvancedSecurityChecks(resolvedPath, errors, securityViolations);

    const isValid = errors.length === 0 && securityViolations.length === 0;

    // Log security violations
    if (securityViolations.length > 0) {
      logger.error('Path security violations detected', {
        inputPath,
        normalizedPath,
        resolvedPath,
        violations: securityViolations,
        errors
      });
    }

    return {
      isValid,
      normalizedPath: isValid ? resolvedPath : undefined,
      errors,
      securityViolations
    };
  }

  /**
   * Safe file access with comprehensive validation
   */
  public async safeFileAccess(filePath: string, operation: 'read' | 'write' | 'delete' = 'read'): Promise<{
    success: boolean;
    path?: string;
    error?: string;
    securityViolations?: string[];
  }> {
    const validation = this.validatePath(filePath);

    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', '),
        securityViolations: validation.securityViolations
      };
    }

    const safePath = validation.normalizedPath!;

    try {
      // Check if file exists and is accessible
      const stats = await fs.stat(safePath);

      // Additional checks for the operation
      switch (operation) {
        case 'read':
          // Verify it's a file and readable
          if (!stats.isFile()) {
            return { success: false, error: 'Path is not a file' };
          }
          break;

        case 'write':
          // Ensure parent directory exists
          const parentDir = path.dirname(safePath);
          await fs.mkdir(parentDir, { recursive: true });
          break;

        case 'delete':
          // Verify file exists and is deletable
          if (!stats.isFile()) {
            return { success: false, error: 'Path is not a file' };
          }
          break;
      }

      return { success: true, path: safePath };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Don't expose detailed file system errors to prevent information disclosure
      if (operation === 'read' && errorMessage.includes('ENOENT')) {
        return { success: false, error: 'File not found' };
      }

      return { success: false, error: 'File access failed' };
    }
  }

  /**
   * Create secure filename from user input
   */
  public createSecureFilename(originalFilename: string, preserveExtension: boolean = true): string {
    if (!originalFilename) {
      return `secure_file_${Date.now()}.bin`;
    }

    // Extract extension if preserving
    const extension = preserveExtension ? path.extname(originalFilename) : '';
    const nameWithoutExtension = preserveExtension
      ? path.basename(originalFilename, extension)
      : originalFilename;

    // Sanitize filename
    let secureName = nameWithoutExtension
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe characters
      .replace(/_{2,}/g, '_') // Collapse multiple underscores
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .substring(0, 100); // Limit length

    // Ensure name is not empty
    if (!secureName) {
      secureName = `file_${Date.now()}`;
    }

    // Validate and sanitize extension
    let secureExtension = '';
    if (extension) {
      const cleanExtension = extension.toLowerCase().replace(/[^a-z0-9.]/g, '');
      if (this.securityConfig.allowedFileExtensions.includes(cleanExtension)) {
        secureExtension = cleanExtension;
      }
    }

    return secureName + secureExtension;
  }

  /**
   * Generate secure unique filename with timestamp
   */
  public generateSecureFilename(originalFilename?: string): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);

    if (originalFilename) {
      const extension = path.extname(originalFilename);
      const secureExtension = this.securityConfig.allowedFileExtensions.includes(extension.toLowerCase())
        ? extension
        : '.bin';
      return `${timestamp}_${randomSuffix}${secureExtension}`;
    }

    return `${timestamp}_${randomSuffix}.bin`;
  }

  /**
   * Check if path exists safely
   */
  public async pathExists(filePath: string): Promise<boolean> {
    const validation = this.validatePath(filePath);
    if (!validation.isValid) {
      return false;
    }

    try {
      await fs.access(validation.normalizedPath!);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file information safely
   */
  public async getFileInfo(filePath: string): Promise<{
    success: boolean;
    info?: {
      size: number;
      isFile: boolean;
      isDirectory: boolean;
      modified: Date;
      created: Date;
    };
    error?: string;
  }> {
    const access = await this.safeFileAccess(filePath, 'read');
    if (!access.success) {
      return { success: false, error: access.error };
    }

    try {
      const stats = await fs.stat(access.path!);
      return {
        success: true,
        info: {
          size: stats.size,
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
          modified: stats.mtime,
          created: stats.birthtime
        }
      };
    } catch (error) {
      return { success: false, error: 'Failed to get file information' };
    }
  }

  /**
   * Advanced security checks
   */
  private performAdvancedSecurityChecks(resolvedPath: string, errors: string[], securityViolations: string[]): void {
    // Check for symbolic link attacks
    if (resolvedPath.includes('..')) {
      securityViolations.push('POTENTIAL_SYMLINK_ATTACK');
      errors.push('Path contains potentially dangerous traversal patterns');
    }

    // Check for Windows reserved names
    const filename = path.basename(resolvedPath);
    const windowsReservedNames = [
      'CON', 'PRN', 'AUX', 'NUL',
      'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
      'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
    ];

    if (windowsReservedNames.includes(filename.toUpperCase())) {
      securityViolations.push('WINDOWS_RESERVED_NAME');
      errors.push('Filename uses Windows reserved name');
    }

    // Check for excessively long filename
    if (filename.length > 255) {
      securityViolations.push('EXCESSIVE_FILENAME_LENGTH');
      errors.push('Filename exceeds maximum length');
    }

    // Check for Unicode normalization attacks
    if (filename !== filename.normalize('NFC')) {
      securityViolations.push('UNICODE_NORMALIZATION_ISSUE');
      errors.push('Filename contains potentially dangerous Unicode characters');
    }
  }

  /**
   * Update security configuration
   */
  public updateSecurityConfig(updates: Partial<SecurityConfig>): void {
    this.securityConfig = { ...this.securityConfig, ...updates };
    logger.info('Path security configuration updated', { updates });
  }

  /**
   * Get current security configuration
   */
  public getSecurityConfig(): SecurityConfig {
    return { ...this.securityConfig };
  }
}

// Export singleton instance
export const pathSecurity = PathSecurityService.getInstance();