"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditTrailService = void 0;
const crypto = __importStar(require("crypto"));
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const encryption_service_1 = require("./encryption.service");
const connection_1 = require("../db/connection");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const csv_writer_1 = require("csv-writer");
// Validation schemas
const AuditActionSchema = zod_1.z.object({
    entityType: zod_1.z.enum([
        'student',
        'parent',
        'exercise',
        'progress',
        'parental_consent',
        'gdpr_request',
        'data_export',
        'encryption',
        'key_rotation',
        'key_revocation',
        'user_session',
        'admin_action',
        'anonymization_job',
        'retention_policy',
        'retention_execution',
        'retention_schedule',
        'retention_report'
    ]),
    entityId: zod_1.z.string(),
    action: zod_1.z.enum([
        'create',
        'read',
        'update',
        'delete',
        'export',
        'anonymize',
        'consent_given',
        'consent_revoked',
        'login',
        'logout',
        'access_denied',
        'encrypt',
        'decrypt',
        'key_generated',
        'key_rotated',
        'emergency_revoked',
        'data_retention_applied',
        'first_consent',
        'second_consent',
        'verified',
        'completed',
        'failed',
        'created',
        'revoked'
    ]),
    userId: zod_1.z.string().nullable(),
    parentId: zod_1.z.string().optional(),
    studentId: zod_1.z.string().optional(),
    details: zod_1.z.record(zod_1.z.any()),
    ipAddress: zod_1.z.string().ip().optional(),
    userAgent: zod_1.z.string().optional(),
    timestamp: zod_1.z.date().default(() => new Date()),
    severity: zod_1.z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    category: zod_1.z.enum([
        'data_access',
        'data_modification',
        'consent_management',
        'security',
        'compliance',
        'system',
        'user_behavior'
    ]).optional()
});
const AuditQuerySchema = zod_1.z.object({
    entityType: zod_1.z.string().optional(),
    entityId: zod_1.z.string().optional(),
    action: zod_1.z.string().optional(),
    userId: zod_1.z.string().optional(),
    studentId: zod_1.z.string().optional(),
    startDate: zod_1.z.date().optional(),
    endDate: zod_1.z.date().optional(),
    severity: zod_1.z.array(zod_1.z.string()).optional(),
    category: zod_1.z.string().optional(),
    limit: zod_1.z.number().min(1).max(1000).default(100),
    offset: zod_1.z.number().min(0).default(0),
    includeDetails: zod_1.z.boolean().default(false)
});
class AuditTrailService {
    constructor() {
        this.sessionCorrelations = new Map();
        this.encryptionService = new encryption_service_1.EncryptionService();
        this.initializeAuditSystem();
    }
    /**
     * Log an audit action
     */
    async logAction(actionData) {
        try {
            const validatedData = AuditActionSchema.parse(actionData);
            // Generate unique audit ID
            const auditId = crypto.randomUUID();
            // Generate correlation ID for session tracking
            const correlationId = this.getOrCreateCorrelationId(validatedData.userId);
            // Determine if details should be encrypted
            const shouldEncrypt = this.shouldEncryptDetails(validatedData.action, validatedData.entityType);
            let encryptedDetails = validatedData.details;
            let encrypted = false;
            if (shouldEncrypt) {
                encryptedDetails = await this.encryptionService.encryptStudentData(validatedData.details);
                encrypted = true;
            }
            // Create audit entry
            const auditEntry = {
                id: auditId,
                entityType: validatedData.entityType,
                entityId: validatedData.entityId,
                action: validatedData.action,
                userId: validatedData.userId,
                parentId: validatedData.parentId,
                studentId: validatedData.studentId,
                details: encryptedDetails,
                ipAddress: validatedData.ipAddress,
                userAgent: validatedData.userAgent,
                timestamp: validatedData.timestamp,
                severity: validatedData.severity,
                category: validatedData.category || this.categorizeAction(validatedData.action),
                correlationId,
                checksum: '', // Will be calculated
                encrypted
            };
            // Calculate integrity checksum
            auditEntry.checksum = this.calculateChecksum(auditEntry);
            // Store audit entry
            await this.storeAuditEntry(auditEntry);
            // Check for security anomalies
            await this.detectSecurityAnomalies(auditEntry);
            // Log to system logger for immediate monitoring
            this.logToSystemLogger(auditEntry);
            logger_1.logger.debug('Audit action logged', {
                auditId,
                action: validatedData.action,
                entityType: validatedData.entityType
            });
            return auditId;
        }
        catch (error) {
            logger_1.logger.error('Error logging audit action:', error);
            // Don't throw - audit failures shouldn't break main functionality
            return '';
        }
    }
    /**
     * Query audit logs with filters
     */
    async queryAuditLogs(queryParams) {
        try {
            const validatedQuery = AuditQuerySchema.parse(queryParams);
            // Build query filters
            const filters = this.buildQueryFilters(validatedQuery);
            // Execute query
            const { entries, total } = await this.executeAuditQuery(filters, validatedQuery);
            // Decrypt details if requested and user has permission
            if (validatedQuery.includeDetails) {
                for (const entry of entries) {
                    if (entry.encrypted) {
                        try {
                            entry.details = await this.encryptionService.decryptStudentData(entry.details);
                            entry.encrypted = false;
                        }
                        catch (error) {
                            logger_1.logger.warn(`Failed to decrypt audit details for entry ${entry.id}:`, error);
                        }
                    }
                }
            }
            const hasMore = validatedQuery.offset + entries.length < total;
            return { entries, total, hasMore };
        }
        catch (error) {
            logger_1.logger.error('Error querying audit logs:', error);
            throw new Error('Failed to query audit logs');
        }
    }
    /**
     * Generate compliance report
     */
    async generateComplianceReport(startDate, endDate, entityType, format = 'json', userContext) {
        try {
            const reportId = crypto.randomUUID();
            // Query audit entries for the period
            const entries = await this.getAuditEntriesForPeriod(startDate, endDate, entityType);
            // Analyze entries
            const analysis = this.analyzeAuditEntries(entries);
            // Generate report
            const report = {
                id: reportId,
                title: `Compliance Report ${entityType ? `- ${entityType}` : ''}`,
                description: `Audit trail report for period ${startDate.toISOString()} to ${endDate.toISOString()}`,
                generatedBy: userContext ? userContext.email : 'system',
                generatedAt: new Date(),
                period: { startDate, endDate },
                filters: { entityType },
                totalEntries: entries.length,
                categories: analysis.categories,
                topActions: analysis.topActions,
                securityAlerts: analysis.securityAlerts,
                complianceIssues: analysis.complianceIssues,
                exportFormat: format
            };
            // Export report in requested format
            if (format !== 'json') {
                report.filePath = await this.exportReport(report, entries, format);
            }
            // Log report generation
            await this.logAction({
                entityType: 'admin_action',
                entityId: reportId,
                action: 'create',
                userId: userContext?.userId?.toString() || null,
                details: {
                    reportType: 'compliance',
                    period: { startDate, endDate },
                    totalEntries: entries.length,
                    format
                },
                severity: 'low',
                category: 'compliance',
                timestamp: new Date()
            });
            logger_1.logger.info('Compliance report generated', {
                reportId,
                period: { startDate, endDate },
                totalEntries: entries.length
            });
            return report;
        }
        catch (error) {
            logger_1.logger.error('Error generating compliance report:', error);
            throw new Error('Failed to generate compliance report');
        }
    }
    /**
     * Get audit trail for specific student (GDPR compliance)
     */
    async getStudentAuditTrail(studentId, userContext) {
        try {
            const entries = await this.queryAuditLogs({
                studentId,
                includeDetails: true,
                limit: 1000,
                offset: 0
            });
            // Log access to student audit trail
            await this.logAction({
                entityType: 'student',
                entityId: studentId,
                action: 'read',
                userId: userContext?.userId?.toString() || null,
                details: {
                    action: 'audit_trail_access',
                    entriesReturned: entries.entries.length
                },
                severity: 'medium',
                category: 'data_access',
                timestamp: new Date()
            });
            return entries.entries;
        }
        catch (error) {
            logger_1.logger.error('Error getting student audit trail:', error);
            throw new Error('Failed to retrieve student audit trail');
        }
    }
    /**
     * Anonymize audit logs for a student
     */
    async anonymizeStudentAuditLogs(studentId, reason, userContext) {
        try {
            const entries = await this.queryAuditLogs({
                studentId,
                limit: 1000,
                offset: 0,
                includeDetails: false
            });
            let anonymizedCount = 0;
            for (const entry of entries.entries) {
                // Anonymize the entry
                const anonymizedEntry = await this.anonymizeAuditEntry(entry);
                await this.updateAuditEntry(anonymizedEntry);
                anonymizedCount++;
            }
            // Log anonymization action
            await this.logAction({
                entityType: 'student',
                entityId: studentId,
                action: 'anonymize',
                userId: userContext?.userId?.toString() || null,
                details: {
                    action: 'audit_anonymization',
                    entriesAnonymized: anonymizedCount,
                    reason
                },
                severity: 'high',
                category: 'compliance',
                timestamp: new Date()
            });
            logger_1.logger.info('Student audit logs anonymized', {
                studentId,
                anonymizedCount,
                reason
            });
            return anonymizedCount;
        }
        catch (error) {
            logger_1.logger.error('Error anonymizing student audit logs:', error);
            throw new Error('Failed to anonymize audit logs');
        }
    }
    /**
     * Verify audit log integrity
     */
    async verifyAuditIntegrity(auditId) {
        try {
            const entry = await this.getAuditEntry(auditId);
            if (!entry) {
                throw new Error(`Audit entry not found: ${auditId}`);
            }
            const originalChecksum = entry.checksum;
            const calculatedChecksum = this.calculateChecksum({
                ...entry
            });
            const valid = originalChecksum === calculatedChecksum;
            if (!valid) {
                logger_1.logger.warn('Audit integrity check failed', {
                    auditId,
                    originalChecksum,
                    calculatedChecksum
                });
            }
            return {
                valid,
                originalChecksum,
                calculatedChecksum,
                tampering: !valid
            };
        }
        catch (error) {
            logger_1.logger.error('Error verifying audit integrity:', error);
            throw new Error('Failed to verify audit integrity');
        }
    }
    /**
     * Detect and alert on security anomalies
     */
    async detectSecurityAnomalies(entry) {
        try {
            const alerts = [];
            // Check for suspicious access patterns
            if (entry.action === 'read' && entry.entityType === 'student') {
                const recentAccesses = await this.getRecentStudentAccesses(entry.entityId, 24); // Last 24 hours
                if (recentAccesses.length > 10) {
                    alerts.push({
                        id: crypto.randomUUID(),
                        type: 'suspicious_access',
                        severity: 'medium',
                        entityType: entry.entityType,
                        entityId: entry.entityId,
                        description: `Unusual number of accesses to student data (${recentAccesses.length} in 24h)`,
                        detectedAt: new Date(),
                        auditEntries: recentAccesses.map(a => a.id),
                        resolved: false
                    });
                }
            }
            // Check for failed login attempts
            if (entry.action === 'access_denied' && entry.entityType === 'user_session') {
                const failedLogins = await this.getFailedLoginAttempts(entry.ipAddress || '', 1); // Last hour
                if (failedLogins.length > 5) {
                    alerts.push({
                        id: crypto.randomUUID(),
                        type: 'multiple_failed_logins',
                        severity: 'high',
                        entityType: 'user_session',
                        entityId: entry.ipAddress || 'unknown',
                        description: `Multiple failed login attempts from IP ${entry.ipAddress} (${failedLogins.length} attempts)`,
                        detectedAt: new Date(),
                        auditEntries: failedLogins.map(a => a.id),
                        resolved: false
                    });
                }
            }
            // Store and notify about alerts
            for (const alert of alerts) {
                await this.storeSecurityAlert(alert);
                await this.notifySecurityTeam(alert);
            }
        }
        catch (error) {
            logger_1.logger.error('Error detecting security anomalies:', error);
        }
    }
    // Private helper methods
    shouldEncryptDetails(action, entityType) {
        // Encrypt details for sensitive actions or entities
        const sensitiveActions = ['create', 'update', 'export', 'read'];
        const sensitiveEntities = ['student', 'parent', 'parental_consent'];
        return sensitiveActions.includes(action) && sensitiveEntities.includes(entityType);
    }
    categorizeAction(action) {
        const categories = {
            'create': 'data_modification',
            'update': 'data_modification',
            'delete': 'data_modification',
            'read': 'data_access',
            'export': 'data_access',
            'consent_given': 'consent_management',
            'consent_revoked': 'consent_management',
            'login': 'user_behavior',
            'logout': 'user_behavior',
            'access_denied': 'security',
            'encrypt': 'security',
            'decrypt': 'security',
            'key_generated': 'security',
            'anonymize': 'compliance'
        };
        return categories[action] || 'system';
    }
    calculateChecksum(entry) {
        const dataString = JSON.stringify({
            id: entry.id,
            entityType: entry.entityType,
            entityId: entry.entityId,
            action: entry.action,
            userId: entry.userId,
            timestamp: entry.timestamp.toISOString(),
            details: entry.details
        });
        return crypto.createHash('sha256').update(dataString).digest('hex');
    }
    getOrCreateCorrelationId(userId) {
        if (!userId)
            return crypto.randomUUID();
        let correlationId = this.sessionCorrelations.get(userId);
        if (!correlationId) {
            correlationId = crypto.randomUUID();
            this.sessionCorrelations.set(userId, correlationId);
        }
        return correlationId;
    }
    logToSystemLogger(entry) {
        const logLevel = entry.severity === 'critical' ? 'error' :
            entry.severity === 'high' ? 'warn' : 'info';
        logger_1.logger[logLevel](`AUDIT: ${entry.action} on ${entry.entityType}`, {
            auditId: entry.id,
            entityId: entry.entityId,
            userId: entry.userId,
            ipAddress: entry.ipAddress,
            timestamp: entry.timestamp
        });
    }
    buildQueryFilters(query) {
        const filters = {};
        if (query.entityType)
            filters.entityType = query.entityType;
        if (query.entityId)
            filters.entityId = query.entityId;
        if (query.action)
            filters.action = query.action;
        if (query.userId)
            filters.userId = query.userId;
        if (query.studentId)
            filters.studentId = query.studentId;
        if (query.category)
            filters.category = query.category;
        if (query.severity)
            filters.severity = { $in: query.severity };
        if (query.startDate || query.endDate) {
            filters.timestamp = {};
            if (query.startDate)
                filters.timestamp.$gte = query.startDate;
            if (query.endDate)
                filters.timestamp.$lte = query.endDate;
        }
        return filters;
    }
    analyzeAuditEntries(entries) {
        const categories = {};
        const actions = {};
        let securityAlerts = 0;
        const complianceIssues = [];
        for (const entry of entries) {
            // Count categories
            if (entry.category) {
                categories[entry.category] = (categories[entry.category] || 0) + 1;
            }
            // Count actions
            actions[entry.action] = (actions[entry.action] || 0) + 1;
            // Count security alerts
            if (entry.severity === 'high' || entry.severity === 'critical') {
                securityAlerts++;
            }
            // Check for compliance issues
            if (entry.action === 'access_denied') {
                complianceIssues.push(`Unauthorized access attempt on ${entry.entityType} ${entry.entityId}`);
            }
        }
        // Sort top actions
        const topActions = Object.entries(actions)
            .map(([action, count]) => ({ action, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        return { categories, topActions, securityAlerts, complianceIssues };
    }
    async anonymizeAuditEntry(entry) {
        // Replace sensitive information with anonymized values
        const anonymized = { ...entry };
        if (anonymized.details) {
            // Anonymize personal information in details
            anonymized.details = this.anonymizeDetails(anonymized.details);
        }
        // Remove IP address and user agent for anonymization
        delete anonymized.ipAddress;
        delete anonymized.userAgent;
        // Recalculate checksum
        anonymized.checksum = this.calculateChecksum(anonymized);
        return anonymized;
    }
    anonymizeDetails(details) {
        if (typeof details !== 'object' || details === null) {
            return details;
        }
        const anonymized = { ...details };
        const sensitiveFields = ['name', 'email', 'parentEmail', 'childName', 'parentName'];
        for (const field of sensitiveFields) {
            if (anonymized[field]) {
                anonymized[field] = '[ANONYMIZED]';
            }
        }
        return anonymized;
    }
    async initializeAuditSystem() {
        // Initialize audit database tables, indexes, etc.
        logger_1.logger.info('Audit trail system initialized');
    }
    /**
     * Store audit entry in database with transaction safety
     */
    async storeAuditEntry(entry) {
        try {
            await connection_1.db.transaction(async (tx) => {
                await tx.insert(schema_1.auditLogs).values({
                    id: entry.id,
                    entityType: entry.entityType,
                    entityId: entry.entityId,
                    action: entry.action,
                    userId: entry.userId,
                    parentId: entry.parentId,
                    studentId: entry.studentId,
                    details: entry.details,
                    ipAddress: entry.ipAddress,
                    userAgent: entry.userAgent,
                    timestamp: entry.timestamp,
                    severity: entry.severity,
                    category: entry.category,
                    sessionId: entry.sessionId,
                    correlationId: entry.correlationId,
                    checksum: entry.checksum,
                    encrypted: entry.encrypted
                });
            });
            logger_1.logger.debug('Audit entry stored successfully', { auditId: entry.id });
        }
        catch (error) {
            logger_1.logger.error('Failed to store audit entry:', error);
            throw new Error(`Failed to store audit entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Execute audit query with optimized database access
     */
    async executeAuditQuery(filters, query) {
        try {
            // Build WHERE conditions dynamically
            const conditions = [];
            if (filters.entityType) {
                conditions.push((0, drizzle_orm_1.eq)(schema_1.auditLogs.entityType, filters.entityType));
            }
            if (filters.entityId) {
                conditions.push((0, drizzle_orm_1.eq)(schema_1.auditLogs.entityId, filters.entityId));
            }
            if (filters.action) {
                conditions.push((0, drizzle_orm_1.eq)(schema_1.auditLogs.action, filters.action));
            }
            if (filters.userId) {
                conditions.push((0, drizzle_orm_1.eq)(schema_1.auditLogs.userId, filters.userId));
            }
            if (filters.studentId) {
                conditions.push((0, drizzle_orm_1.eq)(schema_1.auditLogs.studentId, filters.studentId));
            }
            if (filters.category) {
                conditions.push((0, drizzle_orm_1.eq)(schema_1.auditLogs.category, filters.category));
            }
            if (filters.severity?.$in) {
                conditions.push((0, drizzle_orm_1.inArray)(schema_1.auditLogs.severity, filters.severity.$in));
            }
            if (filters.timestamp) {
                if (filters.timestamp.$gte) {
                    conditions.push((0, drizzle_orm_1.gte)(schema_1.auditLogs.timestamp, filters.timestamp.$gte));
                }
                if (filters.timestamp.$lte) {
                    conditions.push((0, drizzle_orm_1.lte)(schema_1.auditLogs.timestamp, filters.timestamp.$lte));
                }
            }
            // Get total count
            const [totalResult] = await connection_1.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.auditLogs)
                .where(conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined);
            const total = totalResult?.count || 0;
            // Get entries with pagination
            const dbResults = await connection_1.db
                .select()
                .from(schema_1.auditLogs)
                .where(conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined)
                .orderBy((0, drizzle_orm_1.desc)(schema_1.auditLogs.timestamp))
                .limit(query.limit)
                .offset(query.offset);
            // Convert to AuditLogEntry format
            const entries = dbResults.map(row => ({
                id: row.id,
                entityType: row.entityType,
                entityId: row.entityId,
                action: row.action,
                userId: row.userId,
                parentId: row.parentId || undefined,
                studentId: row.studentId || undefined,
                details: row.details,
                ipAddress: row.ipAddress || undefined,
                userAgent: row.userAgent || undefined,
                timestamp: row.timestamp,
                severity: row.severity,
                category: row.category || undefined,
                sessionId: row.sessionId || undefined,
                correlationId: row.correlationId || undefined,
                checksum: row.checksum,
                encrypted: row.encrypted || false
            }));
            logger_1.logger.debug('Audit query executed', {
                filtersCount: Object.keys(filters).length,
                total,
                returned: entries.length
            });
            return { entries, total };
        }
        catch (error) {
            logger_1.logger.error('Error executing audit query:', error);
            throw new Error(`Failed to execute audit query: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get single audit entry by ID
     */
    async getAuditEntry(auditId) {
        try {
            const [result] = await connection_1.db
                .select()
                .from(schema_1.auditLogs)
                .where((0, drizzle_orm_1.eq)(schema_1.auditLogs.id, auditId))
                .limit(1);
            if (!result) {
                return null;
            }
            return {
                id: result.id,
                entityType: result.entityType,
                entityId: result.entityId,
                action: result.action,
                userId: result.userId,
                parentId: result.parentId || undefined,
                studentId: result.studentId || undefined,
                details: result.details,
                ipAddress: result.ipAddress || undefined,
                userAgent: result.userAgent || undefined,
                timestamp: result.timestamp,
                severity: result.severity,
                category: result.category || undefined,
                sessionId: result.sessionId || undefined,
                correlationId: result.correlationId || undefined,
                checksum: result.checksum,
                encrypted: result.encrypted || false
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting audit entry:', error);
            throw new Error(`Failed to get audit entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Update audit entry (mainly for anonymization)
     */
    async updateAuditEntry(entry) {
        try {
            await connection_1.db.transaction(async (tx) => {
                await tx
                    .update(schema_1.auditLogs)
                    .set({
                    details: entry.details,
                    ipAddress: entry.ipAddress,
                    userAgent: entry.userAgent,
                    checksum: entry.checksum,
                    encrypted: entry.encrypted
                })
                    .where((0, drizzle_orm_1.eq)(schema_1.auditLogs.id, entry.id));
            });
            logger_1.logger.debug('Audit entry updated successfully', { auditId: entry.id });
        }
        catch (error) {
            logger_1.logger.error('Error updating audit entry:', error);
            throw new Error(`Failed to update audit entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get audit entries for a specific time period
     */
    async getAuditEntriesForPeriod(startDate, endDate, entityType) {
        try {
            const conditions = [
                (0, drizzle_orm_1.gte)(schema_1.auditLogs.timestamp, startDate),
                (0, drizzle_orm_1.lte)(schema_1.auditLogs.timestamp, endDate)
            ];
            if (entityType) {
                conditions.push((0, drizzle_orm_1.eq)(schema_1.auditLogs.entityType, entityType));
            }
            const results = await connection_1.db
                .select()
                .from(schema_1.auditLogs)
                .where((0, drizzle_orm_1.and)(...conditions))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.auditLogs.timestamp))
                .limit(10000); // Reasonable limit for reports
            return results.map(row => ({
                id: row.id,
                entityType: row.entityType,
                entityId: row.entityId,
                action: row.action,
                userId: row.userId,
                parentId: row.parentId || undefined,
                studentId: row.studentId || undefined,
                details: row.details,
                ipAddress: row.ipAddress || undefined,
                userAgent: row.userAgent || undefined,
                timestamp: row.timestamp,
                severity: row.severity,
                category: row.category || undefined,
                sessionId: row.sessionId || undefined,
                correlationId: row.correlationId || undefined,
                checksum: row.checksum,
                encrypted: row.encrypted || false
            }));
        }
        catch (error) {
            logger_1.logger.error('Error getting audit entries for period:', error);
            throw new Error(`Failed to get audit entries for period: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get recent student access attempts for anomaly detection
     */
    async getRecentStudentAccesses(studentId, hours) {
        try {
            const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
            const results = await connection_1.db
                .select()
                .from(schema_1.auditLogs)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.auditLogs.entityId, studentId), (0, drizzle_orm_1.eq)(schema_1.auditLogs.entityType, 'student'), (0, drizzle_orm_1.eq)(schema_1.auditLogs.action, 'read'), (0, drizzle_orm_1.gte)(schema_1.auditLogs.timestamp, cutoffTime)))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.auditLogs.timestamp));
            return results.map(row => ({
                id: row.id,
                entityType: row.entityType,
                entityId: row.entityId,
                action: row.action,
                userId: row.userId,
                parentId: row.parentId || undefined,
                studentId: row.studentId || undefined,
                details: row.details,
                ipAddress: row.ipAddress || undefined,
                userAgent: row.userAgent || undefined,
                timestamp: row.timestamp,
                severity: row.severity,
                category: row.category || undefined,
                sessionId: row.sessionId || undefined,
                correlationId: row.correlationId || undefined,
                checksum: row.checksum,
                encrypted: row.encrypted || false
            }));
        }
        catch (error) {
            logger_1.logger.error('Error getting recent student accesses:', error);
            return []; // Don't throw - this is for security detection
        }
    }
    /**
     * Get failed login attempts for security monitoring
     */
    async getFailedLoginAttempts(ipAddress, hours) {
        try {
            const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
            const results = await connection_1.db
                .select()
                .from(schema_1.auditLogs)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.auditLogs.ipAddress, ipAddress), (0, drizzle_orm_1.eq)(schema_1.auditLogs.action, 'access_denied'), (0, drizzle_orm_1.eq)(schema_1.auditLogs.entityType, 'user_session'), (0, drizzle_orm_1.gte)(schema_1.auditLogs.timestamp, cutoffTime)))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.auditLogs.timestamp));
            return results.map(row => ({
                id: row.id,
                entityType: row.entityType,
                entityId: row.entityId,
                action: row.action,
                userId: row.userId,
                parentId: row.parentId || undefined,
                studentId: row.studentId || undefined,
                details: row.details,
                ipAddress: row.ipAddress || undefined,
                userAgent: row.userAgent || undefined,
                timestamp: row.timestamp,
                severity: row.severity,
                category: row.category || undefined,
                sessionId: row.sessionId || undefined,
                correlationId: row.correlationId || undefined,
                checksum: row.checksum,
                encrypted: row.encrypted || false
            }));
        }
        catch (error) {
            logger_1.logger.error('Error getting failed login attempts:', error);
            return []; // Don't throw - this is for security detection
        }
    }
    /**
     * Store security alert in database
     */
    async storeSecurityAlert(alert) {
        try {
            await connection_1.db.transaction(async (tx) => {
                await tx.insert(schema_1.securityAlerts).values({
                    id: alert.id,
                    type: alert.type,
                    alertType: alert.type,
                    message: alert.description || 'Security alert detected',
                    severity: alert.severity,
                    entityType: alert.entityType,
                    entityId: alert.entityId,
                    description: alert.description,
                    isResolved: alert.resolved || false
                });
            });
            logger_1.logger.info('Security alert stored', { alertId: alert.id, type: alert.type });
        }
        catch (error) {
            logger_1.logger.error('Error storing security alert:', error);
            // Don't throw - alert storage failure shouldn't break main flow
        }
    }
    /**
     * Notify security team about alert (email, slack, etc.)
     */
    async notifySecurityTeam(alert) {
        try {
            // Log alert for immediate monitoring
            logger_1.logger.warn(`SECURITY ALERT: ${alert.type}`, {
                alertId: alert.id,
                severity: alert.severity,
                entityType: alert.entityType,
                entityId: alert.entityId,
                description: alert.description,
                detectedAt: alert.detectedAt
            });
            // TODO: Implement actual notification (email, Slack webhook, etc.)
            // For now, ensure it's logged at warn level for monitoring systems
        }
        catch (error) {
            logger_1.logger.error('Error notifying security team:', error);
            // Don't throw - notification failure shouldn't break main flow
        }
    }
    /**
     * Export compliance report to file
     */
    async exportReport(report, entries, format) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `compliance-report-${report.id}-${timestamp}`;
            const reportsDir = path.join(process.cwd(), 'reports');
            // Ensure reports directory exists
            await fs.mkdir(reportsDir, { recursive: true });
            if (format === 'csv') {
                const filePath = path.join(reportsDir, `${fileName}.csv`);
                const csvWriter = (0, csv_writer_1.createObjectCsvWriter)({
                    path: filePath,
                    header: [
                        { id: 'id', title: 'ID' },
                        { id: 'timestamp', title: 'Timestamp' },
                        { id: 'entityType', title: 'Entity Type' },
                        { id: 'entityId', title: 'Entity ID' },
                        { id: 'action', title: 'Action' },
                        { id: 'userId', title: 'User ID' },
                        { id: 'severity', title: 'Severity' },
                        { id: 'category', title: 'Category' },
                        { id: 'ipAddress', title: 'IP Address' }
                    ]
                });
                const csvData = entries.map(entry => ({
                    id: entry.id,
                    timestamp: entry.timestamp.toISOString(),
                    entityType: entry.entityType,
                    entityId: entry.entityId,
                    action: entry.action,
                    userId: entry.userId || '',
                    severity: entry.severity,
                    category: entry.category || '',
                    ipAddress: entry.ipAddress || ''
                }));
                await csvWriter.writeRecords(csvData);
                logger_1.logger.info('CSV report exported', { filePath, entriesCount: csvData.length });
                return filePath;
            }
            else if (format === 'json') {
                const filePath = path.join(reportsDir, `${fileName}.json`);
                const reportData = {
                    report,
                    entries: entries.map(entry => ({
                        ...entry,
                        details: entry.encrypted ? '[ENCRYPTED]' : entry.details
                    }))
                };
                await fs.writeFile(filePath, JSON.stringify(reportData, null, 2));
                logger_1.logger.info('JSON report exported', { filePath, entriesCount: entries.length });
                return filePath;
            }
            else {
                throw new Error(`Unsupported export format: ${format}`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error exporting report:', error);
            throw new Error(`Failed to export report: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.AuditTrailService = AuditTrailService;
