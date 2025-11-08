"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityAuditService = exports.SecurityComponent = exports.SecuritySeverity = exports.SecurityIncidentType = void 0;
const logger_1 = require("../utils/logger");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
var SecurityIncidentType;
(function (SecurityIncidentType) {
    // Input validation
    SecurityIncidentType["XSS_ATTEMPT"] = "XSS_ATTEMPT";
    SecurityIncidentType["SQL_INJECTION"] = "SQL_INJECTION";
    SecurityIncidentType["NOSQL_INJECTION"] = "NOSQL_INJECTION";
    SecurityIncidentType["COMMAND_INJECTION"] = "COMMAND_INJECTION";
    SecurityIncidentType["PATH_TRAVERSAL"] = "PATH_TRAVERSAL";
    // Authentication & Authorization
    SecurityIncidentType["FAILED_LOGIN"] = "FAILED_LOGIN";
    SecurityIncidentType["BRUTE_FORCE"] = "BRUTE_FORCE";
    SecurityIncidentType["UNAUTHORIZED_ACCESS"] = "UNAUTHORIZED_ACCESS";
    SecurityIncidentType["PRIVILEGE_ESCALATION"] = "PRIVILEGE_ESCALATION";
    // Rate limiting & DoS
    SecurityIncidentType["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    SecurityIncidentType["DDoS_ATTEMPT"] = "DDOS_ATTEMPT";
    SecurityIncidentType["SUSPICIOUS_BEHAVIOR"] = "SUSPICIOUS_BEHAVIOR";
    // CSRF & Session
    SecurityIncidentType["CSRF_VIOLATION"] = "CSRF_VIOLATION";
    SecurityIncidentType["SESSION_HIJACKING"] = "SESSION_HIJACKING";
    SecurityIncidentType["SESSION_FIXATION"] = "SESSION_FIXATION";
    // File upload
    SecurityIncidentType["MALICIOUS_FILE"] = "MALICIOUS_FILE";
    SecurityIncidentType["FILE_SIZE_VIOLATION"] = "FILE_SIZE_VIOLATION";
    SecurityIncidentType["INVALID_FILE_TYPE"] = "INVALID_FILE_TYPE";
    // Data protection
    SecurityIncidentType["DATA_EXFILTRATION"] = "DATA_EXFILTRATION";
    SecurityIncidentType["GDPR_VIOLATION"] = "GDPR_VIOLATION";
    SecurityIncidentType["PII_EXPOSURE"] = "PII_EXPOSURE";
    // Network & Infrastructure
    SecurityIncidentType["IP_BLOCKED"] = "IP_BLOCKED";
    SecurityIncidentType["GEO_BLOCKED"] = "GEO_BLOCKED";
    SecurityIncidentType["VPN_DETECTED"] = "VPN_DETECTED";
    SecurityIncidentType["BOT_DETECTED"] = "BOT_DETECTED";
    // Configuration & Policy
    SecurityIncidentType["SECURITY_POLICY_VIOLATION"] = "SECURITY_POLICY_VIOLATION";
    SecurityIncidentType["CONFIGURATION_ERROR"] = "CONFIGURATION_ERROR";
    // Generic
    SecurityIncidentType["SUSPICIOUS_REQUEST"] = "SUSPICIOUS_REQUEST";
    SecurityIncidentType["UNKNOWN_THREAT"] = "UNKNOWN_THREAT";
})(SecurityIncidentType || (exports.SecurityIncidentType = SecurityIncidentType = {}));
var SecuritySeverity;
(function (SecuritySeverity) {
    SecuritySeverity["LOW"] = "LOW";
    SecuritySeverity["MEDIUM"] = "MEDIUM";
    SecuritySeverity["HIGH"] = "HIGH";
    SecuritySeverity["CRITICAL"] = "CRITICAL";
})(SecuritySeverity || (exports.SecuritySeverity = SecuritySeverity = {}));
var SecurityComponent;
(function (SecurityComponent) {
    SecurityComponent["INPUT_SANITIZATION"] = "INPUT_SANITIZATION";
    SecurityComponent["CSRF_PROTECTION"] = "CSRF_PROTECTION";
    SecurityComponent["RATE_LIMITING"] = "RATE_LIMITING";
    SecurityComponent["AUTHENTICATION"] = "AUTHENTICATION";
    SecurityComponent["AUTHORIZATION"] = "AUTHORIZATION";
    SecurityComponent["FILE_UPLOAD"] = "FILE_UPLOAD";
    SecurityComponent["CORS"] = "CORS";
    SecurityComponent["SECURITY_HEADERS"] = "SECURITY_HEADERS";
    SecurityComponent["GDPR"] = "GDPR";
    SecurityComponent["FIREWALL"] = "FIREWALL";
    SecurityComponent["MONITORING"] = "MONITORING";
})(SecurityComponent || (exports.SecurityComponent = SecurityComponent = {}));
class SecurityAuditService {
    constructor(options = {}) {
        this.incidents = new Map();
        this.recentIncidents = [];
        this.alertCounters = new Map();
        this.options = {
            logToFile: true,
            logDirectory: './logs/security',
            maxLogFiles: 30,
            maxFileSize: 50 * 1024 * 1024, // 50MB
            enableRealTimeAlerts: true,
            alertThresholds: {
                [SecurityIncidentType.XSS_ATTEMPT]: { count: 5, timeWindow: 5 * 60 * 1000 },
                [SecurityIncidentType.SQL_INJECTION]: { count: 3, timeWindow: 5 * 60 * 1000 },
                [SecurityIncidentType.BRUTE_FORCE]: { count: 10, timeWindow: 10 * 60 * 1000 },
                [SecurityIncidentType.RATE_LIMIT_EXCEEDED]: { count: 20, timeWindow: 15 * 60 * 1000 },
                [SecurityIncidentType.FAILED_LOGIN]: { count: 15, timeWindow: 15 * 60 * 1000 }
            },
            retentionDays: 90,
            enableMetrics: true,
            metricsInterval: 60 * 1000, // 1 minute
            ...options
        };
        this.initializeLogging();
        this.startMetricsCollection();
    }
    /**
     * Log a security incident
     */
    async logIncident(type, severity, component, request, details) {
        const incidentId = this.generateIncidentId();
        const incident = {
            id: incidentId,
            timestamp: new Date(),
            type,
            severity,
            source: {
                ip: request.ip,
                userAgent: request.headers?.['user-agent'],
                userId: request.user?.id,
                sessionId: request.session?.id || request.headers?.['x-session-id'],
                country: this.getCountryFromIP(request.ip)
            },
            target: {
                route: request.routeOptions?.url || request.url,
                method: request.method,
                endpoint: `${request.method} ${request.url}`
            },
            details: {
                description: details.description,
                payload: details.payload,
                headers: this.sanitizeHeaders(request.headers),
                response: {
                    status: 0, // Will be updated later if needed
                    blocked: details.blocked === true
                }
            },
            metadata: {
                requestId: request.id,
                ruleId: details.ruleId,
                component,
                automated: true
            }
        };
        // Store incident
        this.incidents.set(incidentId, incident);
        this.recentIncidents.push(incident);
        // Maintain recent incidents list size
        if (this.recentIncidents.length > 10000) {
            this.recentIncidents = this.recentIncidents.slice(-5000);
        }
        // Log to application logger
        logger_1.logger.warn('Security incident detected', {
            incidentId,
            type,
            severity,
            component,
            ip: incident.source.ip,
            route: incident.target.route,
            description: details.description
        });
        // Log to file if enabled
        if (this.options.logToFile) {
            await this.logToFile(incident);
        }
        // Check for real-time alerts
        if (this.options.enableRealTimeAlerts) {
            await this.checkAlertThresholds(type, incident);
        }
        return incidentId;
    }
    /**
     * Log a manual security incident
     */
    async logManualIncident(type, severity, component, description, metadata = {}) {
        const incidentId = this.generateIncidentId();
        const incident = {
            id: incidentId,
            timestamp: new Date(),
            type,
            severity,
            source: {
                ip: 'manual',
                userAgent: metadata.userAgent,
                userId: metadata.userId,
                sessionId: metadata.sessionId
            },
            target: {
                route: metadata.route || 'manual',
                method: metadata.method || 'MANUAL',
                endpoint: metadata.endpoint
            },
            details: {
                description,
                payload: metadata.payload,
                response: {
                    status: 0,
                    blocked: false
                }
            },
            metadata: {
                component,
                automated: false,
                ...metadata
            }
        };
        this.incidents.set(incidentId, incident);
        this.recentIncidents.push(incident);
        if (this.options.logToFile) {
            await this.logToFile(incident);
        }
        logger_1.logger.info('Manual security incident logged', {
            incidentId,
            type,
            severity,
            component,
            description
        });
        return incidentId;
    }
    /**
     * Get security metrics
     */
    getMetrics(timeRange) {
        let incidents = Array.from(this.incidents.values());
        // Filter by time range if provided
        if (timeRange) {
            incidents = incidents.filter(incident => incident.timestamp >= timeRange.start && incident.timestamp <= timeRange.end);
        }
        // Calculate metrics
        const totalIncidents = incidents.length;
        const incidentsByType = {};
        const incidentsBySeverity = {};
        const incidentsByComponent = {};
        // Initialize counters
        Object.values(SecurityIncidentType).forEach(type => incidentsByType[type] = 0);
        Object.values(SecuritySeverity).forEach(severity => incidentsBySeverity[severity] = 0);
        Object.values(SecurityComponent).forEach(component => incidentsByComponent[component] = 0);
        const ipCounts = {};
        const routeCounts = {};
        let blockedCount = 0;
        incidents.forEach(incident => {
            incidentsByType[incident.type]++;
            incidentsBySeverity[incident.severity]++;
            incidentsByComponent[incident.metadata.component]++;
            // Count IPs
            if (incident.source.ip !== 'manual') {
                ipCounts[incident.source.ip] = (ipCounts[incident.source.ip] || 0) + 1;
            }
            // Count routes
            routeCounts[incident.target.route] = (routeCounts[incident.target.route] || 0) + 1;
            // Count blocked requests
            if (incident.details.response?.blocked) {
                blockedCount++;
            }
        });
        // Top attacker IPs
        const topAttackerIPs = Object.entries(ipCounts)
            .map(([ip, count]) => ({ ip, count, country: this.getCountryFromIP(ip) }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        // Top target routes
        const topTargetRoutes = Object.entries(routeCounts)
            .map(([route, count]) => ({ route, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        // Timeline data (last 24 hours in hourly buckets)
        const timelineData = this.generateTimelineData(incidents);
        return {
            totalIncidents,
            incidentsByType,
            incidentsBySeverity,
            incidentsByComponent,
            topAttackerIPs,
            topTargetRoutes,
            timelineData,
            blockingEffectiveness: {
                totalRequests: totalIncidents,
                blockedRequests: blockedCount,
                blockingRate: totalIncidents > 0 ? (blockedCount / totalIncidents) * 100 : 0
            }
        };
    }
    /**
     * Get incidents by criteria
     */
    getIncidents(criteria = {}) {
        let incidents = Array.from(this.incidents.values());
        // Apply filters
        if (criteria.type) {
            incidents = incidents.filter(i => i.type === criteria.type);
        }
        if (criteria.severity) {
            incidents = incidents.filter(i => i.severity === criteria.severity);
        }
        if (criteria.component) {
            incidents = incidents.filter(i => i.metadata.component === criteria.component);
        }
        if (criteria.ip) {
            incidents = incidents.filter(i => i.source.ip === criteria.ip);
        }
        if (criteria.userId) {
            incidents = incidents.filter(i => i.source.userId === criteria.userId);
        }
        if (criteria.timeRange) {
            incidents = incidents.filter(i => i.timestamp >= criteria.timeRange.start && i.timestamp <= criteria.timeRange.end);
        }
        // Sort by timestamp (newest first)
        incidents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        // Apply pagination
        const offset = criteria.offset || 0;
        const limit = criteria.limit || 100;
        return incidents.slice(offset, offset + limit);
    }
    /**
     * Get incident by ID
     */
    getIncident(id) {
        return this.incidents.get(id) || null;
    }
    /**
     * Check if IP is suspicious based on recent incidents
     */
    isIPSuspicious(ip, timeWindow = 60 * 60 * 1000) {
        const cutoff = new Date(Date.now() - timeWindow);
        const recentIncidents = this.recentIncidents.filter(incident => incident.source.ip === ip && incident.timestamp >= cutoff);
        return recentIncidents.length >= 10 ||
            recentIncidents.some(incident => incident.severity === SecuritySeverity.CRITICAL ||
                incident.type === SecurityIncidentType.BRUTE_FORCE);
    }
    /**
     * Generate security report
     */
    generateReport(timeRange) {
        const metrics = this.getMetrics(timeRange);
        const incidents = this.getIncidents({ timeRange, limit: 1000 });
        // Get top threats (critical incidents)
        const topThreats = incidents
            .filter(i => i.severity === SecuritySeverity.CRITICAL)
            .slice(0, 10);
        // Generate recommendations
        const recommendations = this.generateRecommendations(metrics, incidents);
        return {
            summary: metrics,
            topThreats,
            recommendations
        };
    }
    /**
     * Private helper methods
     */
    generateIncidentId() {
        return `SEC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    getCountryFromIP(ip) {
        // Placeholder - would use GeoIP service in real implementation
        return 'Unknown';
    }
    sanitizeHeaders(headers) {
        if (!headers) {
            return {};
        }
        const sanitized = {};
        const allowedHeaders = [
            'user-agent', 'accept', 'accept-language', 'accept-encoding',
            'referer', 'origin', 'x-forwarded-for', 'x-real-ip'
        ];
        for (const [key, value] of Object.entries(headers)) {
            if (allowedHeaders.includes(key.toLowerCase()) && typeof value === 'string') {
                sanitized[key] = value.substring(0, 1000); // Limit length
            }
        }
        return sanitized;
    }
    async initializeLogging() {
        if (this.options.logToFile && this.options.logDirectory) {
            try {
                await promises_1.default.mkdir(this.options.logDirectory, { recursive: true });
            }
            catch (error) {
                logger_1.logger.error('Failed to create security log directory:', error);
            }
        }
    }
    async logToFile(incident) {
        if (!this.options.logDirectory)
            return;
        try {
            const logFile = path_1.default.join(this.options.logDirectory, `security-${incident.timestamp.toISOString().split('T')[0]}.json`);
            const logEntry = JSON.stringify(incident) + '\n';
            await promises_1.default.appendFile(logFile, logEntry, 'utf8');
        }
        catch (error) {
            logger_1.logger.error('Failed to write security log:', error);
        }
    }
    async checkAlertThresholds(type, incident) {
        const threshold = this.options.alertThresholds?.[type];
        if (!threshold)
            return;
        const key = `${type}:${incident.source.ip}`;
        const now = new Date();
        const existing = this.alertCounters.get(key);
        if (existing) {
            const timeElapsed = now.getTime() - existing.firstSeen.getTime();
            if (timeElapsed <= threshold.timeWindow) {
                existing.count++;
                if (existing.count >= threshold.count) {
                    await this.triggerAlert(type, incident, existing.count);
                    this.alertCounters.delete(key); // Reset counter after alert
                }
            }
            else {
                // Reset counter if window expired
                this.alertCounters.set(key, { count: 1, firstSeen: now });
            }
        }
        else {
            this.alertCounters.set(key, { count: 1, firstSeen: now });
        }
    }
    async triggerAlert(type, incident, count) {
        logger_1.logger.error('Security alert triggered', {
            type,
            incidentCount: count,
            ip: incident.source.ip,
            severity: incident.severity,
            component: incident.metadata.component
        });
        // Here you would integrate with alerting systems (email, Slack, PagerDuty, etc.)
    }
    generateTimelineData(incidents) {
        const buckets = {};
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        // Initialize hourly buckets
        for (let i = 0; i < 24; i++) {
            const bucketTime = new Date(now.getTime() - i * 60 * 60 * 1000);
            const key = bucketTime.toISOString().substring(0, 13); // YYYY-MM-DDTHH
            buckets[key] = {
                [SecuritySeverity.LOW]: 0,
                [SecuritySeverity.MEDIUM]: 0,
                [SecuritySeverity.HIGH]: 0,
                [SecuritySeverity.CRITICAL]: 0
            };
        }
        // Fill buckets with incident data
        incidents
            .filter(incident => incident.timestamp >= oneDayAgo)
            .forEach(incident => {
            const key = incident.timestamp.toISOString().substring(0, 13);
            if (buckets[key]) {
                buckets[key][incident.severity]++;
            }
        });
        // Convert to timeline format
        return Object.entries(buckets).map(([timeKey, severityCounts]) => {
            const totalCount = Object.values(severityCounts).reduce((sum, count) => sum + count, 0);
            const highestSeverity = Object.entries(severityCounts)
                .filter(([, count]) => count > 0)
                .sort(([a], [b]) => {
                const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
                return severityOrder[b] - severityOrder[a];
            })[0]?.[0] || SecuritySeverity.LOW;
            return {
                timestamp: new Date(timeKey + ':00:00.000Z'),
                count: totalCount,
                severity: highestSeverity
            };
        });
    }
    generateRecommendations(metrics, incidents) {
        const recommendations = [];
        // Check for high XSS attempts
        if (metrics.incidentsByType[SecurityIncidentType.XSS_ATTEMPT] > 0) {
            recommendations.push('Consider strengthening input sanitization and XSS protection');
        }
        // Check for SQL injection attempts
        if (metrics.incidentsByType[SecurityIncidentType.SQL_INJECTION] > 0) {
            recommendations.push('Review database query sanitization and consider using parameterized queries');
        }
        // Check for rate limiting effectiveness
        if (metrics.blockingEffectiveness.blockingRate < 50) {
            recommendations.push('Review rate limiting rules - low blocking effectiveness detected');
        }
        // Check for top attacker IPs
        if (metrics.topAttackerIPs.length > 0 && metrics.topAttackerIPs[0].count > 20) {
            recommendations.push(`Consider blocking IP ${metrics.topAttackerIPs[0].ip} - high incident count`);
        }
        // Check for authentication issues
        const authIssues = metrics.incidentsByType[SecurityIncidentType.FAILED_LOGIN] +
            metrics.incidentsByType[SecurityIncidentType.BRUTE_FORCE];
        if (authIssues > 50) {
            recommendations.push('Implement stronger authentication measures and account lockout policies');
        }
        return recommendations;
    }
    startMetricsCollection() {
        if (!this.options.enableMetrics)
            return;
        this.metricsInterval = setInterval(() => {
            const metrics = this.getMetrics();
            logger_1.logger.info('Security metrics snapshot', {
                totalIncidents: metrics.totalIncidents,
                recentIncidents: this.recentIncidents.length,
                criticalIncidents: metrics.incidentsBySeverity[SecuritySeverity.CRITICAL],
                blockingRate: metrics.blockingEffectiveness.blockingRate
            });
        }, this.options.metricsInterval);
    }
    /**
     * Cleanup old incidents and logs
     */
    async cleanup() {
        const cutoff = new Date(Date.now() - this.options.retentionDays * 24 * 60 * 60 * 1000);
        // Remove old incidents from memory
        let removedCount = 0;
        const newIncidents = new Map();
        for (const [id, incident] of this.incidents.entries()) {
            if (incident.timestamp >= cutoff) {
                newIncidents.set(id, incident);
            }
            else {
                removedCount++;
            }
        }
        this.incidents = newIncidents;
        // Clean up recent incidents array
        this.recentIncidents = this.recentIncidents.filter(incident => incident.timestamp >= cutoff);
        if (removedCount > 0) {
            logger_1.logger.info('Security audit cleanup completed', {
                removedIncidents: removedCount,
                remainingIncidents: this.incidents.size
            });
        }
    }
    /**
     * Shutdown cleanup
     */
    shutdown() {
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
        }
        this.incidents.clear();
        this.recentIncidents = [];
        this.alertCounters.clear();
        logger_1.logger.info('Security audit service shutdown');
    }
    clearIncidents() {
        this.incidents.clear();
        this.recentIncidents = [];
        this.alertCounters.clear();
    }
}
exports.SecurityAuditService = SecurityAuditService;
