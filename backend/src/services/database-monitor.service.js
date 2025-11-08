"use strict";
/**
 * Database Performance Monitoring Service for RevEd Kids
 * Provides comprehensive monitoring, alerting, and performance analytics
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseMonitorService = void 0;
const connection_1 = require("../db/connection");
const logger_1 = require("../utils/logger");
const config_1 = require("../config/config");
const node_cron_1 = __importDefault(require("node-cron"));
const events_1 = require("events");
class DatabaseMonitorService extends events_1.EventEmitter {
    constructor() {
        super();
        this.metrics = [];
        this.alerts = [];
        this.isEnabled = false;
        this.monitoringInterval = null;
        this.scheduledTasks = new Map();
        this.queryStats = new Map();
        this.lastMetricsCollection = new Date();
        this.config = {
            enabled: process.env.DB_MONITORING_ENABLED === 'true' || true,
            collectionInterval: parseInt(process.env.DB_MONITORING_INTERVAL || '60'), // 1 minute
            alertingEnabled: process.env.DB_ALERTING_ENABLED === 'true' || true,
            retentionDays: parseInt(process.env.DB_METRICS_RETENTION_DAYS || '7'),
            thresholds: {
                connectionUtilization: 85, // 85%
                slowQueryThreshold: 1000, // 1 second
                lockWaitThreshold: 10, // 10 seconds
                bufferPoolHitRate: 95, // 95%
                diskSpaceThreshold: 85, // 85%
                replicationLag: 60, // 60 seconds
            },
            notifications: {
                email: {
                    enabled: false,
                    recipients: [],
                    smtpConfig: null
                },
                webhook: {
                    enabled: process.env.DB_WEBHOOK_ENABLED === 'true' || false,
                    url: process.env.DB_WEBHOOK_URL || '',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.DB_WEBHOOK_TOKEN || ''}`
                    }
                }
            }
        };
    }
    async initialize() {
        if (!this.config.enabled) {
            logger_1.logger.info('Database monitoring disabled');
            return;
        }
        try {
            logger_1.logger.info('Initializing database monitoring service...', {
                collectionInterval: this.config.collectionInterval,
                alertingEnabled: this.config.alertingEnabled
            });
            // Setup metric collection interval
            this.setupMetricCollection();
            // Setup scheduled analysis tasks
            this.setupScheduledTasks();
            // Setup slow query monitoring
            await this.enableSlowQueryLogging();
            this.isEnabled = true;
            logger_1.logger.info('Database monitoring service initialized successfully');
            this.emit('initialized');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize database monitoring service', { error });
            throw error;
        }
    }
    setupMetricCollection() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        this.monitoringInterval = setInterval(async () => {
            try {
                await this.collectMetrics();
            }
            catch (error) {
                logger_1.logger.error('Error collecting database metrics', { error });
            }
        }, this.config.collectionInterval * 1000);
        logger_1.logger.debug('Database metric collection scheduled', {
            intervalSeconds: this.config.collectionInterval
        });
    }
    setupScheduledTasks() {
        // Daily comprehensive analysis
        const dailyAnalysis = node_cron_1.default.schedule('0 2 * * *', async () => {
            try {
                await this.performComprehensiveAnalysis();
            }
            catch (error) {
                logger_1.logger.error('Daily database analysis failed', { error });
            }
        }, { name: 'daily-db-analysis' });
        // Hourly query analysis
        const hourlyQueryAnalysis = node_cron_1.default.schedule('0 * * * *', async () => {
            try {
                await this.analyzeSlowQueries();
            }
            catch (error) {
                logger_1.logger.error('Hourly query analysis failed', { error });
            }
        }, { name: 'hourly-query-analysis' });
        // Cleanup old metrics (daily at 3 AM)
        const cleanupTask = node_cron_1.default.schedule('0 3 * * *', async () => {
            try {
                await this.cleanupOldMetrics();
            }
            catch (error) {
                logger_1.logger.error('Metrics cleanup failed', { error });
            }
        }, { name: 'metrics-cleanup' });
        this.scheduledTasks.set('daily-analysis', dailyAnalysis);
        this.scheduledTasks.set('hourly-query-analysis', hourlyQueryAnalysis);
        this.scheduledTasks.set('cleanup', cleanupTask);
        logger_1.logger.info('Database monitoring scheduled tasks configured');
    }
    async enableSlowQueryLogging() {
        try {
            const slowQueryThreshold = this.config.thresholds.slowQueryThreshold / 1000; // Convert to seconds
            await connection_1.connection.execute(`SET GLOBAL slow_query_log = 'ON'`);
            await connection_1.connection.execute(`SET GLOBAL long_query_time = ?`, [slowQueryThreshold]);
            await connection_1.connection.execute(`SET GLOBAL log_queries_not_using_indexes = 'ON'`);
            logger_1.logger.info('Slow query logging enabled', {
                threshold: slowQueryThreshold
            });
        }
        catch (error) {
            logger_1.logger.warn('Could not enable slow query logging - insufficient privileges', { error });
        }
    }
    async collectMetrics() {
        const startTime = Date.now();
        try {
            // Collect all metrics in parallel
            const [connectionMetrics, queryMetrics, performanceMetrics, storageMetrics, replicationMetrics] = await Promise.allSettled([
                this.getConnectionMetrics(),
                this.getQueryMetrics(),
                this.getPerformanceMetrics(),
                this.getStorageMetrics(),
                this.getReplicationMetrics()
            ]);
            const metrics = {
                timestamp: new Date(),
                connections: connectionMetrics.status === 'fulfilled' ? connectionMetrics.value : this.getDefaultConnectionMetrics(),
                queries: queryMetrics.status === 'fulfilled' ? queryMetrics.value : this.getDefaultQueryMetrics(),
                performance: performanceMetrics.status === 'fulfilled' ? performanceMetrics.value : this.getDefaultPerformanceMetrics(),
                storage: storageMetrics.status === 'fulfilled' ? storageMetrics.value : this.getDefaultStorageMetrics(),
                replication: replicationMetrics.status === 'fulfilled' ? replicationMetrics.value : undefined
            };
            // Store metrics
            this.metrics.push(metrics);
            this.limitMetricsHistory();
            // Check for alerts
            if (this.config.alertingEnabled) {
                await this.checkAlerts(metrics);
            }
            const collectionTime = Date.now() - startTime;
            logger_1.logger.debug('Database metrics collected', {
                collectionTimeMs: collectionTime,
                connectionsActive: metrics.connections.active,
                queriesPerSecond: metrics.queries.queriesPerSecond,
                cpuUsage: metrics.performance.cpuUsage
            });
            this.emit('metricsCollected', metrics);
        }
        catch (error) {
            logger_1.logger.error('Failed to collect database metrics', { error });
        }
    }
    async getConnectionMetrics() {
        const poolStats = (0, connection_1.getPoolStats)();
        const utilization = poolStats.totalConnections > 0
            ? (poolStats.activeConnections / poolStats.totalConnections) * 100
            : 0;
        return {
            active: poolStats.activeConnections,
            idle: poolStats.idleConnections,
            total: poolStats.totalConnections,
            utilization,
            queueLength: poolStats.queuedRequests
        };
    }
    async getQueryMetrics() {
        try {
            const [statusRows] = await connection_1.connection.execute(`
        SHOW GLOBAL STATUS WHERE Variable_name IN (
          'Questions', 'Slow_queries', 'Uptime', 'Com_select', 'Com_insert', 'Com_update', 'Com_delete'
        )
      `);
            const status = this.parseStatusVariables(statusRows);
            const uptime = parseInt(status.Uptime || '1');
            const totalQueries = parseInt(status.Questions || '0');
            const slowQueries = parseInt(status.Slow_queries || '0');
            const queriesPerSecond = totalQueries / uptime;
            // Calculate average query time from recent samples
            const recentMetrics = this.metrics.slice(-5);
            const avgQueryTime = recentMetrics.length > 0
                ? recentMetrics.reduce((sum, m) => sum + m.queries.averageQueryTime, 0) / recentMetrics.length
                : 0;
            return {
                slowQueries,
                totalQueries,
                averageQueryTime: avgQueryTime,
                queriesPerSecond
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get query metrics', { error });
            return this.getDefaultQueryMetrics();
        }
    }
    async getPerformanceMetrics() {
        try {
            const [statusRows] = await connection_1.connection.execute(`
        SHOW GLOBAL STATUS WHERE Variable_name IN (
          'Innodb_buffer_pool_read_requests', 'Innodb_buffer_pool_reads',
          'Innodb_row_lock_waits', 'Innodb_row_lock_time',
          'Innodb_data_reads', 'Innodb_data_writes'
        )
      `);
            const status = this.parseStatusVariables(statusRows);
            const bufferPoolReadRequests = parseInt(status.Innodb_buffer_pool_read_requests || '0');
            const bufferPoolReads = parseInt(status.Innodb_buffer_pool_reads || '0');
            const bufferPoolHitRate = bufferPoolReadRequests > 0
                ? ((bufferPoolReadRequests - bufferPoolReads) / bufferPoolReadRequests) * 100
                : 0;
            const lockWaits = parseInt(status.Innodb_row_lock_waits || '0');
            const lockTime = parseInt(status.Innodb_row_lock_time || '0');
            const lockWaitTime = lockWaits > 0 ? lockTime / lockWaits : 0;
            return {
                cpuUsage: await this.getCPUUsage(),
                memoryUsage: await this.getMemoryUsage(),
                diskIO: {
                    reads: parseInt(status.Innodb_data_reads || '0'),
                    writes: parseInt(status.Innodb_data_writes || '0'),
                    readLatency: 0, // Would need additional monitoring
                    writeLatency: 0
                },
                bufferPoolHitRate,
                lockWaitTime: lockWaitTime / 1000 // Convert to seconds
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get performance metrics', { error });
            return this.getDefaultPerformanceMetrics();
        }
    }
    async getCPUUsage() {
        // Simplified CPU usage - in production, use system monitoring
        const os = require('os');
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;
        cpus.forEach(cpu => {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });
        return ((totalTick - totalIdle) / totalTick) * 100;
    }
    async getMemoryUsage() {
        try {
            const [rows] = await connection_1.connection.execute(`
        SELECT 
          (@@innodb_buffer_pool_size + @@key_buffer_size + @@query_cache_size + 
           @@tmp_table_size + @@max_connections * @@thread_stack) / (1024*1024*1024) as estimated_memory_gb
      `);
            return rows[0]?.estimated_memory_gb || 0;
        }
        catch (error) {
            return 0;
        }
    }
    async getStorageMetrics() {
        try {
            const [rows] = await connection_1.connection.execute(`
        SELECT 
          ROUND(SUM(data_length), 0) as data_size,
          ROUND(SUM(index_length), 0) as index_size,
          ROUND(SUM(data_length + index_length), 0) as total_size,
          COUNT(*) as table_count
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
      `);
            const result = rows[0];
            // Get free space (simplified)
            const [spaceRows] = await connection_1.connection.execute(`
        SELECT 
          ROUND(SUM(data_free), 0) as free_space
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
      `);
            const freeSpace = spaceRows[0]?.free_space || 0;
            return {
                databaseSize: parseInt(result.data_size || '0'),
                indexSize: parseInt(result.index_size || '0'),
                totalSize: parseInt(result.total_size || '0'),
                freeSpace: parseInt(freeSpace),
                tableCount: parseInt(result.table_count || '0')
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get storage metrics', { error });
            return this.getDefaultStorageMetrics();
        }
    }
    async getReplicationMetrics() {
        try {
            const [rows] = await connection_1.connection.execute('SHOW SLAVE STATUS');
            if (rows.length === 0) {
                return undefined; // Not a slave
            }
            const status = rows[0];
            const lag = status.Seconds_Behind_Master;
            return {
                lag: lag !== null ? parseInt(lag) : 0,
                status: status.Slave_SQL_Running === 'Yes' && status.Slave_IO_Running === 'Yes' ? 'running' : 'error',
                slaveThreads: {
                    sql: status.Slave_SQL_Running === 'Yes',
                    io: status.Slave_IO_Running === 'Yes'
                }
            };
        }
        catch (error) {
            // Not a replication setup or insufficient privileges
            return undefined;
        }
    }
    parseStatusVariables(rows) {
        const status = {};
        rows.forEach(row => {
            status[row.Variable_name] = row.Value;
        });
        return status;
    }
    async checkAlerts(metrics) {
        const newAlerts = [];
        // Connection utilization alert
        if (metrics.connections.utilization > this.config.thresholds.connectionUtilization) {
            newAlerts.push({
                id: this.generateAlertId(),
                type: metrics.connections.utilization > 95 ? 'critical' : 'warning',
                category: 'connection',
                title: 'High Connection Pool Utilization',
                description: `Connection pool utilization is at ${metrics.connections.utilization.toFixed(1)}%`,
                threshold: this.config.thresholds.connectionUtilization,
                currentValue: metrics.connections.utilization,
                timestamp: new Date(),
                resolved: false
            });
        }
        // Buffer pool hit rate alert
        if (metrics.performance.bufferPoolHitRate < this.config.thresholds.bufferPoolHitRate) {
            newAlerts.push({
                id: this.generateAlertId(),
                type: 'warning',
                category: 'resource',
                title: 'Low Buffer Pool Hit Rate',
                description: `Buffer pool hit rate is ${metrics.performance.bufferPoolHitRate.toFixed(1)}%`,
                threshold: this.config.thresholds.bufferPoolHitRate,
                currentValue: metrics.performance.bufferPoolHitRate,
                timestamp: new Date(),
                resolved: false
            });
        }
        // Lock wait time alert
        if (metrics.performance.lockWaitTime > this.config.thresholds.lockWaitThreshold) {
            newAlerts.push({
                id: this.generateAlertId(),
                type: 'error',
                category: 'query',
                title: 'High Lock Wait Time',
                description: `Average lock wait time is ${metrics.performance.lockWaitTime.toFixed(2)} seconds`,
                threshold: this.config.thresholds.lockWaitThreshold,
                currentValue: metrics.performance.lockWaitTime,
                timestamp: new Date(),
                resolved: false
            });
        }
        // Replication lag alert
        if (metrics.replication && metrics.replication.lag > this.config.thresholds.replicationLag) {
            newAlerts.push({
                id: this.generateAlertId(),
                type: 'error',
                category: 'replication',
                title: 'High Replication Lag',
                description: `Replication lag is ${metrics.replication.lag} seconds`,
                threshold: this.config.thresholds.replicationLag,
                currentValue: metrics.replication.lag,
                timestamp: new Date(),
                resolved: false
            });
        }
        // Process new alerts
        for (const alert of newAlerts) {
            await this.processAlert(alert);
        }
    }
    async processAlert(alert) {
        this.alerts.push(alert);
        logger_1.logger.warn('Database performance alert triggered', {
            alertId: alert.id,
            type: alert.type,
            category: alert.category,
            title: alert.title,
            currentValue: alert.currentValue,
            threshold: alert.threshold
        });
        this.emit('alert', alert);
        // Send notifications
        if (this.config.notifications.webhook?.enabled) {
            await this.sendWebhookNotification(alert);
        }
    }
    async sendWebhookNotification(alert) {
        try {
            const payload = {
                type: 'database_alert',
                alert: {
                    id: alert.id,
                    type: alert.type,
                    category: alert.category,
                    title: alert.title,
                    description: alert.description,
                    currentValue: alert.currentValue,
                    threshold: alert.threshold,
                    timestamp: alert.timestamp.toISOString()
                },
                service: 'reved-kids-backend',
                environment: config_1.config.NODE_ENV
            };
            // In production, use actual HTTP client like axios
            logger_1.logger.info('Webhook notification sent', {
                alertId: alert.id,
                webhookUrl: this.config.notifications.webhook.url
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to send webhook notification', { alertId: alert.id, error });
        }
    }
    async analyzeSlowQueries() {
        try {
            // Analyze slow query log (simplified implementation)
            const [rows] = await connection_1.connection.execute(`
        SELECT 
          sql_text as query_text,
          count_star as count,
          sum_timer_wait/1000000000000 as total_time_sec,
          avg_timer_wait/1000000000000 as avg_time_sec,
          min_timer_wait/1000000000000 as min_time_sec,
          max_timer_wait/1000000000000 as max_time_sec
        FROM performance_schema.events_statements_summary_by_digest
        WHERE avg_timer_wait/1000000000000 > ?
        ORDER BY avg_timer_wait DESC
        LIMIT 20
      `, [this.config.thresholds.slowQueryThreshold / 1000]);
            const slowQueries = rows;
            logger_1.logger.info('Slow query analysis completed', {
                slowQueryCount: slowQueries.length,
                threshold: this.config.thresholds.slowQueryThreshold
            });
            this.emit('slowQueryAnalysis', slowQueries);
        }
        catch (error) {
            logger_1.logger.debug('Slow query analysis not available', { error: error.message });
        }
    }
    async performComprehensiveAnalysis() {
        try {
            logger_1.logger.info('Starting comprehensive database analysis...');
            const [tableAnalysis, indexAnalysis] = await Promise.allSettled([
                this.analyzeTableHealth(),
                this.analyzeIndexUsage()
            ]);
            const analysis = {
                timestamp: new Date(),
                tables: tableAnalysis.status === 'fulfilled' ? tableAnalysis.value : [],
                indexes: indexAnalysis.status === 'fulfilled' ? indexAnalysis.value : []
            };
            logger_1.logger.info('Comprehensive database analysis completed', {
                tablesAnalyzed: analysis.tables.length,
                indexesAnalyzed: analysis.indexes.length
            });
            this.emit('comprehensiveAnalysis', analysis);
        }
        catch (error) {
            logger_1.logger.error('Comprehensive database analysis failed', { error });
        }
    }
    async analyzeTableHealth() {
        try {
            const [rows] = await connection_1.connection.execute(`
        SELECT 
          TABLE_NAME as table_name,
          TABLE_ROWS as row_count,
          DATA_LENGTH as data_size,
          INDEX_LENGTH as index_size,
          AVG_ROW_LENGTH as avg_row_length,
          DATA_FREE as fragmentation,
          UPDATE_TIME as last_updated
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
      `);
            return rows.map(row => {
                const fragmentationRatio = row.data_size > 0
                    ? (row.fragmentation / row.data_size) * 100
                    : 0;
                const recommendedActions = [];
                if (fragmentationRatio > 10) {
                    recommendedActions.push('OPTIMIZE TABLE to reduce fragmentation');
                }
                if (row.index_size > row.data_size * 2) {
                    recommendedActions.push('Review index usage - too many indexes');
                }
                if (row.row_count > 1000000 && !row.table_name.includes('_archive')) {
                    recommendedActions.push('Consider archiving old data');
                }
                return {
                    tableName: row.table_name,
                    rowCount: parseInt(row.row_count || '0'),
                    dataSize: parseInt(row.data_size || '0'),
                    indexSize: parseInt(row.index_size || '0'),
                    avgRowLength: parseInt(row.avg_row_length || '0'),
                    fragmentationRatio,
                    lastUpdated: row.last_updated ? new Date(row.last_updated) : new Date(),
                    recommendedActions
                };
            });
        }
        catch (error) {
            logger_1.logger.error('Table health analysis failed', { error });
            return [];
        }
    }
    async analyzeIndexUsage() {
        try {
            const [rows] = await connection_1.connection.execute(`
        SELECT 
          TABLE_NAME,
          INDEX_NAME,
          COLUMN_NAME,
          CARDINALITY,
          INDEX_TYPE
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
      `);
            // Group by index for analysis
            const indexMap = new Map();
            rows.forEach(row => {
                const key = `${row.TABLE_NAME}.${row.INDEX_NAME}`;
                if (!indexMap.has(key)) {
                    indexMap.set(key, {
                        tableName: row.TABLE_NAME,
                        indexName: row.INDEX_NAME,
                        columns: [],
                        cardinality: 0,
                        type: row.INDEX_TYPE
                    });
                }
                const index = indexMap.get(key);
                index.columns.push(row.COLUMN_NAME);
                index.cardinality = Math.max(index.cardinality, row.CARDINALITY || 0);
            });
            return Array.from(indexMap.values());
        }
        catch (error) {
            logger_1.logger.error('Index usage analysis failed', { error });
            return [];
        }
    }
    // Default metrics for fallback
    getDefaultConnectionMetrics() {
        return { active: 0, idle: 0, total: 0, utilization: 0, queueLength: 0 };
    }
    getDefaultQueryMetrics() {
        return { slowQueries: 0, totalQueries: 0, averageQueryTime: 0, queriesPerSecond: 0 };
    }
    getDefaultPerformanceMetrics() {
        return {
            cpuUsage: 0,
            memoryUsage: 0,
            diskIO: { reads: 0, writes: 0, readLatency: 0, writeLatency: 0 },
            bufferPoolHitRate: 100,
            lockWaitTime: 0
        };
    }
    getDefaultStorageMetrics() {
        return { databaseSize: 0, indexSize: 0, totalSize: 0, freeSpace: 0, tableCount: 0 };
    }
    limitMetricsHistory() {
        const maxEntries = (this.config.retentionDays * 24 * 60) / (this.config.collectionInterval / 60);
        if (this.metrics.length > maxEntries) {
            this.metrics = this.metrics.slice(-maxEntries);
        }
    }
    async cleanupOldMetrics() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
        const beforeCount = this.metrics.length;
        this.metrics = this.metrics.filter(metric => metric.timestamp > cutoffDate);
        const removedCount = beforeCount - this.metrics.length;
        if (removedCount > 0) {
            logger_1.logger.info('Old metrics cleaned up', {
                removedCount,
                retentionDays: this.config.retentionDays
            });
        }
    }
    generateAlertId() {
        return `alert-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    }
    // Public API methods
    async getLatestMetrics() {
        return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
    }
    async getMetricsHistory(hours = 24) {
        const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
        return this.metrics.filter(metric => metric.timestamp > cutoffTime);
    }
    async getActiveAlerts() {
        return this.alerts.filter(alert => !alert.resolved);
    }
    async resolveAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert && !alert.resolved) {
            alert.resolved = true;
            alert.resolvedAt = new Date();
            logger_1.logger.info('Alert resolved', { alertId });
            this.emit('alertResolved', alert);
            return true;
        }
        return false;
    }
    async getHealthStatus() {
        const latestMetrics = await this.getLatestMetrics();
        const activeAlerts = await this.getActiveAlerts();
        let status = 'healthy';
        let summary = 'All systems operating normally';
        if (activeAlerts.some(a => a.type === 'critical')) {
            status = 'critical';
            summary = 'Critical issues detected requiring immediate attention';
        }
        else if (activeAlerts.length > 0) {
            status = 'warning';
            summary = `${activeAlerts.length} performance warning(s) detected`;
        }
        return {
            status,
            summary,
            metrics: latestMetrics,
            activeAlerts: activeAlerts.length,
            lastCheck: latestMetrics?.timestamp || null
        };
    }
    async shutdown() {
        logger_1.logger.info('Shutting down database monitoring service...');
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.scheduledTasks.forEach((task, name) => {
            task.stop();
            logger_1.logger.debug(`Stopped scheduled task: ${name}`);
        });
        this.scheduledTasks.clear();
        this.isEnabled = false;
        logger_1.logger.info('Database monitoring service shutdown completed');
    }
}
// Create and export singleton instance
exports.databaseMonitorService = new DatabaseMonitorService();
exports.default = exports.databaseMonitorService;
