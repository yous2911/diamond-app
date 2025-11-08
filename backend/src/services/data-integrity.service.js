"use strict";
/**
 * Data Integrity Service for RevEd Kids
 * Provides comprehensive data validation, consistency checks, and integrity monitoring
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataIntegrityService = void 0;
const connection_1 = require("../db/connection");
const logger_1 = require("../utils/logger");
const node_cron_1 = __importDefault(require("node-cron"));
const events_1 = require("events");
class DataIntegrityService extends events_1.EventEmitter {
    constructor() {
        super();
        this.rules = new Map();
        this.violations = new Map();
        this.checkHistory = [];
        this.scheduledTasks = new Map();
        this.metrics = [];
        this.isInitialized = false;
        this.initializeDefaultRules();
    }
    initializeDefaultRules() {
        const defaultRules = [
            // Referential integrity rules
            {
                id: 'ref_students_progress',
                name: 'Student Progress Referential Integrity',
                description: 'All student_progress records must reference existing students',
                category: 'REFERENTIAL',
                severity: 'critical',
                table: 'student_progress',
                condition: `
          SELECT COUNT(*) as violations 
          FROM student_progress sp 
          LEFT JOIN students s ON sp.student_id = s.id 
          WHERE s.id IS NULL
        `,
                expectedResult: 0,
                enabled: true,
                schedule: '0 */6 * * *' // Every 6 hours
            },
            {
                id: 'ref_progress_exercises',
                name: 'Progress Exercise Referential Integrity',
                description: 'All student_progress records must reference existing exercises',
                category: 'REFERENTIAL',
                severity: 'critical',
                table: 'student_progress',
                condition: `
          SELECT COUNT(*) as violations 
          FROM student_progress sp 
          LEFT JOIN exercises e ON sp.exercise_id = e.id 
          WHERE e.id IS NULL
        `,
                expectedResult: 0,
                enabled: true
            },
            {
                id: 'ref_sessions_students',
                name: 'Session Student Referential Integrity',
                description: 'All sessions must reference existing students',
                category: 'REFERENTIAL',
                severity: 'high',
                table: 'sessions',
                condition: `
          SELECT COUNT(*) as violations 
          FROM sessions s 
          LEFT JOIN students st ON s.student_id = st.id 
          WHERE st.id IS NULL
        `,
                expectedResult: 0,
                enabled: true
            },
            // Domain integrity rules
            {
                id: 'domain_email_format',
                name: 'Student Email Format',
                description: 'All student emails must be valid email addresses',
                category: 'DOMAIN',
                severity: 'medium',
                table: 'students',
                columns: ['email'],
                condition: `
          SELECT COUNT(*) as violations 
          FROM students 
          WHERE email IS NOT NULL 
          AND email NOT REGEXP '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'
        `,
                expectedResult: 0,
                enabled: true
            },
            {
                id: 'domain_scores_range',
                name: 'Score Range Validation',
                description: 'All scores must be between 0 and 100',
                category: 'DOMAIN',
                severity: 'medium',
                table: 'student_progress',
                columns: ['average_score', 'best_score'],
                condition: `
          SELECT COUNT(*) as violations 
          FROM student_progress 
          WHERE (average_score < 0 OR average_score > 100) 
          OR (best_score < 0 OR best_score > 100)
        `,
                expectedResult: 0,
                enabled: true
            },
            {
                id: 'domain_niveau_values',
                name: 'Educational Level Values',
                description: 'Educational levels must be valid French school levels',
                category: 'DOMAIN',
                severity: 'medium',
                table: 'students',
                columns: ['niveau_scolaire'],
                condition: `
          SELECT COUNT(*) as violations 
          FROM students 
          WHERE niveau_scolaire NOT IN ('CP', 'CE1', 'CE2', 'CM1', 'CM2', '6eme', '5eme', '4eme', '3eme')
        `,
                expectedResult: 0,
                enabled: true
            },
            // Entity integrity rules
            {
                id: 'entity_student_unique_email',
                name: 'Student Email Uniqueness',
                description: 'Student emails must be unique',
                category: 'ENTITY',
                severity: 'high',
                table: 'students',
                columns: ['email'],
                condition: `
          SELECT COUNT(*) as violations 
          FROM (
            SELECT email, COUNT(*) as count 
            FROM students 
            WHERE email IS NOT NULL 
            GROUP BY email 
            HAVING COUNT(*) > 1
          ) duplicates
        `,
                expectedResult: 0,
                enabled: true
            },
            {
                id: 'entity_exercise_unique_code',
                name: 'Exercise Code Uniqueness',
                description: 'Exercise codes must be unique within the same subject and level',
                category: 'ENTITY',
                severity: 'medium',
                table: 'exercises',
                condition: `
          SELECT COUNT(*) as violations 
          FROM (
            SELECT matiere, niveau, code, COUNT(*) as count 
            FROM exercises 
            WHERE code IS NOT NULL 
            GROUP BY matiere, niveau, code 
            HAVING COUNT(*) > 1
          ) duplicates
        `,
                expectedResult: 0,
                enabled: true
            },
            // Business logic rules
            {
                id: 'business_progress_logic',
                name: 'Progress Completion Logic',
                description: 'Completed exercises must have mastery level of at least "en_cours"',
                category: 'BUSINESS',
                severity: 'medium',
                table: 'student_progress',
                condition: `
          SELECT COUNT(*) as violations 
          FROM student_progress 
          WHERE completed = 1 
          AND mastery_level IN ('non_commence', 'echec')
        `,
                expectedResult: 0,
                enabled: true
            },
            {
                id: 'business_best_score_logic',
                name: 'Best Score Logic',
                description: 'Best score should be greater than or equal to average score',
                category: 'BUSINESS',
                severity: 'low',
                table: 'student_progress',
                condition: `
          SELECT COUNT(*) as violations 
          FROM student_progress 
          WHERE best_score < average_score 
          AND total_attempts > 0
        `,
                expectedResult: 0,
                tolerance: 5, // Allow 5 violations
                enabled: true
            },
            {
                id: 'business_session_expiry',
                name: 'Session Expiry Logic',
                description: 'Session expiry time must be after creation time',
                category: 'BUSINESS',
                severity: 'medium',
                table: 'sessions',
                condition: `
          SELECT COUNT(*) as violations 
          FROM sessions 
          WHERE expires_at <= created_at
        `,
                expectedResult: 0,
                enabled: true
            },
            // Temporal integrity rules
            {
                id: 'temporal_progress_dates',
                name: 'Progress Date Consistency',
                description: 'Last attempt date should not be before creation date',
                category: 'TEMPORAL',
                severity: 'medium',
                table: 'student_progress',
                condition: `
          SELECT COUNT(*) as violations 
          FROM student_progress 
          WHERE last_attempt_at < created_at
        `,
                expectedResult: 0,
                enabled: true
            },
            {
                id: 'temporal_mastery_progression',
                name: 'Mastery Date Progression',
                description: 'Mastered date should be after last attempt date for mastered exercises',
                category: 'TEMPORAL',
                severity: 'low',
                table: 'student_progress',
                condition: `
          SELECT COUNT(*) as violations 
          FROM student_progress 
          WHERE mastery_level = 'maitrise' 
          AND mastered_at IS NOT NULL 
          AND mastered_at < last_attempt_at
        `,
                expectedResult: 0,
                enabled: true
            },
            // GDPR compliance rules
            {
                id: 'gdpr_consent_validity',
                name: 'GDPR Consent Validity',
                description: 'Active students must have valid GDPR consent',
                category: 'BUSINESS',
                severity: 'high',
                table: 'students',
                condition: `
          SELECT COUNT(*) as violations 
          FROM students s
          LEFT JOIN gdpr_consent_requests gcr ON s.id = gcr.student_id 
          WHERE s.est_actif = 1 
          AND (gcr.id IS NULL OR gcr.status != 'approved' OR gcr.expires_at < NOW())
        `,
                expectedResult: 0,
                enabled: true
            }
        ];
        defaultRules.forEach(rule => {
            this.rules.set(rule.id, rule);
        });
    }
    async initialize() {
        try {
            logger_1.logger.info('Initializing data integrity service...');
            // Setup scheduled checks
            this.setupScheduledChecks();
            // Setup metrics collection
            this.setupMetricsCollection();
            // Run initial integrity check
            await this.runComprehensiveCheck();
            this.isInitialized = true;
            logger_1.logger.info('Data integrity service initialized successfully', {
                rules: this.rules.size,
                scheduledTasks: this.scheduledTasks.size
            });
            this.emit('initialized');
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger_1.logger.error('Failed to initialize data integrity service', { error: err });
            throw err;
        }
    }
    setupScheduledChecks() {
        // Setup individual rule schedules
        for (const rule of this.rules.values()) {
            if (rule.enabled && rule.schedule) {
                const task = node_cron_1.default.schedule(rule.schedule, async () => {
                    try {
                        await this.checkRule(rule.id);
                    }
                    catch (error) {
                        const err = error instanceof Error ? error : new Error(String(error));
                        logger_1.logger.error('Scheduled integrity check failed', {
                            ruleId: rule.id,
                            error: err.message
                        });
                    }
                }, {});
                this.scheduledTasks.set(`rule-${rule.id}`, task);
            }
        }
        // Daily comprehensive check at 2 AM
        const comprehensiveTask = node_cron_1.default.schedule('0 2 * * *', async () => {
            try {
                await this.runComprehensiveCheck();
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                logger_1.logger.error('Daily comprehensive integrity check failed', { error: err });
            }
        }, { name: 'comprehensive-integrity-check' });
        this.scheduledTasks.set('comprehensive', comprehensiveTask);
        logger_1.logger.info('Data integrity scheduled checks configured', {
            ruleSchedules: Array.from(this.rules.values()).filter(r => r.schedule).length,
            totalTasks: this.scheduledTasks.size
        });
    }
    setupMetricsCollection() {
        // Collect data quality metrics every hour
        const metricsTask = node_cron_1.default.schedule('0 * * * *', async () => {
            try {
                await this.collectDataQualityMetrics();
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                logger_1.logger.error('Data quality metrics collection failed', { error: err });
            }
        }, { name: 'data-quality-metrics' });
        this.scheduledTasks.set('metrics', metricsTask);
    }
    async checkRule(ruleId) {
        const rule = this.rules.get(ruleId);
        if (!rule) {
            throw new Error(`Rule ${ruleId} not found`);
        }
        const startTime = Date.now();
        try {
            logger_1.logger.debug('Checking integrity rule', {
                ruleId: rule.id,
                ruleName: rule.name
            });
            const [rows] = await connection_1.connection.execute(rule.condition);
            const result = rows[0];
            const violationCount = result.violations || result.count || 0;
            const tolerance = rule.tolerance || 0;
            const passed = violationCount <= tolerance;
            const violations = [];
            if (!passed) {
                // Get detailed violation information if rule failed
                const detailViolations = await this.getDetailedViolations(rule, violationCount);
                violations.push(...detailViolations);
            }
            const executionTime = Date.now() - startTime;
            const checkResult = {
                ruleId: rule.id,
                ruleName: rule.name,
                passed,
                violations,
                executionTime,
                checkedAt: new Date(),
                nextCheck: rule.schedule ? this.calculateNextCheck(rule.schedule) : undefined
            };
            // Store violations
            violations.forEach(violation => {
                this.violations.set(violation.id, violation);
            });
            // Add to history
            this.checkHistory.push(checkResult);
            // Keep only recent history (last 1000 checks)
            if (this.checkHistory.length > 1000) {
                this.checkHistory = this.checkHistory.slice(-500);
            }
            if (!passed) {
                logger_1.logger.warn('Data integrity rule failed', {
                    ruleId: rule.id,
                    ruleName: rule.name,
                    violations: violations.length,
                    severity: rule.severity
                });
                this.emit('ruleViolation', checkResult);
            }
            return checkResult;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            const executionTime = Date.now() - startTime;
            logger_1.logger.error('Integrity rule check failed', {
                ruleId: rule.id,
                error: err.message
            });
            const checkResult = {
                ruleId: rule.id,
                ruleName: rule.name,
                passed: false,
                violations: [{
                        id: `error-${Date.now()}`,
                        table: rule.table,
                        primaryKey: {},
                        description: `Rule execution failed: ${error.message}`,
                        severity: 'critical',
                        detectedAt: new Date(),
                        resolved: false
                    }],
                executionTime,
                checkedAt: new Date()
            };
            this.checkHistory.push(checkResult);
            return checkResult;
        }
    }
    async getDetailedViolations(rule, violationCount) {
        const violations = [];
        try {
            // Create a modified query to get specific violating records
            let detailQuery = this.createDetailViolationQuery(rule);
            if (detailQuery) {
                const [detailRows] = await connection_1.connection.execute(detailQuery);
                const records = detailRows;
                for (const record of records.slice(0, 50)) { // Limit to 50 violations
                    violations.push({
                        id: `${rule.id}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                        table: rule.table,
                        primaryKey: this.extractPrimaryKey(record, rule.table),
                        column: rule.columns?.[0],
                        description: `${rule.description}: ${this.formatViolationDetails(record, rule)}`,
                        severity: rule.severity,
                        detectedAt: new Date(),
                        resolved: false
                    });
                }
            }
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger_1.logger.debug('Could not get detailed violations', {
                ruleId: rule.id,
                error: err.message
            });
            // Create a generic violation if we can't get details
            violations.push({
                id: `${rule.id}-generic-${Date.now()}`,
                table: rule.table,
                primaryKey: {},
                description: `${rule.description} (${violationCount} violations found)`,
                severity: rule.severity,
                detectedAt: new Date(),
                resolved: false
            });
        }
        return violations;
    }
    createDetailViolationQuery(rule) {
        // This is a simplified approach - in production, you'd want more sophisticated query modification
        const condition = rule.condition.toLowerCase();
        if (condition.includes('left join') && condition.includes('is null')) {
            // Referential integrity violation - modify to return the violating records
            const tableMatch = condition.match(/from\s+(\w+)/);
            if (tableMatch) {
                return rule.condition.replace(/select\s+count\(\*\)\s+as\s+violations/i, 'SELECT *');
            }
        }
        if (condition.includes('not regexp') || condition.includes('not in')) {
            // Domain validation - return violating records
            return rule.condition.replace(/select\s+count\(\*\)\s+as\s+violations/i, 'SELECT *');
        }
        return null;
    }
    extractPrimaryKey(record, tableName) {
        // Common primary key patterns
        const commonPkFields = ['id', `${tableName}_id`, 'pk'];
        for (const field of commonPkFields) {
            if (record[field] !== undefined) {
                return { [field]: record[field] };
            }
        }
        // Return the first field as fallback
        const firstKey = Object.keys(record)[0];
        return firstKey ? { [firstKey]: record[firstKey] } : {};
    }
    formatViolationDetails(record, rule) {
        if (rule.columns && rule.columns.length > 0) {
            const columnValues = rule.columns.map(col => `${col}=${record[col]}`);
            return `[${columnValues.join(', ')}]`;
        }
        return `Record: ${JSON.stringify(record).substring(0, 100)}...`;
    }
    calculateNextCheck(schedule) {
        // Simplified next check calculation - in production, use proper cron parsing
        const now = new Date();
        const nextCheck = new Date(now.getTime() + 6 * 60 * 60 * 1000); // Default: 6 hours
        return nextCheck;
    }
    async runComprehensiveCheck() {
        const startTime = Date.now();
        const reportId = `report-${Date.now()}`;
        try {
            logger_1.logger.info('Starting comprehensive data integrity check...');
            const results = [];
            const enabledRules = Array.from(this.rules.values()).filter(r => r.enabled);
            // Run all enabled rules
            for (const rule of enabledRules) {
                try {
                    const result = await this.checkRule(rule.id);
                    results.push(result);
                }
                catch (error) {
                    const err = error instanceof Error ? error : new Error(String(error));
                    logger_1.logger.error('Rule check failed during comprehensive check', {
                        ruleId: rule.id,
                        error: err.message
                    });
                }
            }
            // Generate summary
            const passedRules = results.filter(r => r.passed).length;
            const failedRules = results.filter(r => !r.passed).length;
            const totalViolations = results.reduce((sum, r) => sum + r.violations.length, 0);
            const criticalViolations = results.reduce((sum, r) => sum + r.violations.filter(v => v.severity === 'critical').length, 0);
            const unresolvedViolations = Array.from(this.violations.values())
                .filter(v => !v.resolved).length;
            // Generate recommendations
            const recommendations = this.generateRecommendations(results);
            const executionTime = Date.now() - startTime;
            const report = {
                reportId,
                generatedAt: new Date(),
                summary: {
                    totalRules: enabledRules.length,
                    passedRules,
                    failedRules,
                    totalViolations,
                    criticalViolations,
                    unresolvedViolations
                },
                ruleResults: results,
                recommendations,
                executionTime
            };
            logger_1.logger.info('Comprehensive integrity check completed', {
                reportId,
                totalRules: report.summary.totalRules,
                failedRules: report.summary.failedRules,
                totalViolations: report.summary.totalViolations,
                executionTime
            });
            this.emit('comprehensiveCheckCompleted', report);
            return report;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger_1.logger.error('Comprehensive integrity check failed', { error: err });
            throw err;
        }
    }
    generateRecommendations(results) {
        const recommendations = [];
        const failedResults = results.filter(r => !r.passed);
        if (failedResults.length === 0) {
            recommendations.push('✅ All integrity rules are passing. Data integrity is excellent.');
            return recommendations;
        }
        // Critical issues
        const criticalFailures = failedResults.filter(r => r.violations.some(v => v.severity === 'critical'));
        if (criticalFailures.length > 0) {
            recommendations.push(`🚨 ${criticalFailures.length} critical integrity rules are failing. Address these immediately:`);
            criticalFailures.forEach(result => {
                recommendations.push(`   • ${result.ruleName}: ${result.violations.length} violations`);
            });
        }
        // Referential integrity issues
        const referentialIssues = failedResults.filter(r => this.rules.get(r.ruleId)?.category === 'REFERENTIAL');
        if (referentialIssues.length > 0) {
            recommendations.push('🔗 Referential integrity violations detected. Check foreign key constraints and data consistency.');
        }
        // Business logic issues
        const businessIssues = failedResults.filter(r => this.rules.get(r.ruleId)?.category === 'BUSINESS');
        if (businessIssues.length > 0) {
            recommendations.push('📋 Business logic violations detected. Review application logic and data validation rules.');
        }
        // Data quality recommendations
        if (failedResults.length > results.length * 0.2) { // More than 20% failing
            recommendations.push('📊 Consider implementing automated data validation in your application layer.');
        }
        if (recommendations.length === 1) { // Only the critical section
            recommendations.push('💡 Regular integrity checks help maintain high data quality. Consider running these checks more frequently.');
        }
        return recommendations;
    }
    async collectDataQualityMetrics() {
        try {
            logger_1.logger.debug('Collecting data quality metrics...');
            const [completenessResult, uniquenessResult, validityResult, consistencyResult, accuracyResult, timelinessResult] = await Promise.allSettled([
                this.calculateCompleteness(),
                this.calculateUniqueness(),
                this.calculateValidity(),
                this.calculateConsistency(),
                this.calculateAccuracy(),
                this.calculateTimeliness()
            ]);
            const completeness = completenessResult.status === 'fulfilled' ? completenessResult.value : 0;
            const uniqueness = uniquenessResult.status === 'fulfilled' ? uniquenessResult.value : 0;
            const validity = validityResult.status === 'fulfilled' ? validityResult.value : 0;
            const consistency = consistencyResult.status === 'fulfilled' ? consistencyResult.value : 0;
            const accuracy = accuracyResult.status === 'fulfilled' ? accuracyResult.value : 0;
            const timeliness = timelinessResult.status === 'fulfilled' ? timelinessResult.value : 0;
            const overallScore = (completeness + uniqueness + validity + consistency + accuracy + timeliness) / 6;
            const metrics = {
                timestamp: new Date(),
                completeness,
                uniqueness,
                validity,
                consistency,
                accuracy,
                timeliness,
                overallScore
            };
            this.metrics.push(metrics);
            // Keep only last 168 hours (7 days) of metrics
            const cutoff = new Date(Date.now() - 168 * 60 * 60 * 1000);
            this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
            this.emit('metricsCollected', metrics);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger_1.logger.error('Failed to collect data quality metrics', { error: err });
        }
    }
    async calculateCompleteness() {
        // Calculate percentage of non-null values in critical fields
        const [rows] = await connection_1.connection.execute(`
      SELECT 
        (COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) * 100.0 / COUNT(*)) as email_completeness,
        (COUNT(CASE WHEN prenom IS NOT NULL AND prenom != '' THEN 1 END) * 100.0 / COUNT(*)) as prenom_completeness,
        (COUNT(CASE WHEN nom IS NOT NULL AND nom != '' THEN 1 END) * 100.0 / COUNT(*)) as nom_completeness,
        (COUNT(CASE WHEN niveau_scolaire IS NOT NULL THEN 1 END) * 100.0 / COUNT(*)) as niveau_completeness
      FROM students
    `);
        const result = rows[0];
        return (result.email_completeness + result.prenom_completeness + result.nom_completeness + result.niveau_completeness) / 4;
    }
    async calculateUniqueness() {
        // Calculate uniqueness where it should be unique (emails, etc.)
        const [rows] = await connection_1.connection.execute(`
      SELECT 
        (COUNT(DISTINCT email) * 100.0 / COUNT(email)) as email_uniqueness
      FROM students 
      WHERE email IS NOT NULL AND email != ''
    `);
        const result = rows[0];
        return result.email_uniqueness || 100;
    }
    async calculateValidity() {
        // Calculate percentage of values that pass domain validation
        const passedRules = this.checkHistory
            .filter(check => check.checkedAt > new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
            .filter(check => this.rules.get(check.ruleId)?.category === 'DOMAIN')
            .filter(check => check.passed);
        const totalDomainRules = Array.from(this.rules.values())
            .filter(rule => rule.category === 'DOMAIN' && rule.enabled).length;
        return totalDomainRules > 0 ? (passedRules.length / totalDomainRules) * 100 : 100;
    }
    async calculateConsistency() {
        // Calculate consistency based on referential integrity rules
        const passedRules = this.checkHistory
            .filter(check => check.checkedAt > new Date(Date.now() - 24 * 60 * 60 * 1000))
            .filter(check => this.rules.get(check.ruleId)?.category === 'REFERENTIAL')
            .filter(check => check.passed);
        const totalReferentialRules = Array.from(this.rules.values())
            .filter(rule => rule.category === 'REFERENTIAL' && rule.enabled).length;
        return totalReferentialRules > 0 ? (passedRules.length / totalReferentialRules) * 100 : 100;
    }
    async calculateAccuracy() {
        // Calculate accuracy based on business rule compliance
        const passedRules = this.checkHistory
            .filter(check => check.checkedAt > new Date(Date.now() - 24 * 60 * 60 * 1000))
            .filter(check => this.rules.get(check.ruleId)?.category === 'BUSINESS')
            .filter(check => check.passed);
        const totalBusinessRules = Array.from(this.rules.values())
            .filter(rule => rule.category === 'BUSINESS' && rule.enabled).length;
        return totalBusinessRules > 0 ? (passedRules.length / totalBusinessRules) * 100 : 100;
    }
    async calculateTimeliness() {
        // Calculate timeliness based on recent data updates
        try {
            const [rows] = await connection_1.connection.execute(`
        SELECT 
          (COUNT(CASE WHEN updated_at > DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) * 100.0 / COUNT(*)) as recent_updates
        FROM students 
        WHERE updated_at IS NOT NULL
      `);
            const result = rows[0];
            return result.recent_updates || 100;
        }
        catch (error) {
            // Default if timestamp columns don't exist
            return 100;
        }
    }
    // Public API methods
    async addRule(rule) {
        this.rules.set(rule.id, rule);
        if (rule.enabled && rule.schedule) {
            const task = node_cron_1.default.schedule(rule.schedule, async () => {
                try {
                    await this.checkRule(rule.id);
                }
                catch (error) {
                    const err = error instanceof Error ? error : new Error(String(error));
                    logger_1.logger.error('Custom rule check failed', { ruleId: rule.id, error: err });
                }
            }, {});
            this.scheduledTasks.set(`rule-${rule.id}`, task);
        }
        logger_1.logger.info('Integrity rule added', { ruleId: rule.id, ruleName: rule.name });
    }
    async removeRule(ruleId) {
        const rule = this.rules.get(ruleId);
        if (!rule)
            return false;
        this.rules.delete(ruleId);
        // Stop scheduled task if exists
        const task = this.scheduledTasks.get(`rule-${ruleId}`);
        if (task) {
            task.stop();
            this.scheduledTasks.delete(`rule-${ruleId}`);
        }
        logger_1.logger.info('Integrity rule removed', { ruleId });
        return true;
    }
    async resolveViolation(violationId, resolutionAction) {
        const violation = this.violations.get(violationId);
        if (!violation)
            return false;
        violation.resolved = true;
        violation.resolvedAt = new Date();
        violation.resolutionAction = resolutionAction;
        logger_1.logger.info('Violation resolved', {
            violationId,
            resolutionAction,
            table: violation.table
        });
        this.emit('violationResolved', violation);
        return true;
    }
    getRules() {
        return Array.from(this.rules.values());
    }
    getViolations(resolved) {
        const allViolations = Array.from(this.violations.values());
        if (resolved !== undefined) {
            return allViolations.filter(v => v.resolved === resolved);
        }
        return allViolations;
    }
    getCheckHistory(limit) {
        const history = [...this.checkHistory].reverse(); // Most recent first
        return limit ? history.slice(0, limit) : history;
    }
    getDataQualityMetrics() {
        return [...this.metrics];
    }
    getLatestDataQualityMetrics() {
        return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
    }
    async getDataQualityScore() {
        const latest = this.getLatestDataQualityMetrics();
        if (!latest) {
            // Calculate on demand if no metrics available
            await this.collectDataQualityMetrics();
            const newLatest = this.getLatestDataQualityMetrics();
            return newLatest?.overallScore || 0;
        }
        return latest.overallScore;
    }
    async shutdown() {
        logger_1.logger.info('Shutting down data integrity service...');
        this.scheduledTasks.forEach((task, name) => {
            task.stop();
            logger_1.logger.debug(`Stopped scheduled task: ${name}`);
        });
        this.scheduledTasks.clear();
        logger_1.logger.info('Data integrity service shutdown completed');
    }
}
// Create and export singleton instance
exports.dataIntegrityService = new DataIntegrityService();
exports.default = exports.dataIntegrityService;
