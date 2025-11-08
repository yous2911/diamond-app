"use strict";
/**
 * Database Replication Service for RevEd Kids
 * Manages MySQL replication setup, monitoring, and failover for high availability
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseReplicationService = void 0;
const logger_1 = require("../utils/logger");
const promise_1 = __importDefault(require("mysql2/promise"));
const node_cron_1 = __importDefault(require("node-cron"));
const events_1 = require("events");
class DatabaseReplicationService extends events_1.EventEmitter {
    constructor() {
        super();
        this.servers = new Map();
        this.replicationStatus = new Map();
        this.failoverEvents = [];
        this.currentMaster = null;
        this.isInitialized = false;
        this.monitoringInterval = null;
        this.scheduledTasks = new Map();
        this.metrics = [];
        this.config = {
            enabled: process.env.REPLICATION_ENABLED === 'true' || false,
            topology: process.env.REPLICATION_TOPOLOGY || 'master-slave',
            monitoringInterval: parseInt(process.env.REPLICATION_MONITORING_INTERVAL || '30'),
            failoverEnabled: process.env.REPLICATION_FAILOVER_ENABLED === 'true' || false,
            autoFailback: process.env.REPLICATION_AUTO_FAILBACK === 'true' || false,
            maxReplicationLag: parseInt(process.env.REPLICATION_MAX_LAG || '60'),
            healthCheckInterval: parseInt(process.env.REPLICATION_HEALTH_CHECK_INTERVAL || '10'),
            servers: this.loadServerConfiguration()
        };
    }
    loadServerConfiguration() {
        // Load from environment variables or configuration file
        const servers = [];
        // Master server (primary database)
        if (process.env.DB_HOST) {
            servers.push({
                id: 'master-1',
                role: 'master',
                host: process.env.DB_HOST,
                port: parseInt(process.env.DB_PORT || '3306'),
                user: process.env.DB_USER || '',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_DATABASE || '',
                priority: 100,
                isActive: true
            });
        }
        // Slave servers (read replicas)
        const slaveCount = parseInt(process.env.REPLICATION_SLAVE_COUNT || '0');
        for (let i = 1; i <= slaveCount; i++) {
            const host = process.env[`DB_SLAVE${i}_HOST`];
            if (host) {
                servers.push({
                    id: `slave-${i}`,
                    role: 'slave',
                    host,
                    port: parseInt(process.env[`DB_SLAVE${i}_PORT`] || '3306'),
                    user: process.env[`DB_SLAVE${i}_USER`] || process.env.DB_USER || '',
                    password: process.env[`DB_SLAVE${i}_PASSWORD`] || process.env.DB_PASSWORD || '',
                    database: process.env[`DB_SLAVE${i}_DATABASE`] || process.env.DB_DATABASE || '',
                    priority: 50 + i, // Lower priority than master
                    isActive: true
                });
            }
        }
        return servers;
    }
    async initialize() {
        if (!this.config.enabled || this.config.servers.length <= 1) {
            logger_1.logger.info('Database replication disabled or insufficient servers configured');
            return;
        }
        try {
            logger_1.logger.info('Initializing database replication service...', {
                topology: this.config.topology,
                serverCount: this.config.servers.length,
                failoverEnabled: this.config.failoverEnabled
            });
            // Initialize server connections
            await this.initializeServers();
            // Detect current master
            await this.detectCurrentMaster();
            // Setup replication monitoring
            this.setupReplicationMonitoring();
            // Setup health checks
            this.setupHealthChecks();
            // Validate replication setup
            await this.validateReplicationSetup();
            this.isInitialized = true;
            logger_1.logger.info('Database replication service initialized successfully', {
                currentMaster: this.currentMaster?.id,
                activeSlaves: Array.from(this.servers.values()).filter(s => s.role === 'slave' && s.isActive).length
            });
            this.emit('initialized');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize database replication service', { error });
            throw error;
        }
    }
    async initializeServers() {
        for (const serverConfig of this.config.servers) {
            try {
                // Create connection pool for each server
                const pool = promise_1.default.createPool({
                    host: serverConfig.host,
                    port: serverConfig.port || 3306,
                    user: serverConfig.user,
                    password: serverConfig.password,
                    database: serverConfig.database,
                    connectionLimit: 10,
                    acquireTimeout: 60000,
                    timeout: 60000
                });
                serverConfig.connectionPool = pool;
                this.servers.set(serverConfig.id, serverConfig);
                // Test connection
                const connection = await pool.getConnection();
                await connection.ping();
                connection.release();
                logger_1.logger.info('Server connection initialized', {
                    serverId: serverConfig.id,
                    host: serverConfig.host,
                    role: serverConfig.role
                });
            }
            catch (error) {
                logger_1.logger.error('Failed to initialize server connection', {
                    serverId: serverConfig.id,
                    host: serverConfig.host,
                    error
                });
                serverConfig.isActive = false;
            }
        }
    }
    async detectCurrentMaster() {
        // Find the current master by checking server roles
        for (const server of this.servers.values()) {
            if (!server.isActive || !server.connectionPool)
                continue;
            try {
                const [rows] = await server.connectionPool.execute('SHOW MASTER STATUS');
                if (rows.length > 0) {
                    this.currentMaster = server;
                    server.role = 'master';
                    logger_1.logger.info('Master server detected', {
                        serverId: server.id,
                        host: server.host
                    });
                    break;
                }
            }
            catch (error) {
                logger_1.logger.debug('Server is not a master', {
                    serverId: server.id,
                    error: (error instanceof Error ? error : new Error(String(error))).message
                });
            }
        }
        if (!this.currentMaster) {
            // If no master detected, promote the highest priority server
            const candidates = Array.from(this.servers.values())
                .filter(s => s.isActive)
                .sort((a, b) => b.priority - a.priority);
            if (candidates.length > 0) {
                logger_1.logger.warn('No master detected, promoting highest priority server');
                await this.promoteToMaster(candidates[0].id);
            }
            else {
                throw new Error('No active servers available for master promotion');
            }
        }
    }
    setupReplicationMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        this.monitoringInterval = setInterval(async () => {
            try {
                await this.checkReplicationStatus();
            }
            catch (error) {
                logger_1.logger.error('Replication monitoring failed', { error });
            }
        }, this.config.monitoringInterval * 1000);
        logger_1.logger.info('Replication monitoring started', {
            intervalSeconds: this.config.monitoringInterval
        });
    }
    setupHealthChecks() {
        // Periodic health checks
        const healthCheckTask = node_cron_1.default.schedule(`*/${this.config.healthCheckInterval} * * * * *`, async () => {
            try {
                await this.performHealthChecks();
            }
            catch (error) {
                logger_1.logger.error('Health check failed', { error });
            }
        }, { name: 'replication-health-check' });
        // Metrics collection
        const metricsTask = node_cron_1.default.schedule('* * * * *', async () => {
            try {
                await this.collectMetrics();
            }
            catch (error) {
                logger_1.logger.error('Metrics collection failed', { error });
            }
        }, { name: 'replication-metrics' });
        this.scheduledTasks.set('health-check', healthCheckTask);
        this.scheduledTasks.set('metrics', metricsTask);
    }
    async validateReplicationSetup() {
        if (!this.currentMaster) {
            throw new Error('No master server available');
        }
        const slaves = Array.from(this.servers.values()).filter(s => s.role === 'slave' && s.isActive);
        for (const slave of slaves) {
            try {
                const status = await this.getSlaveStatus(slave);
                if (!status.slaveIORunning || !status.slaveSQLRunning) {
                    logger_1.logger.warn('Slave replication not running properly', {
                        slaveId: slave.id,
                        ioRunning: status.slaveIORunning,
                        sqlRunning: status.slaveSQLRunning
                    });
                }
                if (status.lagSeconds > this.config.maxReplicationLag) {
                    logger_1.logger.warn('High replication lag detected', {
                        slaveId: slave.id,
                        lagSeconds: status.lagSeconds,
                        maxLag: this.config.maxReplicationLag
                    });
                }
            }
            catch (error) {
                logger_1.logger.error('Failed to validate slave replication', {
                    slaveId: slave.id,
                    error
                });
            }
        }
    }
    async checkReplicationStatus() {
        const statusChecks = [];
        for (const server of this.servers.values()) {
            if (!server.isActive)
                continue;
            statusChecks.push(this.updateServerStatus(server));
        }
        await Promise.allSettled(statusChecks);
        // Check for failover conditions
        if (this.config.failoverEnabled) {
            await this.checkFailoverConditions();
        }
    }
    async updateServerStatus(server) {
        try {
            if (server.role === 'master') {
                await this.updateMasterStatus(server);
            }
            else {
                await this.updateSlaveStatus(server);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to update server status', {
                serverId: server.id,
                error
            });
            // Mark server as unhealthy
            const status = this.replicationStatus.get(server.id);
            if (status) {
                status.status = 'error';
                status.isHealthy = false;
                const err = error instanceof Error ? error : new Error(String(error));
                status.lastError = err.message;
                status.lastCheck = new Date();
            }
        }
    }
    async updateMasterStatus(server) {
        if (!server.connectionPool)
            return;
        const [rows] = await server.connectionPool.execute('SHOW MASTER STATUS');
        const masterStatus = rows[0];
        const status = {
            serverId: server.id,
            role: 'master',
            status: 'running',
            lagSeconds: 0,
            masterLogFile: masterStatus?.File,
            masterLogPosition: masterStatus?.Position,
            lastCheck: new Date(),
            isHealthy: true
        };
        this.replicationStatus.set(server.id, status);
    }
    async updateSlaveStatus(server) {
        const status = await this.getSlaveStatus(server);
        this.replicationStatus.set(server.id, status);
    }
    async getSlaveStatus(server) {
        if (!server.connectionPool) {
            throw new Error('No connection pool for server');
        }
        const [rows] = await server.connectionPool.execute('SHOW SLAVE STATUS');
        const slaveStatus = rows[0];
        if (!slaveStatus) {
            throw new Error('Server is not configured as a slave');
        }
        const lagSeconds = slaveStatus.Seconds_Behind_Master !== null
            ? parseInt(slaveStatus.Seconds_Behind_Master)
            : 0;
        const status = {
            serverId: server.id,
            role: 'slave',
            status: this.determineSlaveStatus(slaveStatus, lagSeconds),
            lagSeconds,
            slaveIORunning: slaveStatus.Slave_IO_Running === 'Yes',
            slaveSQLRunning: slaveStatus.Slave_SQL_Running === 'Yes',
            lastError: slaveStatus.Last_Error || undefined,
            lastCheck: new Date(),
            isHealthy: this.isSlaveHealthy(slaveStatus, lagSeconds)
        };
        return status;
    }
    determineSlaveStatus(slaveStatus, lagSeconds) {
        if (slaveStatus.Slave_IO_Running !== 'Yes' || slaveStatus.Slave_SQL_Running !== 'Yes') {
            return 'stopped';
        }
        if (lagSeconds > this.config.maxReplicationLag) {
            return 'lag';
        }
        if (slaveStatus.Last_Error) {
            return 'error';
        }
        return 'running';
    }
    isSlaveHealthy(slaveStatus, lagSeconds) {
        return slaveStatus.Slave_IO_Running === 'Yes' &&
            slaveStatus.Slave_SQL_Running === 'Yes' &&
            lagSeconds <= this.config.maxReplicationLag &&
            !slaveStatus.Last_Error;
    }
    async checkFailoverConditions() {
        if (!this.currentMaster)
            return;
        const masterStatus = this.replicationStatus.get(this.currentMaster.id);
        if (masterStatus && !masterStatus.isHealthy) {
            logger_1.logger.warn('Master server unhealthy, considering failover', {
                masterId: this.currentMaster.id,
                status: masterStatus.status,
                error: masterStatus.lastError
            });
            await this.initiateFailover('Master server unhealthy');
        }
    }
    async performHealthChecks() {
        const healthPromises = [];
        for (const server of this.servers.values()) {
            if (server.isActive && server.connectionPool) {
                healthPromises.push(this.checkServerHealth(server));
            }
        }
        await Promise.allSettled(healthPromises);
    }
    async checkServerHealth(server) {
        try {
            const connection = await server.connectionPool.getConnection();
            await connection.ping();
            connection.release();
            // Update server as active if it was previously inactive
            if (!server.isActive) {
                server.isActive = true;
                logger_1.logger.info('Server recovered', { serverId: server.id });
                this.emit('serverRecovered', server);
            }
        }
        catch (error) {
            if (server.isActive) {
                server.isActive = false;
                logger_1.logger.error('Server health check failed', {
                    serverId: server.id,
                    error: (error instanceof Error ? error : new Error(String(error))).message
                });
                this.emit('serverFailed', server);
            }
        }
    }
    async collectMetrics() {
        const activeServers = Array.from(this.servers.values()).filter(s => s.isActive);
        const healthyServers = activeServers.filter(s => {
            const status = this.replicationStatus.get(s.id);
            return status?.isHealthy;
        });
        const lagValues = Array.from(this.replicationStatus.values())
            .filter(status => status.role === 'slave')
            .map(status => status.lagSeconds);
        const metrics = {
            timestamp: new Date(),
            totalServers: this.servers.size,
            activeServers: activeServers.length,
            healthyServers: healthyServers.length,
            averageLag: lagValues.length > 0 ? lagValues.reduce((sum, lag) => sum + lag, 0) / lagValues.length : 0,
            maxLag: lagValues.length > 0 ? Math.max(...lagValues) : 0,
            failoverCount: this.failoverEvents.length,
            uptime: this.isInitialized ? Date.now() - this.getInitializationTime() : 0,
            dataConsistency: await this.checkDataConsistency()
        };
        this.metrics.push(metrics);
        // Keep only recent metrics (last 24 hours)
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    }
    getInitializationTime() {
        // This would need to be tracked properly
        return Date.now() - 60 * 60 * 1000; // Simplified: assume 1 hour ago
    }
    async checkDataConsistency() {
        try {
            if (!this.currentMaster)
                return 'unknown';
            // Simple consistency check: compare row counts between master and slaves
            const slaves = Array.from(this.servers.values()).filter(s => s.role === 'slave' && s.isActive);
            if (slaves.length === 0)
                return 'unknown';
            // Get master table checksums
            const masterChecksums = await this.getTableChecksums(this.currentMaster);
            // Compare with slaves
            for (const slave of slaves) {
                const slaveChecksums = await this.getTableChecksums(slave);
                for (const [table, masterChecksum] of masterChecksums.entries()) {
                    const slaveChecksum = slaveChecksums.get(table);
                    if (slaveChecksum && slaveChecksum !== masterChecksum) {
                        return 'inconsistent';
                    }
                }
            }
            return 'consistent';
        }
        catch (error) {
            logger_1.logger.debug('Could not check data consistency', { error: error.message });
            return 'unknown';
        }
    }
    async getTableChecksums(server) {
        const checksums = new Map();
        if (!server.connectionPool)
            return checksums;
        try {
            // Get table list
            const [tables] = await server.connectionPool.execute(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ? 
        AND TABLE_TYPE = 'BASE TABLE'
      `, [server.database]);
            // Calculate checksums for each table (simplified)
            for (const table of tables) {
                try {
                    const [rows] = await server.connectionPool.execute(`
            SELECT COUNT(*) as count 
            FROM ${table.TABLE_NAME}
          `);
                    checksums.set(table.TABLE_NAME, rows[0].count.toString());
                }
                catch (error) {
                    // Skip tables that can't be accessed
                }
            }
        }
        catch (error) {
            logger_1.logger.debug('Failed to get table checksums', {
                serverId: server.id,
                error: error.message
            });
        }
        return checksums;
    }
    async initiateFailover(reason, targetServerId) {
        const failoverEvent = {
            id: this.generateFailoverId(),
            timestamp: new Date(),
            type: targetServerId ? 'manual' : 'automatic',
            reason,
            oldMaster: this.currentMaster?.id || 'unknown',
            newMaster: 'pending',
            duration: 0,
            success: false
        };
        try {
            logger_1.logger.warn('Initiating database failover', {
                failoverId: failoverEvent.id,
                reason,
                oldMaster: failoverEvent.oldMaster,
                targetSlave: targetServerId
            });
            const startTime = Date.now();
            // Select new master
            const newMaster = await this.selectNewMaster(targetServerId);
            if (!newMaster) {
                throw new Error('No suitable server found for promotion');
            }
            failoverEvent.newMaster = newMaster.id;
            // Promote new master
            await this.promoteToMaster(newMaster.id);
            // Update slave configurations to point to new master
            await this.reconfigureSlaves(newMaster);
            failoverEvent.duration = Date.now() - startTime;
            failoverEvent.success = true;
            this.failoverEvents.push(failoverEvent);
            logger_1.logger.info('Failover completed successfully', {
                failoverId: failoverEvent.id,
                newMaster: newMaster.id,
                duration: failoverEvent.duration
            });
            this.emit('failoverCompleted', failoverEvent);
            return failoverEvent.id;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            failoverEvent.error = errorMessage;
            failoverEvent.duration = Date.now() - failoverEvent.timestamp.getTime();
            this.failoverEvents.push(failoverEvent);
            logger_1.logger.error('Failover failed', {
                failoverId: failoverEvent.id,
                error: errorMessage
            });
            this.emit('failoverFailed', failoverEvent);
            throw error;
        }
    }
    async selectNewMaster(targetServerId) {
        if (targetServerId) {
            const target = this.servers.get(targetServerId);
            if (target && target.isActive && target.role === 'slave') {
                return target;
            }
        }
        // Select best candidate based on priority and lag
        const candidates = Array.from(this.servers.values())
            .filter(s => s.role === 'slave' && s.isActive)
            .map(server => {
            const status = this.replicationStatus.get(server.id);
            return {
                server,
                status,
                score: server.priority - (status?.lagSeconds || 999) // Higher priority, lower lag = higher score
            };
        })
            .filter(candidate => candidate.status?.isHealthy)
            .sort((a, b) => b.score - a.score);
        return candidates.length > 0 ? candidates[0].server : null;
    }
    async promoteToMaster(serverId) {
        const server = this.servers.get(serverId);
        if (!server || !server.connectionPool) {
            throw new Error(`Server ${serverId} not found or not connected`);
        }
        try {
            // Stop slave processes
            await server.connectionPool.execute('STOP SLAVE');
            // Reset master configuration
            await server.connectionPool.execute('RESET MASTER');
            // Update server role
            const oldMaster = this.currentMaster;
            if (oldMaster) {
                oldMaster.role = 'slave';
                oldMaster.isActive = false; // Disable failed master
            }
            server.role = 'master';
            this.currentMaster = server;
            logger_1.logger.info('Server promoted to master', {
                serverId,
                host: server.host
            });
        }
        catch (error) {
            throw new Error(`Failed to promote ${serverId} to master: ${error.message}`);
        }
    }
    async reconfigureSlaves(newMaster) {
        const slaves = Array.from(this.servers.values())
            .filter(s => s.role === 'slave' && s.isActive && s.id !== newMaster.id);
        const reconfigurePromises = slaves.map(slave => this.reconfigureSlave(slave, newMaster));
        await Promise.allSettled(reconfigurePromises);
    }
    async reconfigureSlave(slave, newMaster) {
        if (!slave.connectionPool)
            return;
        try {
            // Stop current replication
            await slave.connectionPool.execute('STOP SLAVE');
            // Configure new master
            await slave.connectionPool.execute(`
        CHANGE MASTER TO
        MASTER_HOST = ?,
        MASTER_PORT = ?,
        MASTER_USER = ?,
        MASTER_PASSWORD = ?,
        MASTER_AUTO_POSITION = 1
      `, [newMaster.host, newMaster.port, newMaster.user, newMaster.password]);
            // Start replication
            await slave.connectionPool.execute('START SLAVE');
            logger_1.logger.info('Slave reconfigured for new master', {
                slaveId: slave.id,
                newMasterId: newMaster.id
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to reconfigure slave', {
                slaveId: slave.id,
                newMasterId: newMaster.id,
                error: error.message
            });
        }
    }
    generateFailoverId() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const random = Math.random().toString(36).substring(2, 8);
        return `failover-${timestamp}-${random}`;
    }
    // Public API methods
    async getReplicationStatus() {
        return Array.from(this.replicationStatus.values());
    }
    async getServerHealth() {
        return Array.from(this.servers.values()).map(server => {
            const status = this.replicationStatus.get(server.id);
            return {
                serverId: server.id,
                isHealthy: status?.isHealthy || false,
                role: server.role,
                lastCheck: status?.lastCheck || new Date(0)
            };
        });
    }
    async getFailoverHistory() {
        return [...this.failoverEvents];
    }
    async getReplicationMetrics() {
        return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
    }
    getCurrentMaster() {
        return this.currentMaster;
    }
    async manualFailover(targetServerId) {
        return this.initiateFailover('Manual failover initiated', targetServerId);
    }
    async shutdown() {
        logger_1.logger.info('Shutting down database replication service...');
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.scheduledTasks.forEach((task, name) => {
            task.stop();
            logger_1.logger.debug(`Stopped scheduled task: ${name}`);
        });
        this.scheduledTasks.clear();
        // Close all connection pools
        for (const server of this.servers.values()) {
            if (server.connectionPool) {
                await server.connectionPool.end();
            }
        }
        this.isInitialized = false;
        logger_1.logger.info('Database replication service shutdown completed');
    }
}
// Create and export singleton instance
exports.databaseReplicationService = new DatabaseReplicationService();
exports.default = exports.databaseReplicationService;
