import { describe, it, expect, afterAll, beforeEach, afterEach, vi } from 'vitest';
import * as db from '../db/connection';
import { logger } from '../utils/logger';

vi.unmock('../db/connection');

let mockPool: any;
let mockConnection: any;

vi.mock('drizzle-orm/mysql2', () => ({
  drizzle: vi.fn(() => ({})),
}));

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('mysql2/promise', () => {
  mockConnection = {
    execute: vi.fn().mockResolvedValue([[{ test: 1 }]]),
    release: vi.fn().mockResolvedValue(undefined),
    beginTransaction: vi.fn().mockResolvedValue(undefined),
    commit: vi.fn().mockResolvedValue(undefined),
    rollback: vi.fn().mockResolvedValue(undefined),
  };

  mockPool = {
    execute: vi.fn().mockResolvedValue([[{ '1': 1 }]]),
    getConnection: vi.fn().mockResolvedValue(mockConnection),
    end: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    config: {
      connectionLimit: 10
    },
    _allConnections: { length: 0 },
    _activeConnections: { length: 0 },
    _freeConnections: { length: 0 },
    _connectionQueue: { length: 0 },
    _acquiredConnections: 0,
    _releasedConnections: 0,
    _createdConnections: 0,
    _destroyedConnections: 0,
  };

  return {
    createPool: vi.fn(() => mockPool),
  };
});


describe('Database Connection', () => {

  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset connection state by disconnecting first
    try {
      await db.disconnectDatabase();
    } catch (e) {
      // Ignore errors if not connected
    }
    // Reset stats
    mockPool._allConnections.length = 0;
    mockPool._activeConnections.length = 0;
    mockPool._freeConnections.length = 0;
    mockPool._connectionQueue.length = 0;
    mockPool._acquiredConnections = 0;
    mockPool._releasedConnections = 0;
    mockPool._createdConnections = 0;
    mockPool._destroyedConnections = 0;
    // Reset mock implementations
    mockPool.execute.mockResolvedValue([[{'1': 1}]]);
    mockConnection.execute.mockResolvedValue([[{ test: 1 }]]);
    mockConnection.beginTransaction.mockResolvedValue(undefined);
    mockConnection.commit.mockResolvedValue(undefined);
    mockConnection.rollback.mockResolvedValue(undefined);
    mockConnection.release.mockResolvedValue(undefined);
    mockPool.getConnection.mockResolvedValue(mockConnection);
    mockPool.end.mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await db.disconnectDatabase();
  });

  describe('Basic Connectivity', () => {
    it('should establish a database connection successfully', async () => {
      await db.connectDatabase();
      expect(logger.info).toHaveBeenCalledWith('Initializing database connection...', expect.any(Object));
      expect(mockPool.execute).toHaveBeenCalledWith('SELECT 1 as test');
      expect(logger.info).toHaveBeenCalledWith('Database connection established successfully', expect.any(Object));
    });

    it('should test the connection successfully', async () => {
      const isConnected = await db.testConnection();
      expect(isConnected).toBe(true);
      expect(mockPool.execute).toHaveBeenCalledWith('SELECT 1 as test');
      expect(logger.info).toHaveBeenCalledWith('Database connection test successful', expect.any(Object));
    });

    it('should fail to connect if the initial test fails', async () => {
      mockPool.execute.mockRejectedValue(new Error('Connection failed'));
      await expect(db.connectDatabase()).rejects.toThrow('Failed to establish database connection');
      expect(logger.error).toHaveBeenCalledWith('Failed to connect to database', expect.any(Object));
    });

    it('should return accurate pool statistics', () => {
      mockPool._allConnections.length = 10;
      mockPool._activeConnections.length = 5;
      mockPool._freeConnections.length = 5;
      mockPool._connectionQueue.length = 2;

      const stats = db.getPoolStats();
      expect(stats.totalConnections).toBe(10);
      expect(stats.activeConnections).toBe(5);
      expect(stats.idleConnections).toBe(5);
      expect(stats.queuedRequests).toBe(2);
    });

    it('should disconnect the database successfully', async () => {
      await db.connectDatabase();
      await db.disconnectDatabase();
      expect(mockPool.end).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Database connection closed successfully');
    });
  });

  describe('Connection Pool', () => {
    it('should acquire and release a connection from the pool during a transaction', async () => {
      await db.withTransaction(async (tx) => {
        expect(tx).toBe(mockConnection);
        await tx.execute('SELECT 1');
      });

      expect(mockPool.getConnection).toHaveBeenCalledTimes(1);
      expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(mockConnection.execute).toHaveBeenCalledWith('SELECT 1');
      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
      expect(mockConnection.release).toHaveBeenCalledTimes(1);
    });

    it('should rollback a transaction on failure', async () => {
      const error = new Error('Transaction failed');
      mockConnection.execute.mockRejectedValue(error);

      await expect(
        db.withTransaction(async (tx) => {
          await tx.execute('FAILING QUERY');
        })
      ).rejects.toThrow(error);

      expect(mockPool.getConnection).toHaveBeenCalledTimes(1);
      expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(mockConnection.commit).not.toHaveBeenCalled();
      expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
      expect(mockConnection.release).toHaveBeenCalledTimes(1);
    });

    it('should queue connection requests when the pool is exhausted', async () => {
      // Simulate queue by setting queue length
      mockPool._connectionQueue.length = 1;

      const promise1 = db.withTransaction(async () => {});
      const promise2 = db.withTransaction(async () => {});

      await Promise.all([promise1, promise2]);

      // Verify connections were acquired
      expect(mockPool.getConnection).toHaveBeenCalled();
    });
  });

  describe('Resilience and Recovery', () => {
    beforeEach(async () => {
      // Disconnect first to reset state
      try {
        await db.disconnectDatabase();
      } catch (e) {
        // Ignore errors if not connected
      }
      vi.useFakeTimers();
      // Reset mocks
      vi.clearAllMocks();
      mockPool.execute.mockResolvedValue([[{'1': 1}]]);
      mockConnection.execute.mockResolvedValue([[{ test: 1 }]]);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should retry connection test with exponential backoff', async () => {
      mockPool.execute
        .mockRejectedValueOnce(new Error('DB not available'))
        .mockRejectedValueOnce(new Error('DB not available'))
        .mockResolvedValue([[{'1': 1}]]);

      const connectionPromise = db.testConnection(3);

      // Advance timers to trigger retries (2s for first retry, 4s for second)
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(4000);

      const isConnected = await connectionPromise;

      expect(isConnected).toBe(true);
      expect(mockPool.execute).toHaveBeenCalledTimes(3);
      expect(logger.warn).toHaveBeenCalledTimes(2);
    });

    it('should fail connection test after all retries', async () => {
      mockPool.execute.mockRejectedValue(new Error('DB not available'));

      const connectionPromise = db.testConnection(3);

      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(4000);
      await vi.advanceTimersByTimeAsync(8000);

      const isConnected = await connectionPromise;

      expect(isConnected).toBe(false);
      expect(mockPool.execute).toHaveBeenCalledTimes(3);
      expect(logger.error).toHaveBeenCalledWith('Database connection failed after all retries', expect.any(Object));
    });

    it('should retry a transaction with exponential backoff', async () => {
      mockConnection.execute
        .mockRejectedValueOnce(new Error('Deadlock'))
        .mockResolvedValue([[{}]]);

      const transactionPromise = db.withTransaction(async (tx) => {
        await tx.execute('UPDATE ...');
      }, { retries: 2 });

      // Advance timers to allow retry backoff (2s for first retry)
      await vi.advanceTimersByTimeAsync(2000);
      
      await transactionPromise;

      expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(2);
      expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
      expect(mockConnection.release).toHaveBeenCalledTimes(2);
      expect(logger.warn).toHaveBeenCalledWith('Transaction failed', expect.objectContaining({ attempt: 1 }));
    });
  });

  describe('Performance', () => {
    it('should handle concurrent connections gracefully', async () => {
      const concurrentQueries = Array(10).fill(0).map(() =>
        db.withTransaction(async (tx) => {
          await tx.execute('SELECT 1');
        })
      );

      await Promise.all(concurrentQueries);

      expect(mockPool.getConnection).toHaveBeenCalledTimes(10);
      expect(mockConnection.release).toHaveBeenCalledTimes(10);
    });

    it('should have a query response time within limits', async () => {
      mockPool.execute.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve([[{'1': 1 }]]), 150))
      );

      const startTime = Date.now();
      await db.testConnection();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(200);
    });

    it('should maintain stable pool performance under load', async () => {
      const loadQueries = Array(50).fill(0).map((_, i) =>
        db.withTransaction(async (tx) => {
          await tx.execute(`SELECT ${i}`);
        })
      );

      await Promise.all(loadQueries);

      const stats = db.getPoolStats();
      expect(stats.totalConnections).toBeLessThanOrEqual(mockPool.config.connectionLimit);
      expect(stats.queuedRequests).toBe(0);
    }, 10000);
  });

  describe('Health Monitoring', () => {
    it('should return a healthy status', async () => {
      // Mock both queries used in checkDatabaseHealth
      mockPool.execute
        .mockResolvedValueOnce([[{ connection_test: 1 }]])
        .mockResolvedValueOnce([[{ count: 10 }]]);
      
      const health = await db.checkDatabaseHealth();
      expect(health.status).toBe('healthy');
      expect(health.checks?.connection).toBe(true);
      expect(health.checks?.query).toBe(true);
    });

    it('should return a degraded status for slow queries', async () => {
      // Mock both queries - first one is slow
      mockPool.execute.mockImplementation((query: string) => {
        if (query.includes('connection_test')) {
          return new Promise(resolve => setTimeout(() => resolve([[{ connection_test: 1 }]]), 5500));
        }
        return Promise.resolve([[{ count: 10 }]]);
      });
      
      const health = await db.checkDatabaseHealth();
      expect(health.status).toBe('degraded');
    });

    it('should return a degraded status for high pool utilization', async () => {
      mockPool._allConnections.length = 100;
      mockPool._activeConnections.length = 95;
      const health = await db.checkDatabaseHealth();
      expect(health.status).toBe('degraded');
      expect(health.checks?.poolUtilization).toBe(95);
    });

    it('should return an unhealthy status on connection failure', async () => {
      // Mock both queries to fail
      mockPool.execute.mockRejectedValue(new Error('Connection failed'));
      
      const health = await db.checkDatabaseHealth();
      expect(health.status).toBe('unhealthy');
      expect(health.error).toBe('Connection failed');
    });
  });
});
