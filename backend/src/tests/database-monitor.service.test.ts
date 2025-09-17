/**
 * Unit tests for Database Monitor Service
 * Tests metrics collection, alerting, performance analysis, and health monitoring
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { databaseMonitorService } from '../services/database-monitor.service';
import { connection, getPoolStats } from '../db/connection';
import { EventEmitter } from 'events';
import * as cron from 'node-cron';
import * as os from 'os';

// Mock dependencies
// Database connection is mocked in setup.ts

vi.mock('node-cron', () => ({
  schedule: vi.fn()
}));

vi.mock('os', () => ({
  cpus: vi.fn()
}));

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

vi.mock('../config/config', () => ({
  config: {
    NODE_ENV: 'test'
  }
}));

describe('Database Monitor Service', () => {
  let mockConnection: any;
  let mockGetPoolStats: any;
  let mockSchedule: any;
  let mockCpus: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockConnection = vi.mocked(connection);
    mockGetPoolStats = vi.mocked(getPoolStats);
    mockSchedule = vi.mocked(cron.schedule);
    mockCpus = vi.mocked(os.cpus);

    // Mock environment variables
    process.env.DB_MONITORING_ENABLED = 'true';
    process.env.DB_MONITORING_INTERVAL = '60';
    process.env.DB_ALERTING_ENABLED = 'true';
    process.env.DB_METRICS_RETENTION_DAYS = '7';
    process.env.DB_WEBHOOK_ENABLED = 'false';

    // Mock scheduled task
    const mockTask = { stop: vi.fn() };
    mockSchedule.mockReturnValue(mockTask);

    // Mock CPU info
    mockCpus.mockReturnValue([
      { times: { idle: 100, user: 200, nice: 0, sys: 50, irq: 0 } },
      { times: { idle: 150, user: 180, nice: 0, sys: 40, irq: 0 } }
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default configuration', async () => {
      mockGetPoolStats.mockReturnValue({
        activeConnections: 5,
        idleConnections: 10,
        totalConnections: 15,
        queuedRequests: 0
      });

      await databaseMonitorService.initialize();

      expect(mockSchedule).toHaveBeenCalledTimes(3); // Daily, hourly, cleanup tasks
      expect(mockSchedule).toHaveBeenCalledWith(
        '0 2 * * *',
        expect.any(Function),
        { name: 'daily-db-analysis' }
      );
    });

    it('should skip initialization when disabled', async () => {
      process.env.DB_MONITORING_ENABLED = 'false';

      await databaseMonitorService.initialize();

      expect(mockSchedule).not.toHaveBeenCalled();
    });

    it('should setup slow query logging', async () => {
      mockGetPoolStats.mockReturnValue({
        activeConnections: 0,
        idleConnections: 0,
        totalConnections: 0,
        queuedRequests: 0
      });

      mockConnection.execute
        .mockResolvedValueOnce([[]]) // SET GLOBAL slow_query_log
        .mockResolvedValueOnce([[]]) // SET GLOBAL long_query_time
        .mockResolvedValueOnce([[]]); // SET GLOBAL log_queries_not_using_indexes

      await databaseMonitorService.initialize();

      expect(mockConnection.execute).toHaveBeenCalledWith(`SET GLOBAL slow_query_log = 'ON'`);
      expect(mockConnection.execute).toHaveBeenCalledWith(`SET GLOBAL long_query_time = ?`, [1]);
      expect(mockConnection.execute).toHaveBeenCalledWith(`SET GLOBAL log_queries_not_using_indexes = 'ON'`);
    });

    it('should handle slow query logging permission errors', async () => {
      mockGetPoolStats.mockReturnValue({
        activeConnections: 0,
        idleConnections: 0,
        totalConnections: 0,
        queuedRequests: 0
      });

      mockConnection.execute.mockRejectedValue(new Error('Access denied'));

      // Should not throw error, just log warning
      await expect(databaseMonitorService.initialize()).resolves.toBeUndefined();
    });
  });

  describe('metrics collection', () => {
    beforeEach(async () => {
      mockGetPoolStats.mockReturnValue({
        activeConnections: 5,
        idleConnections: 10,
        totalConnections: 15,
        queuedRequests: 0
      });

      await databaseMonitorService.initialize();
    });

    it('should collect connection metrics', async () => {
      const metrics = await (databaseMonitorService as any).getConnectionMetrics();

      expect(metrics).toEqual({
        active: 5,
        idle: 10,
        total: 15,
        utilization: 33.333333333333336, // 5/15 * 100
        queueLength: 0
      });
    });

    it('should collect query metrics', async () => {
      const mockStatusRows = [
        { Variable_name: 'Questions', Value: '1000' },
        { Variable_name: 'Slow_queries', Value: '10' },
        { Variable_name: 'Uptime', Value: '3600' },
        { Variable_name: 'Com_select', Value: '500' },
        { Variable_name: 'Com_insert', Value: '200' },
        { Variable_name: 'Com_update', Value: '200' },
        { Variable_name: 'Com_delete', Value: '100' }
      ];

      mockConnection.execute.mockResolvedValue([mockStatusRows]);

      const metrics = await (databaseMonitorService as any).getQueryMetrics();

      expect(metrics).toEqual({
        slowQueries: 10,
        totalQueries: 1000,
        averageQueryTime: 0, // No previous metrics
        queriesPerSecond: 0.2777777777777778 // 1000/3600
      });
    });

    it('should collect performance metrics', async () => {
      const mockStatusRows = [
        { Variable_name: 'Innodb_buffer_pool_read_requests', Value: '10000' },
        { Variable_name: 'Innodb_buffer_pool_reads', Value: '500' },
        { Variable_name: 'Innodb_row_lock_waits', Value: '10' },
        { Variable_name: 'Innodb_row_lock_time', Value: '5000' },
        { Variable_name: 'Innodb_data_reads', Value: '1000' },
        { Variable_name: 'Innodb_data_writes', Value: '2000' }
      ];

      mockConnection.execute
        .mockResolvedValueOnce([mockStatusRows]) // Performance status
        .mockResolvedValueOnce([[{ estimated_memory_gb: 2.5 }]]); // Memory usage

      const metrics = await (databaseMonitorService as any).getPerformanceMetrics();

      expect(metrics.bufferPoolHitRate).toBe(95); // (10000-500)/10000 * 100
      expect(metrics.lockWaitTime).toBe(0.5); // 5000/10/1000
      expect(metrics.memoryUsage).toBe(2.5);
      expect(metrics.diskIO.reads).toBe(1000);
      expect(metrics.diskIO.writes).toBe(2000);
    });

    it('should collect storage metrics', async () => {
      const mockStorageRows = [
        {
          data_size: '1048576',
          index_size: '524288',
          total_size: '1572864',
          table_count: '10'
        }
      ];

      const mockFreeSpaceRows = [
        { free_space: '262144' }
      ];

      mockConnection.execute
        .mockResolvedValueOnce([mockStorageRows])
        .mockResolvedValueOnce([mockFreeSpaceRows]);

      const metrics = await (databaseMonitorService as any).getStorageMetrics();

      expect(metrics).toEqual({
        databaseSize: 1048576,
        indexSize: 524288,
        totalSize: 1572864,
        freeSpace: 262144,
        tableCount: 10
      });
    });

    it('should collect replication metrics for slave', async () => {
      const mockSlaveStatus = [
        {
          Seconds_Behind_Master: 5,
          Slave_SQL_Running: 'Yes',
          Slave_IO_Running: 'Yes'
        }
      ];

      mockConnection.execute.mockResolvedValue([mockSlaveStatus]);

      const metrics = await (databaseMonitorService as any).getReplicationMetrics();

      expect(metrics).toEqual({
        lag: 5,
        status: 'running',
        slaveThreads: {
          sql: true,
          io: true
        }
      });
    });

    it('should return undefined for non-replication setup', async () => {
      mockConnection.execute.mockResolvedValue([[]]);

      const metrics = await (databaseMonitorService as any).getReplicationMetrics();

      expect(metrics).toBeUndefined();
    });

    it('should handle database errors gracefully', async () => {
      mockConnection.execute.mockRejectedValue(new Error('Connection failed'));

      const metrics = await (databaseMonitorService as any).getQueryMetrics();

      expect(metrics).toEqual({
        slowQueries: 0,
        totalQueries: 0,
        averageQueryTime: 0,
        queriesPerSecond: 0
      });
    });
  });

  describe('alerting system', () => {
    beforeEach(async () => {
      mockGetPoolStats.mockReturnValue({
        activeConnections: 5,
        idleConnections: 10,
        totalConnections: 15,
        queuedRequests: 0
      });

      await databaseMonitorService.initialize();
    });

    it('should trigger connection utilization alert', async () => {
      const highUtilizationMetrics = {
        timestamp: new Date(),
        connections: {
          active: 14,
          idle: 1,
          total: 15,
          utilization: 93.33, // Above 85% threshold
          queueLength: 0
        },
        queries: { slowQueries: 0, totalQueries: 0, averageQueryTime: 0, queriesPerSecond: 0 },
        performance: { cpuUsage: 0, memoryUsage: 0, diskIO: { reads: 0, writes: 0, readLatency: 0, writeLatency: 0 }, bufferPoolHitRate: 100, lockWaitTime: 0 },
        storage: { databaseSize: 0, indexSize: 0, totalSize: 0, freeSpace: 0, tableCount: 0 }
      };

      await (databaseMonitorService as any).checkAlerts(highUtilizationMetrics);

      const activeAlerts = await databaseMonitorService.getActiveAlerts();
      expect(activeAlerts).toHaveLength(1);
      expect(activeAlerts[0].category).toBe('connection');
      expect(activeAlerts[0].type).toBe('critical'); // Above 95%
    });

    it('should trigger buffer pool hit rate alert', async () => {
      const lowHitRateMetrics = {
        timestamp: new Date(),
        connections: { active: 5, idle: 10, total: 15, utilization: 50, queueLength: 0 },
        queries: { slowQueries: 0, totalQueries: 0, averageQueryTime: 0, queriesPerSecond: 0 },
        performance: { 
          cpuUsage: 0, 
          memoryUsage: 0, 
          diskIO: { reads: 0, writes: 0, readLatency: 0, writeLatency: 0 }, 
          bufferPoolHitRate: 90, // Below 95% threshold
          lockWaitTime: 0 
        },
        storage: { databaseSize: 0, indexSize: 0, totalSize: 0, freeSpace: 0, tableCount: 0 }
      };

      await (databaseMonitorService as any).checkAlerts(lowHitRateMetrics);

      const activeAlerts = await databaseMonitorService.getActiveAlerts();
      expect(activeAlerts).toHaveLength(1);
      expect(activeAlerts[0].category).toBe('resource');
      expect(activeAlerts[0].type).toBe('warning');
    });

    it('should trigger lock wait time alert', async () => {
      const highLockWaitMetrics = {
        timestamp: new Date(),
        connections: { active: 5, idle: 10, total: 15, utilization: 50, queueLength: 0 },
        queries: { slowQueries: 0, totalQueries: 0, averageQueryTime: 0, queriesPerSecond: 0 },
        performance: { 
          cpuUsage: 0, 
          memoryUsage: 0, 
          diskIO: { reads: 0, writes: 0, readLatency: 0, writeLatency: 0 }, 
          bufferPoolHitRate: 100, 
          lockWaitTime: 15 // Above 10 second threshold
        },
        storage: { databaseSize: 0, indexSize: 0, totalSize: 0, freeSpace: 0, tableCount: 0 }
      };

      await (databaseMonitorService as any).checkAlerts(highLockWaitMetrics);

      const activeAlerts = await databaseMonitorService.getActiveAlerts();
      expect(activeAlerts).toHaveLength(1);
      expect(activeAlerts[0].category).toBe('query');
      expect(activeAlerts[0].type).toBe('error');
    });

    it('should trigger replication lag alert', async () => {
      const highLagMetrics = {
        timestamp: new Date(),
        connections: { active: 5, idle: 10, total: 15, utilization: 50, queueLength: 0 },
        queries: { slowQueries: 0, totalQueries: 0, averageQueryTime: 0, queriesPerSecond: 0 },
        performance: { cpuUsage: 0, memoryUsage: 0, diskIO: { reads: 0, writes: 0, readLatency: 0, writeLatency: 0 }, bufferPoolHitRate: 100, lockWaitTime: 0 },
        storage: { databaseSize: 0, indexSize: 0, totalSize: 0, freeSpace: 0, tableCount: 0 },
        replication: {
          lag: 120, // Above 60 second threshold
          status: 'running' as const,
          slaveThreads: { sql: true, io: true }
        }
      };

      await (databaseMonitorService as any).checkAlerts(highLagMetrics);

      const activeAlerts = await databaseMonitorService.getActiveAlerts();
      expect(activeAlerts).toHaveLength(1);
      expect(activeAlerts[0].category).toBe('replication');
      expect(activeAlerts[0].type).toBe('error');
    });

    it('should resolve alerts', async () => {
      // Create an alert first
      const highUtilizationMetrics = {
        timestamp: new Date(),
        connections: { active: 14, idle: 1, total: 15, utilization: 93.33, queueLength: 0 },
        queries: { slowQueries: 0, totalQueries: 0, averageQueryTime: 0, queriesPerSecond: 0 },
        performance: { cpuUsage: 0, memoryUsage: 0, diskIO: { reads: 0, writes: 0, readLatency: 0, writeLatency: 0 }, bufferPoolHitRate: 100, lockWaitTime: 0 },
        storage: { databaseSize: 0, indexSize: 0, totalSize: 0, freeSpace: 0, tableCount: 0 }
      };

      await (databaseMonitorService as any).checkAlerts(highUtilizationMetrics);

      const activeAlerts = await databaseMonitorService.getActiveAlerts();
      expect(activeAlerts).toHaveLength(1);

      const alertId = activeAlerts[0].id;
      const resolved = await databaseMonitorService.resolveAlert(alertId);

      expect(resolved).toBe(true);
      
      const remainingAlerts = await databaseMonitorService.getActiveAlerts();
      expect(remainingAlerts).toHaveLength(0);
    });

    it('should return false for non-existent alert resolution', async () => {
      const resolved = await databaseMonitorService.resolveAlert('non-existent-alert');
      expect(resolved).toBe(false);
    });
  });

  describe('health status', () => {
    beforeEach(async () => {
      mockGetPoolStats.mockReturnValue({
        activeConnections: 5,
        idleConnections: 10,
        totalConnections: 15,
        queuedRequests: 0
      });

      await databaseMonitorService.initialize();
    });

    it('should return healthy status with no alerts', async () => {
      const healthStatus = await databaseMonitorService.getHealthStatus();

      expect(healthStatus.status).toBe('healthy');
      expect(healthStatus.summary).toBe('All systems operating normally');
      expect(healthStatus.activeAlerts).toBe(0);
    });

    it('should return warning status with non-critical alerts', async () => {
      const warningMetrics = {
        timestamp: new Date(),
        connections: { active: 5, idle: 10, total: 15, utilization: 50, queueLength: 0 },
        queries: { slowQueries: 0, totalQueries: 0, averageQueryTime: 0, queriesPerSecond: 0 },
        performance: { 
          cpuUsage: 0, 
          memoryUsage: 0, 
          diskIO: { reads: 0, writes: 0, readLatency: 0, writeLatency: 0 }, 
          bufferPoolHitRate: 90, // Warning level
          lockWaitTime: 0 
        },
        storage: { databaseSize: 0, indexSize: 0, totalSize: 0, freeSpace: 0, tableCount: 0 }
      };

      await (databaseMonitorService as any).checkAlerts(warningMetrics);

      const healthStatus = await databaseMonitorService.getHealthStatus();

      expect(healthStatus.status).toBe('warning');
      expect(healthStatus.summary).toContain('performance warning(s) detected');
      expect(healthStatus.activeAlerts).toBe(1);
    });

    it('should return critical status with critical alerts', async () => {
      const criticalMetrics = {
        timestamp: new Date(),
        connections: { active: 14, idle: 1, total: 15, utilization: 96, queueLength: 0 }, // Critical
        queries: { slowQueries: 0, totalQueries: 0, averageQueryTime: 0, queriesPerSecond: 0 },
        performance: { cpuUsage: 0, memoryUsage: 0, diskIO: { reads: 0, writes: 0, readLatency: 0, writeLatency: 0 }, bufferPoolHitRate: 100, lockWaitTime: 0 },
        storage: { databaseSize: 0, indexSize: 0, totalSize: 0, freeSpace: 0, tableCount: 0 }
      };

      await (databaseMonitorService as any).checkAlerts(criticalMetrics);

      const healthStatus = await databaseMonitorService.getHealthStatus();

      expect(healthStatus.status).toBe('critical');
      expect(healthStatus.summary).toBe('Critical issues detected requiring immediate attention');
      expect(healthStatus.activeAlerts).toBe(1);
    });
  });

  describe('analysis functions', () => {
    beforeEach(async () => {
      mockGetPoolStats.mockReturnValue({
        activeConnections: 5,
        idleConnections: 10,
        totalConnections: 15,
        queuedRequests: 0
      });

      await databaseMonitorService.initialize();
    });

    it('should analyze slow queries', async () => {
      const mockSlowQueries = [
        {
          query_text: 'SELECT * FROM students WHERE id = ?',
          count: 100,
          total_time_sec: 50.5,
          avg_time_sec: 0.505,
          min_time_sec: 0.1,
          max_time_sec: 2.0
        }
      ];

      mockConnection.execute.mockResolvedValue([mockSlowQueries]);

      await (databaseMonitorService as any).analyzeSlowQueries();

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('performance_schema.events_statements_summary_by_digest'),
        [1] // 1000ms threshold converted to seconds
      );
    });

    it('should perform table health analysis', async () => {
      const mockTableData = [
        {
          table_name: 'students',
          row_count: 1000,
          data_size: 1048576,
          index_size: 524288,
          avg_row_length: 1024,
          fragmentation: 104857, // 10% fragmentation
          last_updated: '2024-01-15 10:00:00'
        }
      ];

      mockConnection.execute.mockResolvedValue([mockTableData]);

      const analysis = await (databaseMonitorService as any).analyzeTableHealth();

      expect(analysis).toHaveLength(1);
      expect(analysis[0].tableName).toBe('students');
      expect(analysis[0].fragmentationRatio).toBe(10);
      expect(analysis[0].recommendedActions).toContain('OPTIMIZE TABLE to reduce fragmentation');
    });

    it('should analyze index usage', async () => {
      const mockIndexData = [
        {
          TABLE_NAME: 'students',
          INDEX_NAME: 'idx_email',
          COLUMN_NAME: 'email',
          CARDINALITY: 1000,
          INDEX_TYPE: 'BTREE'
        }
      ];

      mockConnection.execute.mockResolvedValue([mockIndexData]);

      const analysis = await (databaseMonitorService as any).analyzeIndexUsage();

      expect(analysis).toHaveLength(1);
      expect(analysis[0].tableName).toBe('students');
      expect(analysis[0].indexName).toBe('idx_email');
      expect(analysis[0].columns).toEqual(['email']);
      expect(analysis[0].cardinality).toBe(1000);
    });

    it('should handle analysis errors gracefully', async () => {
      mockConnection.execute.mockRejectedValue(new Error('Access denied'));

      const tableAnalysis = await (databaseMonitorService as any).analyzeTableHealth();
      const indexAnalysis = await (databaseMonitorService as any).analyzeIndexUsage();

      expect(tableAnalysis).toEqual([]);
      expect(indexAnalysis).toEqual([]);
    });
  });

  describe('metrics history and cleanup', () => {
    beforeEach(async () => {
      mockGetPoolStats.mockReturnValue({
        activeConnections: 5,
        idleConnections: 10,
        totalConnections: 15,
        queuedRequests: 0
      });

      await databaseMonitorService.initialize();
    });

    it('should get latest metrics', async () => {
      // Add some mock metrics
      const mockMetrics = {
        timestamp: new Date(),
        connections: { active: 5, idle: 10, total: 15, utilization: 50, queueLength: 0 },
        queries: { slowQueries: 0, totalQueries: 0, averageQueryTime: 0, queriesPerSecond: 0 },
        performance: { cpuUsage: 0, memoryUsage: 0, diskIO: { reads: 0, writes: 0, readLatency: 0, writeLatency: 0 }, bufferPoolHitRate: 100, lockWaitTime: 0 },
        storage: { databaseSize: 0, indexSize: 0, totalSize: 0, freeSpace: 0, tableCount: 0 }
      };

      (databaseMonitorService as any).metrics.push(mockMetrics);

      const latestMetrics = await databaseMonitorService.getLatestMetrics();

      expect(latestMetrics).toEqual(mockMetrics);
    });

    it('should return null when no metrics available', async () => {
      const latestMetrics = await databaseMonitorService.getLatestMetrics();
      expect(latestMetrics).toBeNull();
    });

    it('should get metrics history for specified hours', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      const recentMetric = {
        timestamp: now,
        connections: { active: 5, idle: 10, total: 15, utilization: 50, queueLength: 0 },
        queries: { slowQueries: 0, totalQueries: 0, averageQueryTime: 0, queriesPerSecond: 0 },
        performance: { cpuUsage: 0, memoryUsage: 0, diskIO: { reads: 0, writes: 0, readLatency: 0, writeLatency: 0 }, bufferPoolHitRate: 100, lockWaitTime: 0 },
        storage: { databaseSize: 0, indexSize: 0, totalSize: 0, freeSpace: 0, tableCount: 0 }
      };

      const oldMetric = {
        timestamp: twoHoursAgo,
        connections: { active: 5, idle: 10, total: 15, utilization: 50, queueLength: 0 },
        queries: { slowQueries: 0, totalQueries: 0, averageQueryTime: 0, queriesPerSecond: 0 },
        performance: { cpuUsage: 0, memoryUsage: 0, diskIO: { reads: 0, writes: 0, readLatency: 0, writeLatency: 0 }, bufferPoolHitRate: 100, lockWaitTime: 0 },
        storage: { databaseSize: 0, indexSize: 0, totalSize: 0, freeSpace: 0, tableCount: 0 }
      };

      (databaseMonitorService as any).metrics.push(oldMetric, recentMetric);

      const history = await databaseMonitorService.getMetricsHistory(1.5); // 1.5 hours

      expect(history).toHaveLength(1);
      expect(history[0].timestamp).toEqual(recentMetric.timestamp);
    });

    it('should cleanup old metrics', async () => {
      const now = new Date();
      const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

      const oldMetric = {
        timestamp: eightDaysAgo,
        connections: { active: 5, idle: 10, total: 15, utilization: 50, queueLength: 0 },
        queries: { slowQueries: 0, totalQueries: 0, averageQueryTime: 0, queriesPerSecond: 0 },
        performance: { cpuUsage: 0, memoryUsage: 0, diskIO: { reads: 0, writes: 0, readLatency: 0, writeLatency: 0 }, bufferPoolHitRate: 100, lockWaitTime: 0 },
        storage: { databaseSize: 0, indexSize: 0, totalSize: 0, freeSpace: 0, tableCount: 0 }
      };

      const recentMetric = {
        timestamp: fiveDaysAgo,
        connections: { active: 5, idle: 10, total: 15, utilization: 50, queueLength: 0 },
        queries: { slowQueries: 0, totalQueries: 0, averageQueryTime: 0, queriesPerSecond: 0 },
        performance: { cpuUsage: 0, memoryUsage: 0, diskIO: { reads: 0, writes: 0, readLatency: 0, writeLatency: 0 }, bufferPoolHitRate: 100, lockWaitTime: 0 },
        storage: { databaseSize: 0, indexSize: 0, totalSize: 0, freeSpace: 0, tableCount: 0 }
      };

      (databaseMonitorService as any).metrics.push(oldMetric, recentMetric);

      await (databaseMonitorService as any).cleanupOldMetrics();

      const remainingMetrics = (databaseMonitorService as any).metrics;
      expect(remainingMetrics).toHaveLength(1);
      expect(remainingMetrics[0].timestamp).toEqual(recentMetric.timestamp);
    });
  });

  describe('shutdown', () => {
    it('should shutdown gracefully', async () => {
      mockGetPoolStats.mockReturnValue({
        activeConnections: 5,
        idleConnections: 10,
        totalConnections: 15,
        queuedRequests: 0
      });

      await databaseMonitorService.initialize();
      await databaseMonitorService.shutdown();

      // Should complete without errors
      expect(true).toBe(true);
    });
  });

  describe('event emission', () => {
    it('should emit events for metrics collection', async () => {
      const eventSpy = vi.fn();
      databaseMonitorService.on('metricsCollected', eventSpy);

      mockGetPoolStats.mockReturnValue({
        activeConnections: 5,
        idleConnections: 10,
        totalConnections: 15,
        queuedRequests: 0
      });

      await databaseMonitorService.initialize();

      // Trigger metrics collection
      await (databaseMonitorService as any).collectMetrics();

      expect(eventSpy).toHaveBeenCalled();
    });

    it('should emit events for alerts', async () => {
      const alertSpy = vi.fn();
      databaseMonitorService.on('alert', alertSpy);

      mockGetPoolStats.mockReturnValue({
        activeConnections: 5,
        idleConnections: 10,
        totalConnections: 15,
        queuedRequests: 0
      });

      await databaseMonitorService.initialize();

      // Trigger alert
      const highUtilizationMetrics = {
        timestamp: new Date(),
        connections: { active: 14, idle: 1, total: 15, utilization: 93.33, queueLength: 0 },
        queries: { slowQueries: 0, totalQueries: 0, averageQueryTime: 0, queriesPerSecond: 0 },
        performance: { cpuUsage: 0, memoryUsage: 0, diskIO: { reads: 0, writes: 0, readLatency: 0, writeLatency: 0 }, bufferPoolHitRate: 100, lockWaitTime: 0 },
        storage: { databaseSize: 0, indexSize: 0, totalSize: 0, freeSpace: 0, tableCount: 0 }
      };

      await (databaseMonitorService as any).checkAlerts(highUtilizationMetrics);

      expect(alertSpy).toHaveBeenCalled();
    });
  });
});
