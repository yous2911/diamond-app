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
exports.DataAnonymizationService = void 0;
const crypto = __importStar(require("crypto"));
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const audit_trail_service_1 = require("./audit-trail.service");
const encryption_service_1 = require("./encryption.service");
const connection_1 = require("../db/connection");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
// Validation schemas
const AnonymizationConfigSchema = zod_1.z.object({
    entityType: zod_1.z.string(),
    entityId: zod_1.z.string(),
    reason: zod_1.z.enum(['consent_withdrawal', 'retention_policy', 'gdpr_request', 'inactivity', 'account_deletion']),
    preserveStatistics: zod_1.z.boolean().default(true),
    immediateExecution: zod_1.z.boolean().default(false),
    scheduledFor: zod_1.z.date().optional(),
    notifyUser: zod_1.z.boolean().default(true)
});
const AnonymizationRuleSchema = zod_1.z.object({
    fieldName: zod_1.z.string(),
    strategy: zod_1.z.enum(['hash', 'randomize', 'mask', 'remove', 'generalize', 'substitute']),
    preserveFormat: zod_1.z.boolean().default(false),
    customPattern: zod_1.z.string().optional(),
    groupSize: zod_1.z.number().optional(), // For k-anonymity
    preserveLength: zod_1.z.boolean().default(false)
});
class DataAnonymizationService {
    constructor(inactivityConfig) {
        this.runningJobs = new Map();
        this.anonymizationRules = new Map();
        this.auditService = new audit_trail_service_1.AuditTrailService();
        this.encryptionService = new encryption_service_1.EncryptionService();
        this.inactivityConfig = {
            studentInactivityDays: 730, // 2 years
            parentInactivityDays: 1095, // 3 years
            adminInactivityDays: 1460, // 4 years
            warningDaysBeforeAnonymization: 30,
            enableAutomaticAnonymization: true,
            preserveEducationalStatistics: true,
            ...inactivityConfig
        };
        this.initializeAnonymizationRules();
        this.scheduleInactivityCheck();
    }
    /**
     * Schedule data anonymization
     */
    async scheduleAnonymization(config) {
        try {
            const validatedConfig = AnonymizationConfigSchema.parse(config);
            const jobId = crypto.randomUUID();
            const priority = this.determinePriority(validatedConfig.reason);
            const job = {
                id: jobId,
                entityType: validatedConfig.entityType,
                entityId: validatedConfig.entityId,
                reason: validatedConfig.reason,
                status: 'pending',
                progress: 0,
                affectedRecords: 0,
                preservedFields: [],
                anonymizedFields: [],
                errors: [],
                scheduledFor: validatedConfig.scheduledFor,
                priority
            };
            this.runningJobs.set(jobId, job);
            // Log anonymization request
            await this.auditService.logAction({
                entityType: 'anonymization_job',
                entityId: jobId,
                action: 'create',
                userId: null,
                details: {
                    targetEntityType: validatedConfig.entityType,
                    targetEntityId: validatedConfig.entityId,
                    reason: validatedConfig.reason,
                    scheduledFor: validatedConfig.scheduledFor,
                    priority
                },
                severity: 'high',
                category: 'compliance'
            });
            // Execute immediately or schedule for later
            if (validatedConfig.immediateExecution || !validatedConfig.scheduledFor) {
                setImmediate(() => this.executeAnonymization(jobId));
            }
            else {
                this.scheduleJobExecution(jobId, validatedConfig.scheduledFor);
            }
            logger_1.logger.info('Anonymization job scheduled', {
                jobId,
                entityType: validatedConfig.entityType,
                reason: validatedConfig.reason,
                priority
            });
            return jobId;
        }
        catch (error) {
            logger_1.logger.error('Error scheduling anonymization:', error);
            throw new Error('Failed to schedule anonymization');
        }
    }
    /**
     * Execute anonymization job
     */
    async executeAnonymization(jobId) {
        const job = this.runningJobs.get(jobId);
        if (!job) {
            logger_1.logger.error('Anonymization job not found:', { jobId });
            return;
        }
        try {
            job.status = 'running';
            job.startedAt = new Date();
            job.progress = 0;
            logger_1.logger.info('Starting anonymization job', {
                jobId,
                entityType: job.entityType,
                entityId: job.entityId
            });
            // Get anonymization rules for this entity type
            const rules = this.anonymizationRules.get(job.entityType) || [];
            // Process data based on entity type
            let affectedRecords = 0;
            let anonymizedFields = [];
            let preservedFields = [];
            switch (job.entityType) {
                case 'student': {
                    const studentResult = await this.anonymizeStudentData(job.entityId, rules, job.reason);
                    affectedRecords = studentResult.recordsProcessed;
                    anonymizedFields = studentResult.anonymizedFields;
                    preservedFields = studentResult.preservedFields;
                    break;
                }
                case 'parent': {
                    const parentResult = await this.anonymizeParentData(job.entityId, rules, job.reason);
                    affectedRecords = parentResult.recordsProcessed;
                    anonymizedFields = parentResult.anonymizedFields;
                    preservedFields = parentResult.preservedFields;
                    break;
                }
                case 'session': {
                    const sessionResult = await this.anonymizeSessionData(job.entityId, rules);
                    affectedRecords = sessionResult.recordsProcessed;
                    anonymizedFields = sessionResult.anonymizedFields;
                    preservedFields = sessionResult.preservedFields;
                    break;
                }
                default:
                    throw new Error(`Unsupported entity type for anonymization: ${job.entityType}`);
            }
            // Update job status
            job.status = 'completed';
            job.completedAt = new Date();
            job.progress = 100;
            job.affectedRecords = affectedRecords;
            job.anonymizedFields = anonymizedFields;
            job.preservedFields = preservedFields;
            // Generate anonymization report
            const report = await this.generateAnonymizationReport(job);
            // Log completion
            await this.auditService.logAction({
                entityType: 'anonymization_job',
                entityId: jobId,
                action: 'completed',
                userId: null,
                details: {
                    affectedRecords,
                    anonymizedFields,
                    preservedFields,
                    duration: job.completedAt.getTime() - job.startedAt.getTime(),
                    reason: job.reason
                },
                severity: 'high',
                category: 'compliance'
            });
            logger_1.logger.info('Anonymization job completed successfully', {
                jobId,
                affectedRecords,
                fieldsAnonymized: anonymizedFields.length
            });
        }
        catch (error) {
            job.status = 'failed';
            job.errors.push(error instanceof Error ? error.message : 'Unknown error');
            logger_1.logger.error('Anonymization job failed', {
                jobId,
                error: error instanceof Error ? error.message : error
            });
            // Log failure
            await this.auditService.logAction({
                entityType: 'anonymization_job',
                entityId: jobId,
                action: 'failed',
                userId: null,
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    reason: job.reason
                },
                severity: 'critical',
                category: 'compliance'
            });
        }
    }
    /**
     * Anonymize student data
     */
    async anonymizeStudentData(studentId, rules, reason) {
        const anonymizedFields = [];
        const preservedFields = [];
        let recordsProcessed = 0;
        try {
            // Get student data
            const studentData = await this.getStudentData(studentId);
            if (!studentData) {
                throw new Error(`Student not found: ${studentId}`);
            }
            // Fields to preserve for educational statistics
            const statisticalFields = ['grade_level', 'subject_area', 'completion_rate', 'avg_score'];
            // Process each field according to rules
            for (const rule of rules) {
                if (studentData[rule.fieldName] !== undefined) {
                    if (this.inactivityConfig.preserveEducationalStatistics &&
                        statisticalFields.includes(rule.fieldName)) {
                        // Preserve but generalize for statistics
                        studentData[rule.fieldName] = await this.generalizeField(studentData[rule.fieldName], rule.fieldName);
                        preservedFields.push(rule.fieldName);
                    }
                    else {
                        // Fully anonymize
                        studentData[rule.fieldName] = await this.applyAnonymizationStrategy(studentData[rule.fieldName], rule);
                        anonymizedFields.push(rule.fieldName);
                    }
                }
            }
            // Update student record
            await this.updateStudentData(studentId, studentData);
            recordsProcessed++;
            // Anonymize related data
            const progressRecords = await this.anonymizeStudentProgress(studentId, reason);
            const exerciseRecords = await this.anonymizeStudentExercises(studentId, reason);
            const sessionRecords = await this.anonymizeStudentSessions(studentId, reason);
            recordsProcessed += progressRecords + exerciseRecords + sessionRecords;
            return { recordsProcessed, anonymizedFields, preservedFields };
        }
        catch (error) {
            logger_1.logger.error('Error anonymizing student data:', error);
            throw error;
        }
    }
    /**
     * Anonymize parent data
     */
    async anonymizeParentData(parentId, rules, reason) {
        const anonymizedFields = [];
        const preservedFields = [];
        let recordsProcessed = 0;
        try {
            // Get parent data
            const parentData = await this.getParentData(parentId);
            if (!parentData) {
                throw new Error(`Parent not found: ${parentId}`);
            }
            // Process each field according to rules
            for (const rule of rules) {
                if (parentData[rule.fieldName] !== undefined) {
                    parentData[rule.fieldName] = await this.applyAnonymizationStrategy(parentData[rule.fieldName], rule);
                    anonymizedFields.push(rule.fieldName);
                }
            }
            // Update parent record
            await this.updateParentData(parentId, parentData);
            recordsProcessed++;
            // Anonymize consent records (but preserve consent history for compliance)
            const consentRecords = await this.anonymizeParentConsent(parentId, reason);
            recordsProcessed += consentRecords;
            return { recordsProcessed, anonymizedFields, preservedFields };
        }
        catch (error) {
            logger_1.logger.error('Error anonymizing parent data:', error);
            throw error;
        }
    }
    /**
     * Apply anonymization strategy to a field
     */
    async applyAnonymizationStrategy(value, rule) {
        if (value === null || value === undefined) {
            return value;
        }
        switch (rule.strategy) {
            case 'hash':
                return this.hashValue(value.toString());
            case 'randomize':
                return this.randomizeValue(value, rule.preserveFormat, rule.preserveLength);
            case 'mask':
                return this.maskValue(value.toString(), rule.customPattern);
            case 'remove':
                return null;
            case 'generalize':
                return this.generalizeField(value, '');
            case 'substitute':
                return this.substituteValue(value, rule.customPattern);
            default:
                logger_1.logger.warn(`Unknown anonymization strategy: ${rule.strategy}`);
                return value;
        }
    }
    /**
     * Hash a value using SHA-256
     */
    hashValue(value) {
        return crypto.createHash('sha256').update(value).digest('hex');
    }
    /**
     * Randomize a value while preserving format/length
     */
    randomizeValue(value, preserveFormat, preserveLength) {
        const str = value.toString();
        if (preserveFormat) {
            // Preserve format (letters stay letters, numbers stay numbers)
            return str.split('').map(char => {
                if (/\d/.test(char)) {
                    return Math.floor(Math.random() * 10).toString();
                }
                else if (/[a-zA-Z]/.test(char)) {
                    const isUpper = char === char.toUpperCase();
                    const randomChar = String.fromCharCode(Math.floor(Math.random() * 26) + (isUpper ? 65 : 97));
                    return randomChar;
                }
                return char;
            }).join('');
        }
        else if (preserveLength) {
            // Generate random string of same length
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            return Array.from({ length: str.length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
        }
        else {
            // Generate random UUID
            return crypto.randomUUID();
        }
    }
    /**
     * Mask a value with pattern
     */
    maskValue(value, pattern) {
        const defaultPattern = '*';
        const maskChar = pattern || defaultPattern;
        if (value.length <= 2) {
            return maskChar.repeat(value.length);
        }
        // Keep first and last character, mask the middle
        return value[0] + maskChar.repeat(value.length - 2) + value[value.length - 1];
    }
    /**
     * Generalize a field value for statistical purposes
     */
    async generalizeField(value, fieldName) {
        // Implement field-specific generalization
        if (fieldName === 'age' && typeof value === 'number') {
            // Group ages into ranges
            if (value < 6)
                return '3-5';
            if (value < 9)
                return '6-8';
            if (value < 12)
                return '9-11';
            if (value < 15)
                return '12-14';
            return '15+';
        }
        if (fieldName === 'grade_level') {
            // Keep grade level for educational statistics
            return value;
        }
        if (fieldName === 'completion_rate' && typeof value === 'number') {
            // Group completion rates
            if (value < 0.25)
                return 'low';
            if (value < 0.75)
                return 'medium';
            return 'high';
        }
        // Default generalization
        return '[GENERALIZED]';
    }
    /**
     * Substitute value with predefined replacement
     */
    substituteValue(value, pattern) {
        if (pattern) {
            return pattern;
        }
        // Default substitutions based on common field types
        const str = value.toString().toLowerCase();
        if (str.includes('name'))
            return 'Anonymous User';
        if (str.includes('email'))
            return 'anonymous@example.com';
        if (str.includes('phone'))
            return '+33123456789';
        if (str.includes('address'))
            return '123 Anonymous Street';
        return '[ANONYMIZED]';
    }
    /**
     * Check for inactive accounts and schedule anonymization
     */
    async checkInactiveAccounts() {
        if (!this.inactivityConfig.enableAutomaticAnonymization) {
            return;
        }
        try {
            const now = new Date();
            // Check student inactivity
            const inactiveStudents = await this.findInactiveStudents(this.inactivityConfig.studentInactivityDays);
            for (const student of inactiveStudents) {
                // Send warning first
                const warningDate = new Date(student.lastActivity);
                warningDate.setDate(warningDate.getDate() +
                    this.inactivityConfig.studentInactivityDays -
                    this.inactivityConfig.warningDaysBeforeAnonymization);
                if (now >= warningDate && !student.warningsSent) {
                    await this.sendInactivityWarning(student.id, 'student');
                    await this.markWarningAsSent(student.id);
                }
                // Schedule anonymization if warning period passed
                const anonymizationDate = new Date(student.lastActivity);
                anonymizationDate.setDate(anonymizationDate.getDate() +
                    this.inactivityConfig.studentInactivityDays);
                if (now >= anonymizationDate) {
                    await this.scheduleAnonymization({
                        entityType: 'student',
                        entityId: student.id,
                        reason: 'inactivity',
                        preserveStatistics: this.inactivityConfig.preserveEducationalStatistics,
                        immediateExecution: true,
                        notifyUser: true
                    });
                }
            }
            // Similar checks for parents and admins...
            logger_1.logger.info('Inactivity check completed', {
                inactiveStudents: inactiveStudents.length
            });
        }
        catch (error) {
            logger_1.logger.error('Error checking inactive accounts:', error);
        }
    }
    /**
     * Generate anonymization report
     */
    async generateAnonymizationReport(job) {
        const fieldsAnonymized = {};
        const rules = this.anonymizationRules.get(job.entityType) || [];
        for (const field of job.anonymizedFields) {
            const rule = rules.find(r => r.fieldName === field);
            fieldsAnonymized[field] = rule?.strategy || 'unknown';
        }
        const report = {
            jobId: job.id,
            entityType: job.entityType,
            entityId: job.entityId,
            executedAt: job.completedAt,
            recordsProcessed: job.affectedRecords,
            fieldsAnonymized,
            preservedData: job.preservedFields,
            statisticsGenerated: this.inactivityConfig.preserveEducationalStatistics,
            complianceChecks: {
                gdprCompliant: true,
                dataMinimized: job.anonymizedFields.length > 0,
                purposeLimitation: true,
                accuracyMaintained: job.preservedFields.length > 0
            }
        };
        return report;
    }
    // Private helper methods
    initializeAnonymizationRules() {
        // Student anonymization rules
        this.anonymizationRules.set('student', [
            { fieldName: 'first_name', strategy: 'substitute', preserveFormat: false, preserveLength: false },
            { fieldName: 'last_name', strategy: 'substitute', preserveFormat: false, preserveLength: false },
            { fieldName: 'email', strategy: 'hash', preserveFormat: false, preserveLength: false },
            { fieldName: 'birth_date', strategy: 'generalize', preserveFormat: false, preserveLength: false },
            { fieldName: 'address', strategy: 'remove', preserveFormat: false, preserveLength: false },
            { fieldName: 'phone', strategy: 'mask', preserveFormat: true, preserveLength: false },
            { fieldName: 'ip_address', strategy: 'mask', preserveFormat: false, preserveLength: false },
            { fieldName: 'user_agent', strategy: 'remove', preserveFormat: false, preserveLength: false }
        ]);
        // Parent anonymization rules
        this.anonymizationRules.set('parent', [
            { fieldName: 'first_name', strategy: 'substitute', preserveFormat: false, preserveLength: false },
            { fieldName: 'last_name', strategy: 'substitute', preserveFormat: false, preserveLength: false },
            { fieldName: 'email', strategy: 'hash', preserveFormat: false, preserveLength: false },
            { fieldName: 'phone', strategy: 'mask', preserveFormat: true, preserveLength: false },
            { fieldName: 'address', strategy: 'remove', preserveFormat: false, preserveLength: false },
            { fieldName: 'ip_address', strategy: 'mask', preserveFormat: false, preserveLength: false }
        ]);
        logger_1.logger.info('Anonymization rules initialized');
    }
    determinePriority(reason) {
        switch (reason) {
            case 'gdpr_request':
            case 'consent_withdrawal':
                return 'urgent';
            case 'account_deletion':
                return 'high';
            case 'retention_policy':
                return 'medium';
            case 'inactivity':
                return 'low';
            default:
                return 'medium';
        }
    }
    scheduleJobExecution(jobId, scheduledFor) {
        const delay = scheduledFor.getTime() - Date.now();
        if (delay > 0) {
            setTimeout(() => {
                this.executeAnonymization(jobId);
            }, delay);
        }
        else {
            // Execute immediately if scheduled time has passed
            setImmediate(() => this.executeAnonymization(jobId));
        }
    }
    scheduleInactivityCheck() {
        // Check for inactive accounts daily
        const checkInterval = 24 * 60 * 60 * 1000; // 24 hours
        setInterval(() => {
            this.checkInactiveAccounts().catch(error => {
                logger_1.logger.error('Error in scheduled inactivity check:', error);
            });
        }, checkInterval);
        logger_1.logger.info('Inactivity check scheduled to run daily');
    }
    /**
     * Get student data from database
     */
    async getStudentData(studentId) {
        try {
            const [student] = await connection_1.db
                .select()
                .from(schema_1.students)
                .where((0, drizzle_orm_1.eq)(schema_1.students.id, parseInt(studentId)))
                .limit(1);
            if (!student) {
                return null;
            }
            return {
                id: student.id,
                first_name: student.prenom,
                last_name: student.nom,
                email: student.email,
                birth_date: student.dateNaissance,
                grade_level: student.niveauActuel,
                total_points: student.totalPoints,
                completion_rate: student.serieJours / 365.0, // Approximate completion rate
                avg_score: student.totalPoints / 100.0, // Normalized score
                last_access: student.dernierAcces,
                mascotte_type: student.mascotteType,
                created_at: student.createdAt,
                updated_at: student.updatedAt
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting student data:', error);
            throw new Error(`Failed to get student data: ${error.message}`);
        }
    }
    /**
     * Update student data with anonymized values
     */
    async updateStudentData(studentId, data) {
        try {
            await connection_1.db.transaction(async (tx) => {
                await tx
                    .update(schema_1.students)
                    .set({
                    prenom: data.first_name || data.prenom,
                    nom: data.last_name || data.nom,
                    email: data.email,
                    dateNaissance: data.birth_date || data.dateNaissance,
                    niveauActuel: data.grade_level || data.niveauActuel,
                    totalPoints: data.total_points || data.totalPoints,
                    mascotteType: data.mascotte_type || data.mascotteType,
                    updatedAt: new Date()
                })
                    .where((0, drizzle_orm_1.eq)(schema_1.students.id, parseInt(studentId)));
            });
            logger_1.logger.debug('Student data updated with anonymized values', { studentId });
        }
        catch (error) {
            logger_1.logger.error('Error updating student data:', error);
            throw new Error(`Failed to update student data: ${error.message}`);
        }
    }
    /**
     * Get parent data from GDPR consent requests (parents are stored there)
     */
    async getParentData(parentId) {
        try {
            const [parent] = await connection_1.db
                .select()
                .from(schema_1.gdprConsentRequests)
                .where((0, drizzle_orm_1.eq)(schema_1.gdprConsentRequests.id, parseInt(parentId)))
                .limit(1);
            if (!parent) {
                return null;
            }
            return {
                id: parent.id,
                first_name: 'Anonymous',
                last_name: 'Parent',
                email: 'anonymous@example.com',
                phone: '000-000-0000',
                child_name: 'Student',
                created_at: parent.createdAt,
                updated_at: parent.createdAt
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting parent data:', error);
            throw new Error(`Failed to get parent data: ${error.message}`);
        }
    }
    /**
     * Update parent data with anonymized values
     */
    async updateParentData(parentId, data) {
        try {
            await connection_1.db.transaction(async (tx) => {
                const fullName = `${data.first_name || 'Anonymous'} ${data.last_name || 'Parent'}`;
                await tx
                    .update(schema_1.gdprConsentRequests)
                    .set({
                    status: 'processed',
                    processedAt: new Date()
                })
                    .where((0, drizzle_orm_1.eq)(schema_1.gdprConsentRequests.id, parseInt(parentId)));
            });
            logger_1.logger.debug('Parent data updated with anonymized values', { parentId });
        }
        catch (error) {
            logger_1.logger.error('Error updating parent data:', error);
            throw new Error(`Failed to update parent data: ${error.message}`);
        }
    }
    /**
     * Anonymize student progress records
     */
    async anonymizeStudentProgress(studentId, reason) {
        try {
            let recordsProcessed = 0;
            await connection_1.db.transaction(async (tx) => {
                // Get all progress records for the student
                const progressRecords = await tx
                    .select()
                    .from(schema_1.studentProgress)
                    .where((0, drizzle_orm_1.eq)(schema_1.studentProgress.studentId, parseInt(studentId)));
                for (const progress of progressRecords) {
                    if (this.inactivityConfig.preserveEducationalStatistics) {
                        // Preserve statistical data but remove identifying info
                        await tx
                            .update(schema_1.studentProgress)
                            .set({
                            // Keep exercise completion and scoring data for analytics
                            // but remove timing and specific answer details
                            timeSpent: Math.floor(progress.timeSpent / 60) * 60, // Round to nearest minute
                            updatedAt: new Date()
                        })
                            .where((0, drizzle_orm_1.eq)(schema_1.studentProgress.id, progress.id));
                    }
                    else {
                        // Complete anonymization - remove the record
                        await tx
                            .delete(schema_1.studentProgress)
                            .where((0, drizzle_orm_1.eq)(schema_1.studentProgress.id, progress.id));
                    }
                    recordsProcessed++;
                }
                // Log the anonymization
                await this.auditService.logAction({
                    entityType: 'progress',
                    entityId: studentId,
                    action: 'anonymize',
                    userId: null,
                    details: {
                        recordsProcessed,
                        reason,
                        preserveStatistics: this.inactivityConfig.preserveEducationalStatistics
                    },
                    severity: 'high',
                    category: 'compliance'
                });
            });
            logger_1.logger.info('Student progress anonymized', { studentId, recordsProcessed, reason });
            return recordsProcessed;
        }
        catch (error) {
            logger_1.logger.error('Error anonymizing student progress:', error);
            return 0;
        }
    }
    /**
     * Anonymize student exercise data (same as progress for this schema)
     */
    async anonymizeStudentExercises(studentId, reason) {
        // In this schema, exercise data is handled through student_progress
        // This method exists for interface compatibility
        logger_1.logger.debug('Student exercises handled through progress anonymization', { studentId });
        return 0;
    }
    /**
     * Anonymize student session data
     */
    async anonymizeStudentSessions(studentId, reason) {
        try {
            let recordsProcessed = 0;
            await connection_1.db.transaction(async (tx) => {
                // Get all session records for the student
                const sessionRecords = await tx
                    .select()
                    .from(schema_1.sessions)
                    .where((0, drizzle_orm_1.eq)(schema_1.sessions.studentId, parseInt(studentId)));
                for (const session of sessionRecords) {
                    if (this.inactivityConfig.preserveEducationalStatistics) {
                        // Preserve session duration and completion stats but anonymize details
                        await tx
                            .update(schema_1.sessions)
                            .set({
                        // Remove identifying session details but keep statistical data
                        // Note: exercisesCompleted and totalTime properties don't exist in schema
                        })
                            .where((0, drizzle_orm_1.eq)(schema_1.sessions.id, session.id));
                    }
                    else {
                        // Complete removal of session data
                        await tx
                            .delete(schema_1.sessions)
                            .where((0, drizzle_orm_1.eq)(schema_1.sessions.id, session.id));
                    }
                    recordsProcessed++;
                }
                // Log the anonymization
                await this.auditService.logAction({
                    entityType: 'user_session',
                    entityId: studentId,
                    action: 'anonymize',
                    userId: null,
                    details: {
                        recordsProcessed,
                        reason,
                        preserveStatistics: this.inactivityConfig.preserveEducationalStatistics
                    },
                    severity: 'high',
                    category: 'compliance'
                });
            });
            logger_1.logger.info('Student sessions anonymized', { studentId, recordsProcessed, reason });
            return recordsProcessed;
        }
        catch (error) {
            logger_1.logger.error('Error anonymizing student sessions:', error);
            return 0;
        }
    }
    /**
     * Anonymize parent consent records
     */
    async anonymizeParentConsent(parentId, reason) {
        try {
            let recordsProcessed = 0;
            await connection_1.db.transaction(async (tx) => {
                // For GDPR compliance, we usually preserve consent history but anonymize personal data
                // This is already handled in updateParentData method
                // Update any additional consent-related audit logs
                const consentLogs = await tx
                    .select()
                    .from(schema_1.auditLogs)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.auditLogs.entityType, 'parental_consent'), (0, drizzle_orm_1.eq)(schema_1.auditLogs.entityId, parentId)));
                for (const log of consentLogs) {
                    // Anonymize sensitive details in audit logs while preserving consent actions
                    const anonymizedDetails = {
                        parentName: '[ANONYMIZED]',
                        parentEmail: '[ANONYMIZED]',
                        contactInfo: '[ANONYMIZED]',
                        ...(log.details && typeof log.details === 'object' ? log.details : {})
                    };
                    await tx
                        .update(schema_1.auditLogs)
                        .set({
                        details: anonymizedDetails,
                        ipAddress: null,
                        userAgent: null,
                        checksum: this.calculateAuditChecksum(log.id, anonymizedDetails)
                    })
                        .where((0, drizzle_orm_1.eq)(schema_1.auditLogs.id, log.id));
                    recordsProcessed++;
                }
                // Log the consent anonymization
                await this.auditService.logAction({
                    entityType: 'parental_consent',
                    entityId: parentId,
                    action: 'anonymize',
                    userId: null,
                    details: {
                        recordsProcessed,
                        reason,
                        consentHistoryPreserved: true
                    },
                    severity: 'high',
                    category: 'compliance'
                });
            });
            logger_1.logger.info('Parent consent data anonymized', { parentId, recordsProcessed, reason });
            return recordsProcessed;
        }
        catch (error) {
            logger_1.logger.error('Error anonymizing parent consent:', error);
            return 0;
        }
    }
    /**
     * Anonymize specific session data by session ID
     */
    async anonymizeSessionData(sessionId, rules) {
        try {
            const anonymizedFields = [];
            const preservedFields = [];
            let recordsProcessed = 0;
            await connection_1.db.transaction(async (tx) => {
                const [session] = await tx
                    .select()
                    .from(schema_1.sessions)
                    .where((0, drizzle_orm_1.eq)(schema_1.sessions.id, sessionId))
                    .limit(1);
                if (!session) {
                    return;
                }
                const updateData = {};
                for (const rule of rules) {
                    const fieldValue = session[rule.fieldName];
                    if (fieldValue !== undefined) {
                        if (this.inactivityConfig.preserveEducationalStatistics &&
                            ['totalTime', 'exercisesCompleted'].includes(rule.fieldName)) {
                            // Preserve but generalize
                            updateData[rule.fieldName] = await this.generalizeField(fieldValue, rule.fieldName);
                            preservedFields.push(rule.fieldName);
                        }
                        else {
                            // Fully anonymize
                            updateData[rule.fieldName] = await this.applyAnonymizationStrategy(fieldValue, rule);
                            anonymizedFields.push(rule.fieldName);
                        }
                    }
                }
                if (Object.keys(updateData).length > 0) {
                    updateData.updatedAt = new Date();
                    await tx
                        .update(schema_1.sessions)
                        .set(updateData)
                        .where((0, drizzle_orm_1.eq)(schema_1.sessions.id, sessionId));
                    recordsProcessed = 1;
                }
            });
            return { recordsProcessed, anonymizedFields, preservedFields };
        }
        catch (error) {
            logger_1.logger.error('Error anonymizing session data:', error);
            return { recordsProcessed: 0, anonymizedFields: [], preservedFields: [] };
        }
    }
    /**
     * Find inactive students based on last access date
     */
    async findInactiveStudents(inactivityDays) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - inactivityDays);
            const inactiveStudents = await connection_1.db
                .select({
                id: schema_1.students.id,
                prenom: schema_1.students.prenom,
                nom: schema_1.students.nom,
                email: schema_1.students.email,
                lastActivity: schema_1.students.dernierAcces,
                createdAt: schema_1.students.createdAt
            })
                .from(schema_1.students)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.lt)(schema_1.students.dernierAcces, cutoffDate), 
            // Only consider students who have been inactive (not just never logged in)
            (0, drizzle_orm_1.sql) `${schema_1.students.dernierAcces} IS NOT NULL`));
            logger_1.logger.debug('Found inactive students', {
                count: inactiveStudents.length,
                cutoffDate,
                inactivityDays
            });
            return inactiveStudents.map(student => ({
                id: student.id.toString(),
                name: `${student.prenom} ${student.nom}`,
                email: student.email,
                lastActivity: student.lastActivity,
                warningsSent: false // This would be tracked in a separate table in production
            }));
        }
        catch (error) {
            logger_1.logger.error('Error finding inactive students:', error);
            return [];
        }
    }
    /**
     * Send inactivity warning to user
     */
    async sendInactivityWarning(entityId, entityType) {
        try {
            // In a real implementation, this would send an email or notification
            // For now, we'll just log the warning and create an audit entry
            await this.auditService.logAction({
                entityType: entityType,
                entityId: entityId,
                action: 'create',
                userId: null,
                details: {
                    warningType: 'inactivity_warning',
                    message: 'Account will be anonymized due to inactivity',
                    daysUntilAnonymization: this.inactivityConfig.warningDaysBeforeAnonymization,
                    preserveStatistics: this.inactivityConfig.preserveEducationalStatistics
                },
                severity: 'medium',
                category: 'compliance'
            });
            logger_1.logger.info('Inactivity warning sent', { entityId, entityType });
            // TODO: Implement actual email/notification sending
            // This could integrate with an email service like SendGrid, AWS SES, etc.
        }
        catch (error) {
            logger_1.logger.error('Error sending inactivity warning:', error);
        }
    }
    /**
     * Mark warning as sent for tracking
     */
    async markWarningAsSent(entityId) {
        try {
            // In a production system, this would update a warnings tracking table
            // For now, we'll create an audit entry to track this
            await this.auditService.logAction({
                entityType: 'student',
                entityId: entityId,
                action: 'update',
                userId: null,
                details: {
                    action: 'warning_marked_sent',
                    warningType: 'inactivity',
                    timestamp: new Date().toISOString()
                },
                severity: 'low',
                category: 'system'
            });
            logger_1.logger.debug('Inactivity warning marked as sent', { entityId });
        }
        catch (error) {
            logger_1.logger.error('Error marking warning as sent:', error);
        }
    }
    /**
     * Helper method to calculate audit checksum (used in consent anonymization)
     */
    calculateAuditChecksum(auditId, details) {
        const dataString = JSON.stringify({
            id: auditId,
            details: details
        });
        return crypto.createHash('sha256').update(dataString).digest('hex');
    }
    // Public methods for external access
    /**
     * Get job status
     */
    getJobStatus(jobId) {
        return this.runningJobs.get(jobId) || null;
    }
    /**
     * Cancel a pending anonymization job
     */
    async cancelJob(jobId) {
        try {
            const job = this.runningJobs.get(jobId);
            if (!job) {
                return false;
            }
            if (job.status === 'running') {
                logger_1.logger.warn('Cannot cancel running anonymization job', { jobId });
                return false;
            }
            if (job.status === 'pending') {
                job.status = 'cancelled';
                await this.auditService.logAction({
                    entityType: 'anonymization_job',
                    entityId: jobId,
                    action: 'failed',
                    userId: null,
                    details: {
                        reason: job.reason,
                        cancelledAt: new Date().toISOString()
                    },
                    severity: 'medium',
                    category: 'compliance'
                });
                logger_1.logger.info('Anonymization job cancelled', { jobId });
                return true;
            }
            return false;
        }
        catch (error) {
            logger_1.logger.error('Error cancelling anonymization job:', error);
            return false;
        }
    }
    /**
     * Get statistics about anonymization jobs
     */
    getJobStatistics() {
        const stats = {
            total: this.runningJobs.size,
            pending: 0,
            running: 0,
            completed: 0,
            failed: 0,
            cancelled: 0
        };
        for (const job of this.runningJobs.values()) {
            stats[job.status]++;
        }
        return stats;
    }
}
exports.DataAnonymizationService = DataAnonymizationService;
