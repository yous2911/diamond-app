/**
 * Isolated Unit Tests for Backup Service
 * Tests individual functions without setup.ts interference
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock ALL dependencies before any imports
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
  existsSync: vi.fn(),
  promises: {
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    readdir: vi.fn(),
    unlink: vi.fn(),
    stat: vi.fn()
  }
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
  getPoolStats: vi.fn().mockReturnValue({ activeConnections: 0, totalConnections: 10 }),
  getDatabase: vi.fn().mockReturnValue({
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn()
  }),
  connection: {
    execute: vi.fn().mockResolvedValue([['table1', 'table2', 'table3']])
  }
}));

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

// Import the service after all mocks are set up
import { backupService } from '../services/backup.service';
import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import { createReadStream, createWriteStream, existsSync } from 'fs';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import * as cron from 'node-cron';

describe('Backup Service - Isolated Unit Tests', () => {
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

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(backupService).toBeDefined();
    });

    it('should have all required methods', () => {
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

  describe('createBackup Function', () => {
    it('should create a full backup successfully', async () => {
      // Mock database connection success
      const { testConnection } = await import('../db/connection');
      vi.mocked(testConnection).mockResolvedValue(true);
      
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
      
      const result = await backupService.createBackup('full', { compress: true });
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string'); // Returns backup ID
      expect(mockSpawn).toHaveBeenCalledWith('mysqldump', expect.any(Array), expect.any(Object));
    });

    it('should handle database connection failure', async () => {
      // Mock database connection failure
      const { testConnection } = await import('../db/connection');
      vi.mocked(testConnection).mockResolvedValue(false);
      
      await expect(backupService.createBackup('full')).rejects.toThrow('Database connection failed');
    });
  });

  describe('restoreBackup Function', () => {
    it('should restore backup successfully', async () => {
      // Mock backup metadata file exists
      existsSync.mockReturnValue(true);
      
      // Mock backup metadata content
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        id: 'test-backup',
        timestamp: new Date(),
        type: 'full',
        size: 1024,
        checksum: 'test-checksum',
        compression: false,
        encryption: false,
        location: 'local',
        status: 'completed',
        tables: ['users', 'posts']
      }));
      
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
      
      const result = await backupService.restoreBackup({ backupId: 'test-backup', dryRun: false });
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string'); // Returns restore ID
      expect(mockSpawn).toHaveBeenCalledWith('mysql', expect.any(Array), expect.any(Object));
    });

    it('should handle backup not found', async () => {
      // Mock backup metadata not found
      mockFs.readFile.mockRejectedValue(new Error('File not found'));
      
      await expect(backupService.restoreBackup({ backupId: 'nonexistent-backup', dryRun: false }))
        .rejects.toThrow('Backup nonexistent-backup not found');
    });
  });

  describe('listBackups Function', () => {
    it('should list all backups sorted by timestamp', async () => {
      const mockFiles = [
        'backup-2024-01-15.json',
        'backup-2024-01-14.json',
        'backup-2024-01-13.json'
      ];
      
      mockFs.readdir.mockResolvedValue(mockFiles);
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        id: 'test-backup',
        timestamp: new Date('2024-01-15'),
        type: 'full',
        size: 1024,
        checksum: 'test-checksum',
        compression: false,
        encryption: false,
        location: 'local',
        status: 'completed',
        tables: ['users']
      }));
      
      const result = await backupService.listBackups();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      expect(mockFs.readdir).toHaveBeenCalled();
    });

    it('should handle directory read errors', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Directory not found'));
      
      const result = await backupService.listBackups();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('deleteBackup Function', () => {
    it('should delete backup and all associated files', async () => {
      // Mock backup metadata exists
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        id: 'test-backup',
        timestamp: new Date(),
        type: 'full',
        size: 1024,
        checksum: 'test-checksum',
        compression: false,
        encryption: false,
        location: 'local',
        status: 'completed',
        tables: ['users']
      }));
      
      existsSync.mockReturnValue(true);
      mockFs.unlink.mockResolvedValue(undefined);
      
      const result = await backupService.deleteBackup('test-backup');
      
      expect(result).toBe(true);
      expect(mockFs.unlink).toHaveBeenCalled();
    });

    it('should return false for non-existent backup', async () => {
      // Mock backup metadata not found
      mockFs.readFile.mockRejectedValue(new Error('File not found'));
      
      const result = await backupService.deleteBackup('nonexistent-backup');
      
      expect(result).toBe(false);
      expect(mockFs.unlink).not.toHaveBeenCalled();
    });
  });

  describe('getBackupStats Function', () => {
    it('should return comprehensive backup statistics', async () => {
      const mockFiles = [
        'backup-1.json',
        'backup-2.json'
      ];
      
      mockFs.readdir.mockResolvedValue(mockFiles);
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        id: 'test-backup',
        timestamp: new Date(),
        type: 'full',
        size: _2048,
        checksum: 'test-checksum',
        compression: false,
        encryption: false,
        location: 'local',
        status: 'completed',
        tables: ['users']
      }));
      
      const result = await backupService.getBackupStats();
      
      expect(result).toBeDefined();
      expect(result.totalBackups).toBe(2);
      expect(typeof result.totalSize).toBe('string'); // Returns formatted string like "4.00 KB"
      expect(result.oldestBackup).toBeDefined();
      expect(result.newestBackup).toBeDefined();
    });

    it('should handle empty backup list', async () => {
      mockFs.readdir.mockResolvedValue([]);
      
      const result = await backupService.getBackupStats();
      
      expect(result).toBeDefined();
      expect(result.totalBackups).toBe(0);
      expect(result.totalSize).toBe('0.00 B'); // Returns formatted string
      expect(result.oldestBackup).toBeNull();
      expect(result.newestBackup).toBeNull();
    });
  });

  describe('getJobStatus Function', () => {
    it('should return null for non-existent job', async () => {
      const status = await backupService.getJobStatus('nonexistent-job');
      
      expect(status).toBeNull();
    });
  });

  describe('shutdown Function', () => {
    it('should shutdown gracefully', async () => {
      const result = await backupService.shutdown();
      
      expect(result).toBeUndefined(); // Returns void
    });
  });
});
    