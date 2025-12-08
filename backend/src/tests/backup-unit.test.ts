/**
 * Unit tests for Backup Service - Individual Function Testing
 * Tests backup creation, restoration, and file management without setup.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock all dependencies before importing the service
vi.mock('fs/promises', () => ({
  mkdir: vi.fn(),
  writeFile: vi.fn(),
  readFile: vi.fn(),
  readdir: vi.fn(),
  unlink: vi.fn(),
  stat: vi.fn()
}));

vi.mock('fs', () => ({
  createReadStream: vi.fn(),
  createWriteStream: vi.fn(),
  existsSync: vi.fn()
}));

vi.mock('child_process', () => ({
  spawn: vi.fn()
}));

vi.mock('zlib', () => ({
  createGzip: vi.fn(),
  createGunzip: vi.fn()
}));

vi.mock('stream/promises', () => ({
  pipeline: vi.fn()
}));

vi.mock('node-cron', () => ({
  schedule: vi.fn()
}));

vi.mock('../config/config', () => ({
  dbConfig: {
    host: 'localhost',
    port: _3306,
    user: 'testuser',
    password: 'testpass',
    database: 'testdb'
  },
  config: {
    environment: 'test'
  }
}));

vi.mock('../db/connection', () => ({
  connectDatabase: vi.fn().mockResolvedValue(undefined),
  testConnection: vi.fn().mockResolvedValue(true),
  checkDatabaseHealth: vi.fn().mockResolvedValue({ status: 'healthy', uptime: 1000 }),
  disconnectDatabase: vi.fn().mockResolvedValue(undefined),
  reconnectDatabase: vi.fn().mockResolvedValue(true),
  getPoolStats: vi.fn().mockReturnValue({ activeConnections: 0, totalConnections: 10 })
}));

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

// Import the service after mocking
import { backupService } from '../services/backup.service';
import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import { createReadStream, createWriteStream, existsSync } from 'fs';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import * as cron from 'node-cron';

describe('Backup Service - Unit Tests', () => {
  let mockSpawn: any;
  let mockFs: any;
  let mockZlib: any;
  let mockPipeline: any;
  let mockCron: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSpawn = vi.mocked(spawn);
    mockFs = vi.mocked(fs);
    mockZlib = vi.mocked(createGzip);
    mockPipeline = vi.mocked(pipeline);
    mockCron = vi.mocked(cron);
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(backupService).toBeDefined();
    });

    it('should have required methods', () => {
      expect(typeof backupService.initialize).toBe('function');
      expect(typeof backupService.createBackup).toBe('function');
      expect(typeof backupService.restoreBackup).toBe('function');
      expect(typeof backupService.listBackups).toBe('function');
      expect(typeof backupService.deleteBackup).toBe('function');
      expect(typeof backupService.getJobStatus).toBe('function');
      expect(typeof backupService.getBackupStats).toBe('function');
      expect(typeof backupService.shutdown).toBe('function');
    });
  });

  describe('createBackup', () => {
    it('should create a full backup successfully', async () => {
      // Mock successful mysqldump process
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        })
      };
      mockSpawn.mockReturnValue(mockProcess);
      
      // Mock file system operations
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.stat.mockResolvedValue({ size: 1024 });
      
      const result = await backupService.createBackup('test-backup', { full: true });
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockSpawn).toHaveBeenCalledWith('mysqldump', expect.any(Array), expect.any(Object));
    });

    it('should handle database connection failure', async () => {
      // Mock failed mysqldump process
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(1), 10);
          }
        })
      };
      mockSpawn.mockReturnValue(mockProcess);
      
      const result = await backupService.createBackup('test-backup', { full: true });
      
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toContain('mysqldump failed');
    });

    it('should prevent concurrent backup operations', async () => {
      // Start first backup
      const mockProcess1 = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 100);
          }
        })
      };
      mockSpawn.mockReturnValue(mockProcess1);
      
      const backup1 = backupService.createBackup('backup1', { full: true });
      
      // Try to start second backup immediately
      const backup2 = backupService.createBackup('backup2', { full: true });
      
      const [result1, result2] = await Promise.all([backup1, backup2]);
      
      // One should succeed, one should fail due to concurrency
      const successCount = [result1, result2].filter(r => r.success).length;
      const failureCount = [result1, result2].filter(r => !r.success).length;
      
      expect(successCount).toBe(1);
      expect(failureCount).toBe(1);
    });
  });

  describe('restoreBackup', () => {
    it('should restore backup successfully', async () => {
      // Mock file existence
      existsSync.mockReturnValue(true);
      
      // Mock successful mysql restore process
      const mockProcess = {
        stdin: { write: vi.fn(), end: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        })
      };
      mockSpawn.mockReturnValue(mockProcess);
      
      // Mock file stream
      const mockReadStream = { pipe: vi.fn() };
      createReadStream.mockReturnValue(mockReadStream);
      
      const result = await backupService.restoreBackup('test-backup', { dryRun: false });
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockSpawn).toHaveBeenCalledWith('mysql', expect.any(Array), expect.any(Object));
    });

    it('should handle backup not found', async () => {
      existsSync.mockReturnValue(false);
      
      const result = await backupService.restoreBackup('nonexistent-backup', { dryRun: false });
      
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Backup file not found');
    });

    it('should perform dry run validation', async () => {
      existsSync.mockReturnValue(true);
      
      const result = await backupService.restoreBackup('test-backup', { dryRun: true });
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.dryRun).toBe(true);
    });
  });

  describe('listBackups', () => {
    it('should list all backups sorted by timestamp', async () => {
      const mockFiles = [
        { name: 'backup-2024-01-15.sql', isFile: () => true },
        { name: 'backup-2024-01-14.sql', isFile: () => true },
        { name: 'backup-2024-01-13.sql', isFile: () => true }
      ];
      
      mockFs.readdir.mockResolvedValue(mockFiles);
      mockFs.stat.mockResolvedValue({ 
        mtime: new Date('2024-01-15'),
        size: 1024 
      });
      
      const result = await backupService.listBackups();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      expect(mockFs.readdir).toHaveBeenCalled();
    });

    it('should limit number of backups returned', async () => {
      const mockFiles = Array.from({ length: 10 }, (_, i) => ({
        name: `backup-${i}.sql`,
        isFile: () => true
      }));
      
      mockFs.readdir.mockResolvedValue(mockFiles);
      mockFs.stat.mockResolvedValue({ 
        mtime: new Date(),
        size: 1024 
      });
      
      const result = await backupService.listBackups({ limit: 5 });
      
      expect(result).toBeDefined();
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should handle directory read errors', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Directory not found'));
      
      const result = await backupService.listBackups();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('deleteBackup', () => {
    it('should delete backup and all associated files', async () => {
      existsSync.mockReturnValue(true);
      mockFs.unlink.mockResolvedValue(undefined);
      
      const result = await backupService.deleteBackup('test-backup');
      
      expect(result).toBe(true);
      expect(mockFs.unlink).toHaveBeenCalled();
    });

    it('should return false for non-existent backup', async () => {
      existsSync.mockReturnValue(false);
      
      const result = await backupService.deleteBackup('nonexistent-backup');
      
      expect(result).toBe(false);
      expect(mockFs.unlink).not.toHaveBeenCalled();
    });

    it('should handle deletion errors gracefully', async () => {
      existsSync.mockReturnValue(true);
      mockFs.unlink.mockRejectedValue(new Error('Permission denied'));
      
      const result = await backupService.deleteBackup('test-backup');
      
      expect(result).toBe(false);
    });
  });

  describe('getBackupStats', () => {
    it('should return comprehensive backup statistics', async () => {
      const mockFiles = [
        { name: 'backup-1.sql', isFile: () => true },
        { name: 'backup-2.sql', isFile: () => true }
      ];
      
      mockFs.readdir.mockResolvedValue(mockFiles);
      mockFs.stat.mockResolvedValue({ 
        mtime: new Date(),
        size: 2048 
      });
      
      const result = await backupService.getBackupStats();
      
      expect(result).toBeDefined();
      expect(result.totalBackups).toBe(2);
      expect(result.totalSize).toBe(4096); // 2 * 2048
      expect(result.lastBackup).toBeDefined();
    });

    it('should handle empty backup list', async () => {
      mockFs.readdir.mockResolvedValue([]);
      
      const result = await backupService.getBackupStats();
      
      expect(result).toBeDefined();
      expect(result.totalBackups).toBe(0);
      expect(result.totalSize).toBe(0);
      expect(result.lastBackup).toBeNull();
    });
  });

  describe('getJobStatus', () => {
    it('should return job status for existing job', async () => {
      // Start a backup job
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 100);
          }
        })
      };
      mockSpawn.mockReturnValue(mockProcess);
      
      const backupPromise = backupService.createBackup('test-backup', { full: true });
      
      // Check status while job is running
      const status = backupService.getJobStatus('test-backup');
      
      expect(status).toBeDefined();
      expect(status?.status).toBe('running');
      
      await backupPromise;
    });

    it('should return null for non-existent job', async () => {
      const status = backupService.getJobStatus('nonexistent-job');
      
      expect(status).toBeNull();
    });
  });

  describe('shutdown', () => {
    it('should shutdown gracefully', async () => {
      const result = await backupService.shutdown();
      
      expect(result).toBe(true);
    });

    it('should wait for running jobs to complete', async () => {
      // Start a backup job
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 50);
          }
        })
      };
      mockSpawn.mockReturnValue(mockProcess);
      
      const backupPromise = backupService.createBackup('test-backup', { full: true });
      
      // Shutdown while job is running
      const shutdownPromise = backupService.shutdown();
      
      const [backupResult, shutdownResult] = await Promise.all([backupPromise, shutdownPromise]);
      
      expect(backupResult.success).toBe(true);
      expect(shutdownResult).toBe(true);
    });
  });
});
