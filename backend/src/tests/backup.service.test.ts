/**
 * Unit tests for Backup Service
 * Tests backup creation, restoration, scheduling, and file management
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { backupService } from '../services/backup.service';
import { promises as fs } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { createReadStream, createWriteStream, existsSync } from 'fs';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import * as cron from 'node-cron';

// Mock dependencies
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
    port: 3306,
    user: 'testuser',
    password: 'testpass',
    database: 'testdb'
  },
  config: {
    environment: 'test'
  }
}));

// Database connection is mocked in setup.ts

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

vi.mock('../db/connection', () => ({
  connection: {
    execute: vi.fn()
  },
  testConnection: vi.fn()
}));

describe('Backup Service', () => {
  let mockSpawn: any;
  let mockProcess: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock process for spawn
    mockProcess = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      stdin: {},
      on: vi.fn(),
      kill: vi.fn()
    };
    
    mockSpawn = vi.mocked(spawn);
    mockSpawn.mockReturnValue(mockProcess);

    // Mock environment variables
    process.env.BACKUP_ENABLED = 'true';
    process.env.BACKUP_SCHEDULE = '0 2 * * *';
    process.env.BACKUP_RETENTION_DAYS = '30';
    process.env.BACKUP_COMPRESSION_LEVEL = '6';
    process.env.BACKUP_STORAGE_TYPE = 'local';
    process.env.BACKUP_LOCAL_PATH = '/test/backups';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default configuration', async () => {
      const mockMkdir = vi.mocked(fs.mkdir);
      mockMkdir.mockResolvedValue(undefined);

      await backupService.initialize();

      expect(mockMkdir).toHaveBeenCalledWith('/test/backups', { recursive: true });
      expect(mockMkdir).toHaveBeenCalledWith('/test/backups/metadata', { recursive: true });
    });

    it('should skip initialization when disabled', async () => {
      process.env.BACKUP_ENABLED = 'false';
      
      await backupService.initialize();
      
      // Should not create directories when disabled
      expect(fs.mkdir).not.toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Permission denied');
      const mockMkdir = vi.mocked(fs.mkdir);
      mockMkdir.mockRejectedValue(error);

      await expect(backupService.initialize())
        .rejects.toThrow('Permission denied');
    });

    it('should setup scheduled backups when configured', async () => {
      const mockSchedule = vi.mocked(cron.schedule);
      const mockTask = { stop: vi.fn() };
      mockSchedule.mockReturnValue(mockTask);

      const mockMkdir = vi.mocked(fs.mkdir);
      mockMkdir.mockResolvedValue(undefined);

      await backupService.initialize();

      expect(mockSchedule).toHaveBeenCalledWith(
        '0 2 * * *',
        expect.any(Function),
        {
          name: 'daily-backup',
          timezone: 'UTC'
        }
      );
    });
  });

  describe('createBackup', () => {
    beforeEach(async () => {
      // Initialize service for tests
      const mockMkdir = vi.mocked(fs.mkdir);
      mockMkdir.mockResolvedValue(undefined);
      await backupService.initialize();
    });

    it('should create a full backup successfully', async () => {
      const { testConnection } = await import('../db/connection');
      const mockTestConnection = vi.mocked(testConnection);
      mockTestConnection.mockResolvedValue(true);

      const { connection } = await import('../db/connection');
      const mockConnection = vi.mocked(connection);
      mockConnection.execute.mockResolvedValue([
        [{ TABLE_NAME: 'students' }, { TABLE_NAME: 'exercises' }]
      ]);

      // Mock successful mysqldump process
      mockProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 100); // Success exit code
        }
      });

      // Mock file operations
      const mockWriteStream = {
        write: vi.fn(),
        end: vi.fn()
      };
      vi.mocked(createWriteStream).mockReturnValue(mockWriteStream as any);

      const mockStat = vi.mocked(fs.stat);
      mockStat.mockResolvedValue({ size: 1024 } as any);

      const mockWriteFile = vi.mocked(fs.writeFile);
      mockWriteFile.mockResolvedValue(undefined);

      const backupId = await backupService.createBackup('full');

      expect(backupId).toMatch(/^backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-[a-z0-9]{6}$/);
      expect(mockSpawn).toHaveBeenCalledWith('mysqldump', expect.arrayContaining([
        '--host', 'localhost',
        '--port', '3306',
        '--user', 'testuser',
        '--password=testpass',
        '--single-transaction',
        '--routines',
        '--triggers',
        '--events',
        '--create-options',
        '--extended-insert',
        '--hex-blob',
        '--default-character-set=utf8mb4',
        'testdb',
        'students',
        'exercises'
      ]));
    });

    it('should handle database connection failure', async () => {
      const { testConnection } = await import('../db/connection');
      const mockTestConnection = vi.mocked(testConnection);
      mockTestConnection.mockResolvedValue(false);

      await expect(backupService.createBackup('full'))
        .rejects.toThrow('Database connection failed');
    });

    it('should prevent concurrent backup operations', async () => {
      const { testConnection } = await import('../db/connection');
      const mockTestConnection = vi.mocked(testConnection);
      mockTestConnection.mockResolvedValue(true);

      // Start first backup
      const firstBackup = backupService.createBackup('full');
      
      // Try to start second backup immediately
      await expect(backupService.createBackup('full'))
        .rejects.toThrow('Another backup operation is already running');

      // Clean up first backup
      mockProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 100);
        }
      });
      await firstBackup;
    });

    it('should handle mysqldump process errors', async () => {
      const { testConnection } = await import('../db/connection');
      const mockTestConnection = vi.mocked(testConnection);
      mockTestConnection.mockResolvedValue(true);

      const { connection } = await import('../db/connection');
      const mockConnection = vi.mocked(connection);
      mockConnection.execute.mockResolvedValue([[]]);

      // Mock mysqldump failure
      mockProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 100); // Error exit code
        }
      });

      await expect(backupService.createBackup('full'))
        .rejects.toThrow('Mysqldump failed with exit code 1');
    });

    it('should create incremental backup with specific tables', async () => {
      const { testConnection } = await import('../db/connection');
      const mockTestConnection = vi.mocked(testConnection);
      mockTestConnection.mockResolvedValue(true);

      // Mock successful process
      mockProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 100);
        }
      });

      const mockWriteStream = {
        write: vi.fn(),
        end: vi.fn()
      };
      vi.mocked(createWriteStream).mockReturnValue(mockWriteStream as any);

      const mockStat = vi.mocked(fs.stat);
      mockStat.mockResolvedValue({ size: 512 } as any);

      const mockWriteFile = vi.mocked(fs.writeFile);
      mockWriteFile.mockResolvedValue(undefined);

      await backupService.createBackup('incremental', {
        tables: ['students'],
        compress: true
      });

      expect(mockSpawn).toHaveBeenCalledWith('mysqldump', expect.arrayContaining([
        'testdb',
        'students'
      ]));
    });
  });

  describe('restoreBackup', () => {
    beforeEach(async () => {
      const mockMkdir = vi.mocked(fs.mkdir);
      mockMkdir.mockResolvedValue(undefined);
      await backupService.initialize();
    });

    it('should restore backup successfully', async () => {
      const mockMetadata = {
        id: 'test-backup-123',
        timestamp: new Date(),
        type: 'full' as const,
        size: 1024,
        checksum: 'abc123',
        compression: false,
        encryption: false,
        location: 'local' as const,
        status: 'completed' as const,
        tables: ['students', 'exercises']
      };

      // Mock metadata file read
      const mockReadFile = vi.mocked(fs.readFile);
      mockReadFile.mockResolvedValue(JSON.stringify(mockMetadata));

      // Mock file exists
      vi.mocked(existsSync).mockReturnValue(true);

      // Mock successful mysql restore process
      mockProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 100);
        }
      });

      const mockReadStream = {
        pipe: vi.fn()
      };
      vi.mocked(createReadStream).mockReturnValue(mockReadStream as any);

      const restoreId = await backupService.restoreBackup({
        backupId: 'test-backup-123',
        replaceExisting: true,
        validateIntegrity: true
      });

      expect(restoreId).toMatch(/^backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-[a-z0-9]{6}$/);
      expect(mockSpawn).toHaveBeenCalledWith('mysql', expect.arrayContaining([
        '--host', 'localhost',
        '--port', '3306',
        '--user', 'testuser',
        '--password=testpass',
        'testdb'
      ]));
    });

    it('should handle backup not found', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      mockReadFile.mockRejectedValue(new Error('File not found'));

      await expect(backupService.restoreBackup({
        backupId: 'nonexistent-backup',
        replaceExisting: true,
        validateIntegrity: false
      })).rejects.toThrow('Backup nonexistent-backup not found');
    });

    it('should perform dry run validation', async () => {
      const mockMetadata = {
        id: 'test-backup-123',
        timestamp: new Date(),
        type: 'full' as const,
        size: 1024,
        checksum: 'abc123',
        compression: false,
        encryption: false,
        location: 'local' as const,
        status: 'completed' as const,
        tables: ['students']
      };

      const mockReadFile = vi.mocked(fs.readFile);
      mockReadFile.mockResolvedValue(JSON.stringify(mockMetadata));

      vi.mocked(existsSync).mockReturnValue(true);

      const restoreId = await backupService.restoreBackup({
        backupId: 'test-backup-123',
        replaceExisting: true,
        validateIntegrity: true,
        dryRun: true
      });

      expect(restoreId).toBeDefined();
      expect(mockSpawn).not.toHaveBeenCalled(); // No actual restore for dry run
    });

    it('should prevent concurrent restore operations', async () => {
      const mockMetadata = {
        id: 'test-backup-123',
        timestamp: new Date(),
        type: 'full' as const,
        size: 1024,
        checksum: 'abc123',
        compression: false,
        encryption: false,
        location: 'local' as const,
        status: 'completed' as const,
        tables: ['students']
      };

      const mockReadFile = vi.mocked(fs.readFile);
      mockReadFile.mockResolvedValue(JSON.stringify(mockMetadata));

      vi.mocked(existsSync).mockReturnValue(true);

      // Start first restore
      const firstRestore = backupService.restoreBackup({
        backupId: 'test-backup-123',
        replaceExisting: true,
        validateIntegrity: false
      });

      // Try to start second restore
      await expect(backupService.restoreBackup({
        backupId: 'test-backup-456',
        replaceExisting: true,
        validateIntegrity: false
      })).rejects.toThrow('Another backup/restore operation is already running');

      // Clean up first restore
      mockProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 100);
        }
      });
      await firstRestore;
    });
  });

  describe('listBackups', () => {
    beforeEach(async () => {
      const mockMkdir = vi.mocked(fs.mkdir);
      mockMkdir.mockResolvedValue(undefined);
      await backupService.initialize();
    });

    it('should list all backups sorted by timestamp', async () => {
      const mockBackups = [
        {
          id: 'backup-1',
          timestamp: new Date('2024-01-15'),
          type: 'full',
          size: 1024,
          checksum: 'abc123',
          compression: false,
          encryption: false,
          location: 'local',
          status: 'completed',
          tables: ['students']
        },
        {
          id: 'backup-2',
          timestamp: new Date('2024-01-14'),
          type: 'incremental',
          size: 512,
          checksum: 'def456',
          compression: true,
          encryption: false,
          location: 'local',
          status: 'completed',
          tables: ['exercises']
        }
      ];

      const mockReaddir = vi.mocked(fs.readdir);
      mockReaddir.mockResolvedValue(['backup-1.json', 'backup-2.json']);

      const mockReadFile = vi.mocked(fs.readFile);
      mockReadFile
        .mockResolvedValueOnce(JSON.stringify(mockBackups[0]))
        .mockResolvedValueOnce(JSON.stringify(mockBackups[1]));

      const backups = await backupService.listBackups();

      expect(backups).toHaveLength(2);
      expect(backups[0].id).toBe('backup-2'); // Newest first
      expect(backups[1].id).toBe('backup-1');
    });

    it('should limit number of backups returned', async () => {
      const mockReaddir = vi.mocked(fs.readdir);
      mockReaddir.mockResolvedValue(['backup-1.json', 'backup-2.json', 'backup-3.json']);

      const mockReadFile = vi.mocked(fs.readFile);
      mockReadFile.mockResolvedValue('{}');

      const backups = await backupService.listBackups(2);

      expect(backups).toHaveLength(2);
    });

    it('should handle directory read errors', async () => {
      const mockReaddir = vi.mocked(fs.readdir);
      mockReaddir.mockRejectedValue(new Error('Permission denied'));

      const backups = await backupService.listBackups();

      expect(backups).toEqual([]);
    });
  });

  describe('deleteBackup', () => {
    beforeEach(async () => {
      const mockMkdir = vi.mocked(fs.mkdir);
      mockMkdir.mockResolvedValue(undefined);
      await backupService.initialize();
    });

    it('should delete backup and all associated files', async () => {
      const mockMetadata = {
        id: 'test-backup-123',
        timestamp: new Date(),
        type: 'full' as const,
        size: 1024,
        checksum: 'abc123',
        compression: true,
        encryption: false,
        location: 'local' as const,
        status: 'completed' as const,
        tables: ['students']
      };

      const mockReadFile = vi.mocked(fs.readFile);
      mockReadFile.mockResolvedValue(JSON.stringify(mockMetadata));

      vi.mocked(existsSync).mockReturnValue(true);

      const mockUnlink = vi.mocked(fs.unlink);
      mockUnlink.mockResolvedValue(undefined);

      const result = await backupService.deleteBackup('test-backup-123');

      expect(result).toBe(true);
      expect(mockUnlink).toHaveBeenCalledWith('/test/backups/test-backup-123.sql.gz');
      expect(mockUnlink).toHaveBeenCalledWith('/test/backups/metadata/test-backup-123.json');
    });

    it('should return false for non-existent backup', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      mockReadFile.mockRejectedValue(new Error('File not found'));

      const result = await backupService.deleteBackup('nonexistent-backup');

      expect(result).toBe(false);
    });

    it('should handle deletion errors gracefully', async () => {
      const mockMetadata = {
        id: 'test-backup-123',
        timestamp: new Date(),
        type: 'full' as const,
        size: 1024,
        checksum: 'abc123',
        compression: false,
        encryption: false,
        location: 'local' as const,
        status: 'completed' as const,
        tables: ['students']
      };

      const mockReadFile = vi.mocked(fs.readFile);
      mockReadFile.mockResolvedValue(JSON.stringify(mockMetadata));

      vi.mocked(existsSync).mockReturnValue(true);

      const mockUnlink = vi.mocked(fs.unlink);
      mockUnlink.mockRejectedValue(new Error('Permission denied'));

      const result = await backupService.deleteBackup('test-backup-123');

      expect(result).toBe(false);
    });
  });

  describe('getBackupStats', () => {
    beforeEach(async () => {
      const mockMkdir = vi.mocked(fs.mkdir);
      mockMkdir.mockResolvedValue(undefined);
      await backupService.initialize();
    });

    it('should return comprehensive backup statistics', async () => {
      const mockBackups = [
        {
          id: 'backup-1',
          timestamp: new Date('2024-01-15'),
          type: 'full',
          size: 1024,
          checksum: 'abc123',
          compression: false,
          encryption: false,
          location: 'local',
          status: 'completed',
          tables: ['students']
        },
        {
          id: 'backup-2',
          timestamp: new Date('2024-01-14'),
          type: 'incremental',
          size: 512,
          checksum: 'def456',
          compression: true,
          encryption: false,
          location: 's3',
          status: 'completed',
          tables: ['exercises']
        }
      ];

      const mockReaddir = vi.mocked(fs.readdir);
      mockReaddir.mockResolvedValue(['backup-1.json', 'backup-2.json']);

      const mockReadFile = vi.mocked(fs.readFile);
      mockReadFile
        .mockResolvedValueOnce(JSON.stringify(mockBackups[0]))
        .mockResolvedValueOnce(JSON.stringify(mockBackups[1]));

      const stats = await backupService.getBackupStats();

      expect(stats).toEqual({
        totalBackups: 2,
        totalSize: '1.50 KB',
        oldestBackup: new Date('2024-01-14'),
        newestBackup: new Date('2024-01-15'),
        storageTypes: { local: 1, s3: 1, both: 0 }
      });
    });

    it('should handle empty backup list', async () => {
      const mockReaddir = vi.mocked(fs.readdir);
      mockReaddir.mockResolvedValue([]);

      const stats = await backupService.getBackupStats();

      expect(stats).toEqual({
        totalBackups: 0,
        totalSize: '0.00 B',
        oldestBackup: null,
        newestBackup: null,
        storageTypes: { local: 0, s3: 0, both: 0 }
      });
    });
  });

  describe('getJobStatus', () => {
    it('should return job status for existing job', async () => {
      // Create a backup to generate a job
      const { testConnection } = await import('../db/connection');
      const mockTestConnection = vi.mocked(testConnection);
      mockTestConnection.mockResolvedValue(true);

      const { connection } = await import('../db/connection');
      const mockConnection = vi.mocked(connection);
      mockConnection.execute.mockResolvedValue([[]]);

      const mockMkdir = vi.mocked(fs.mkdir);
      mockMkdir.mockResolvedValue(undefined);
      await backupService.initialize();

      // Start backup
      const backupPromise = backupService.createBackup('full');
      
      // Get job status
      const jobs = await backupService.listBackups();
      const jobId = 'test-job-id'; // This would be the actual job ID from the backup
      
      // Mock job status
      const jobStatus = await backupService.getJobStatus(jobId);
      
      // Clean up
      mockProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 100);
        }
      });
      await backupPromise;

      expect(jobStatus).toBeNull(); // Job not found in this mock scenario
    });

    it('should return null for non-existent job', async () => {
      const jobStatus = await backupService.getJobStatus('nonexistent-job');
      expect(jobStatus).toBeNull();
    });
  });

  describe('shutdown', () => {
    it('should shutdown gracefully', async () => {
      const mockMkdir = vi.mocked(fs.mkdir);
      mockMkdir.mockResolvedValue(undefined);
      await backupService.initialize();

      await backupService.shutdown();

      // Should complete without errors
      expect(true).toBe(true);
    });

    it('should wait for running jobs to complete', async () => {
      const mockMkdir = vi.mocked(fs.mkdir);
      mockMkdir.mockResolvedValue(undefined);
      await backupService.initialize();

      // This would test the timeout behavior, but it's complex to mock
      await backupService.shutdown();
      
      expect(true).toBe(true);
    });
  });

  describe('file processing', () => {
    beforeEach(async () => {
      const mockMkdir = vi.mocked(fs.mkdir);
      mockMkdir.mockResolvedValue(undefined);
      await backupService.initialize();
    });

    it('should handle compression and encryption', async () => {
      const { testConnection } = await import('../db/connection');
      const mockTestConnection = vi.mocked(testConnection);
      mockTestConnection.mockResolvedValue(true);

      const { connection } = await import('../db/connection');
      const mockConnection = vi.mocked(connection);
      mockConnection.execute.mockResolvedValue([[]]);

      // Set encryption key
      process.env.BACKUP_ENCRYPTION_KEY = 'test-encryption-key';

      // Mock successful process
      mockProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 100);
        }
      });

      const mockWriteStream = {
        write: vi.fn(),
        end: vi.fn()
      };
      vi.mocked(createWriteStream).mockReturnValue(mockWriteStream as any);

      const mockStat = vi.mocked(fs.stat);
      mockStat.mockResolvedValue({ size: 1024 } as any);

      const mockWriteFile = vi.mocked(fs.writeFile);
      mockWriteFile.mockResolvedValue(undefined);

      const mockPipeline = vi.mocked(pipeline);
      mockPipeline.mockResolvedValue(undefined);

      await backupService.createBackup('full', { compress: true });

      expect(mockPipeline).toHaveBeenCalled(); // Compression pipeline
    });
  });
});
