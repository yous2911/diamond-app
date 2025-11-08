"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GDPRRightsService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const audit_trail_service_1 = require("./audit-trail.service");
const encryption_service_1 = require("./encryption.service");
const email_service_1 = require("./email.service");
// Validation schemas
const GDPRRequestSchema = zod_1.z.object({
    requestType: zod_1.z.enum([
        'access', // Article 15 - Right of access
        'rectification', // Article 16 - Right to rectification
        'erasure', // Article 17 - Right to erasure (right to be forgotten)
        'restriction', // Article 18 - Right to restriction of processing
        'portability', // Article 20 - Right to data portability
        'objection', // Article 21 - Right to object
        'withdraw_consent' // Article 7 - Right to withdraw consent
    ]),
    requesterType: zod_1.z.enum(['parent', 'student', 'legal_guardian', 'data_protection_officer']),
    requesterEmail: zod_1.z.string().email(),
    requesterName: zod_1.z.string().min(2).max(100),
    studentId: zod_1.z.string().optional(),
    studentName: zod_1.z.string().optional(),
    parentEmail: zod_1.z.string().email().optional(),
    requestDetails: zod_1.z.string().min(10).max(2000),
    urgentRequest: zod_1.z.boolean().default(false),
    attachments: zod_1.z.array(zod_1.z.string()).optional(),
    ipAddress: zod_1.z.string().ip(),
    userAgent: zod_1.z.string(),
    verificationMethod: zod_1.z.enum(['email', 'identity_document', 'parental_verification']),
    legalBasis: zod_1.z.string().optional()
});
const GDPRResponseSchema = zod_1.z.object({
    requestId: zod_1.z.string().uuid(),
    responseType: zod_1.z.enum(['approved', 'rejected', 'partially_approved', 'requires_clarification']),
    responseDetails: zod_1.z.string().min(10),
    actionsTaken: zod_1.z.array(zod_1.z.string()),
    timelineExtension: zod_1.z.number().min(0).max(60).optional(), // Additional days
    rejectionReason: zod_1.z.string().optional(),
    attachments: zod_1.z.array(zod_1.z.string()).optional()
});
class GDPRRightsService {
    constructor() {
        this.pendingVerifications = new Map();
        this.auditService = new audit_trail_service_1.AuditTrailService();
        this.encryptionService = new encryption_service_1.EncryptionService();
        this.emailService = new email_service_1.EmailService();
        this.initializeGDPRSystem();
    }
    /**
     * Submit a new GDPR request
     */
    async submitGDPRRequest(requestData) {
        try {
            const validatedData = GDPRRequestSchema.parse(requestData);
            // Generate unique request ID
            const requestId = crypto_1.default.randomUUID();
            // Calculate due date (30 days from submission, or 1 month)
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + (validatedData.urgentRequest ? 15 : 30));
            // Determine priority
            const priority = this.determinePriority(validatedData.requestType, validatedData.urgentRequest);
            // Create GDPR request
            const gdprRequest = {
                id: requestId,
                requestType: validatedData.requestType,
                requesterType: validatedData.requesterType,
                requesterEmail: validatedData.requesterEmail,
                requesterName: validatedData.requesterName,
                studentId: validatedData.studentId,
                studentName: validatedData.studentName,
                parentEmail: validatedData.parentEmail,
                requestDetails: validatedData.requestDetails,
                urgentRequest: validatedData.urgentRequest,
                status: 'pending',
                priority,
                submittedAt: new Date(),
                dueDate,
                attachments: validatedData.attachments || [],
                ipAddress: validatedData.ipAddress,
                userAgent: validatedData.userAgent,
                verificationMethod: validatedData.verificationMethod,
                legalBasis: validatedData.legalBasis,
                actionsTaken: []
            };
            // Store request
            await this.storeGDPRRequest(gdprRequest);
            // Log audit trail
            await this.auditService.logAction({
                entityType: 'gdpr_request',
                entityId: requestId,
                action: 'create',
                userId: null,
                studentId: validatedData.studentId,
                details: {
                    requestType: validatedData.requestType,
                    requesterType: validatedData.requesterType,
                    requesterEmail: validatedData.requesterEmail,
                    urgentRequest: validatedData.urgentRequest,
                    priority
                },
                ipAddress: validatedData.ipAddress,
                userAgent: validatedData.userAgent,
                timestamp: new Date(),
                severity: 'medium',
                category: 'compliance'
            });
            // Send verification email if required
            let verificationRequired = false;
            if (this.requiresVerification(validatedData)) {
                await this.sendVerificationEmail(gdprRequest);
                verificationRequired = true;
            }
            else {
                // Automatically approve if no verification needed
                await this.updateRequestStatus(requestId, 'under_review');
                await this.assignToDataProtectionOfficer(requestId);
            }
            // Send confirmation email
            await this.sendRequestConfirmationEmail(gdprRequest);
            logger_1.logger.info('GDPR request submitted', {
                requestId,
                requestType: validatedData.requestType,
                priority,
                verificationRequired
            });
            return {
                requestId,
                verificationRequired,
                estimatedCompletionDate: dueDate
            };
        }
        catch (error) {
            logger_1.logger.error('Error submitting GDPR request:', error);
            throw new Error('Failed to submit GDPR request');
        }
    }
    /**
     * Verify GDPR request identity
     */
    async verifyGDPRRequest(verificationToken) {
        try {
            const verification = this.pendingVerifications.get(verificationToken);
            if (!verification) {
                throw new Error('Invalid or expired verification token');
            }
            if (new Date() > verification.expiresAt) {
                this.pendingVerifications.delete(verificationToken);
                throw new Error('Verification token has expired');
            }
            const requestId = verification.requestId;
            // Update request status
            await this.updateRequestStatus(requestId, 'under_review');
            await this.updateRequestField(requestId, 'verifiedAt', new Date());
            // Remove verification token
            this.pendingVerifications.delete(verificationToken);
            // Assign to DPO
            await this.assignToDataProtectionOfficer(requestId);
            // Log verification
            await this.auditService.logAction({
                entityType: 'gdpr_request',
                entityId: requestId,
                action: 'verified',
                userId: null,
                details: {
                    verificationToken,
                    verifiedAt: new Date()
                },
                timestamp: new Date(),
                severity: 'medium',
                category: 'compliance'
            });
            logger_1.logger.info('GDPR request verified', { requestId });
            return {
                requestId,
                verified: true,
                nextSteps: 'Your request has been verified and assigned to our Data Protection Officer for review.'
            };
        }
        catch (error) {
            logger_1.logger.error('Error verifying GDPR request:', error);
            throw error;
        }
    }
    /**
     * Process data access request (Article 15)
     */
    async processDataAccessRequest(requestId) {
        try {
            const request = await this.getGDPRRequest(requestId);
            if (!request) {
                throw new Error('GDPR request not found');
            }
            if (request.requestType !== 'access') {
                throw new Error('Invalid request type for data access');
            }
            if (!request.studentId) {
                throw new Error('Student ID required for data access request');
            }
            // Compile student data portfolio
            const portfolio = await this.compileStudentDataPortfolio(request.studentId);
            // Encrypt sensitive data for export
            const encryptedPortfolio = await this.encryptionService.encryptStudentData(portfolio);
            // Update request with exported data
            await this.updateRequestField(requestId, 'exportedData', encryptedPortfolio);
            await this.updateRequestStatus(requestId, 'completed');
            // Log data access
            await this.auditService.logAction({
                entityType: 'gdpr_request',
                entityId: requestId,
                action: 'completed',
                userId: null,
                studentId: request.studentId,
                details: {
                    requestType: 'access',
                    dataExported: true,
                    portfolioSections: Object.keys(portfolio.personalData)
                },
                timestamp: new Date(),
                severity: 'high',
                category: 'data_access'
            });
            logger_1.logger.info('Data access request processed', {
                requestId,
                studentId: request.studentId
            });
            return portfolio;
        }
        catch (error) {
            logger_1.logger.error('Error processing data access request:', error);
            throw new Error('Failed to process data access request');
        }
    }
    /**
     * Process data erasure request (Article 17)
     */
    async processDataErasureRequest(requestId, reason) {
        try {
            const request = await this.getGDPRRequest(requestId);
            if (!request) {
                throw new Error('GDPR request not found');
            }
            if (request.requestType !== 'erasure') {
                throw new Error('Invalid request type for data erasure');
            }
            if (!request.studentId) {
                throw new Error('Student ID required for data erasure request');
            }
            // Analyze what data can be deleted vs retained
            const erasureAnalysis = await this.analyzeDataErasure(request.studentId);
            // Perform data deletion
            const deletedData = [];
            const retainedData = [];
            for (const dataCategory of erasureAnalysis.deletableData) {
                await this.deleteStudentDataCategory(request.studentId, dataCategory);
                deletedData.push(dataCategory);
            }
            for (const dataCategory of erasureAnalysis.retainedData) {
                retainedData.push(`${dataCategory}: ${erasureAnalysis.retentionReasons[dataCategory]}`);
            }
            // Anonymize audit logs
            await this.auditService.anonymizeStudentAuditLogs(request.studentId, reason);
            // Update request
            await this.updateRequestStatus(requestId, 'completed');
            await this.updateRequestField(requestId, 'actionsTaken', [
                `Deleted data categories: ${deletedData.join(', ')}`,
                `Retained data categories: ${retainedData.length > 0 ? retainedData.join(', ') : 'None'}`,
                'Anonymized audit logs'
            ]);
            // Log erasure action
            await this.auditService.logAction({
                entityType: 'gdpr_request',
                entityId: requestId,
                action: 'completed',
                userId: null,
                studentId: request.studentId,
                details: {
                    requestType: 'erasure',
                    deletedData,
                    retainedData: erasureAnalysis.retainedData,
                    reason
                },
                timestamp: new Date(),
                severity: 'high',
                category: 'compliance'
            });
            // Send completion notification
            await this.sendErasureCompletionEmail(request, deletedData, retainedData);
            logger_1.logger.info('Data erasure request processed', {
                requestId,
                studentId: request.studentId,
                deletedCount: deletedData.length,
                retainedCount: retainedData.length
            });
            return {
                deletedData,
                retainedData,
                reason
            };
        }
        catch (error) {
            logger_1.logger.error('Error processing data erasure request:', error);
            throw new Error('Failed to process data erasure request');
        }
    }
    /**
     * Process data portability request (Article 20)
     */
    async processDataPortabilityRequest(requestId, format = 'json') {
        try {
            const request = await this.getGDPRRequest(requestId);
            if (!request) {
                throw new Error('GDPR request not found');
            }
            if (request.requestType !== 'portability') {
                throw new Error('Invalid request type for data portability');
            }
            if (!request.studentId) {
                throw new Error('Student ID required for data portability request');
            }
            // Extract portable data only (data provided by user, not derived)
            const portableData = await this.extractPortableData(request.studentId);
            // Export in requested format
            const exportFile = await this.exportDataInFormat(portableData, format, request.studentId);
            // Generate secure download URL
            const downloadUrl = await this.generateSecureDownloadUrl(exportFile, request.requesterEmail);
            // Update request
            await this.updateRequestStatus(requestId, 'completed');
            await this.updateRequestField(requestId, 'actionsTaken', [
                `Data exported in ${format.toUpperCase()} format`,
                `Secure download link generated`
            ]);
            // Log portability action
            await this.auditService.logAction({
                entityType: 'gdpr_request',
                entityId: requestId,
                action: 'completed',
                userId: null,
                studentId: request.studentId,
                details: {
                    requestType: 'portability',
                    format,
                    exportFile,
                    dataCategories: Object.keys(portableData)
                },
                timestamp: new Date(),
                severity: 'medium',
                category: 'data_access'
            });
            // Send download notification
            await this.sendPortabilityCompletionEmail(request, downloadUrl);
            logger_1.logger.info('Data portability request processed', {
                requestId,
                studentId: request.studentId,
                format
            });
            return {
                exportFile,
                format,
                downloadUrl
            };
        }
        catch (error) {
            logger_1.logger.error('Error processing data portability request:', error);
            throw new Error('Failed to process data portability request');
        }
    }
    /**
     * Get GDPR request status
     */
    async getGDPRRequestStatus(requestId) {
        try {
            const request = await this.getGDPRRequest(requestId);
            if (!request) {
                throw new Error('GDPR request not found');
            }
            const now = new Date();
            const timeRemainingMs = request.dueDate.getTime() - now.getTime();
            const daysRemaining = Math.ceil(timeRemainingMs / (1000 * 60 * 60 * 24));
            const timeRemaining = daysRemaining > 0
                ? `${daysRemaining} days remaining`
                : 'Overdue';
            return {
                status: request.status,
                priority: request.priority,
                submittedAt: request.submittedAt,
                dueDate: request.dueDate,
                processedAt: request.processedAt,
                actionsTaken: request.actionsTaken,
                timeRemaining
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting GDPR request status:', error);
            throw new Error('Failed to get request status');
        }
    }
    /**
     * List GDPR requests (for admin/DPO)
     */
    async listGDPRRequests(filters = {}) {
        try {
            const { requests, total } = await this.queryGDPRRequests(filters);
            // Count overdue requests
            const now = new Date();
            const overdue = requests.filter(r => r.dueDate < now && r.status !== 'completed').length;
            // Remove sensitive data from response
            const sanitizedRequests = requests.map(request => {
                const { attachments, exportedData, ...sanitized } = request;
                return sanitized;
            });
            return {
                requests: sanitizedRequests,
                total,
                overdue
            };
        }
        catch (error) {
            logger_1.logger.error('Error listing GDPR requests:', error);
            throw new Error('Failed to list GDPR requests');
        }
    }
    // Private helper methods
    determinePriority(requestType, urgent) {
        if (urgent)
            return 'urgent';
        const highPriorityTypes = ['erasure', 'restriction'];
        const mediumPriorityTypes = ['access', 'portability'];
        if (highPriorityTypes.includes(requestType))
            return 'high';
        if (mediumPriorityTypes.includes(requestType))
            return 'medium';
        return 'low';
    }
    requiresVerification(requestData) {
        // Verification required for sensitive requests or when not initiated by parent
        const sensitiveRequests = ['erasure', 'restriction'];
        return sensitiveRequests.includes(requestData.requestType) ||
            requestData.requesterType !== 'parent';
    }
    async sendVerificationEmail(request) {
        const verificationToken = crypto_1.default.randomUUID();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        this.pendingVerifications.set(verificationToken, {
            requestId: request.id,
            expiresAt
        });
        const verificationUrl = `${process.env.FRONTEND_URL}/gdpr/verify/${verificationToken}`;
        await this.emailService.sendEmail({
            to: request.requesterEmail,
            subject: 'Vérification de votre demande RGPD - RevEd Kids',
            template: 'gdpr-verification',
            variables: {
                requesterName: request.requesterName,
                requestType: this.translateRequestType(request.requestType),
                requestId: request.id,
                verificationUrl,
                expiryTime: '24 heures'
            }
        });
    }
    async sendRequestConfirmationEmail(request) {
        await this.emailService.sendEmail({
            to: request.requesterEmail,
            subject: 'Confirmation de votre demande RGPD - RevEd Kids',
            template: 'gdpr-confirmation',
            variables: {
                requesterName: request.requesterName,
                requestType: this.translateRequestType(request.requestType),
                requestId: request.id,
                dueDate: request.dueDate.toLocaleDateString('fr-FR'),
                priority: request.priority
            }
        });
    }
    translateRequestType(type) {
        const translations = {
            'access': 'Accès aux données personnelles',
            'rectification': 'Rectification des données',
            'erasure': 'Effacement des données',
            'restriction': 'Limitation du traitement',
            'portability': 'Portabilité des données',
            'objection': 'Opposition au traitement',
            'withdraw_consent': 'Retrait du consentement'
        };
        return translations[type] || type;
    }
    async initializeGDPRSystem() {
        // Initialize GDPR system components
        logger_1.logger.info('GDPR rights management system initialized');
    }
    // Database and external service methods (implement with your services)
    async storeGDPRRequest(request) {
        // TODO: Implement database storage
    }
    async getGDPRRequest(requestId) {
        // TODO: Implement database query
        return null;
    }
    async updateRequestStatus(requestId, status) {
        // TODO: Implement database update
    }
    async updateRequestField(requestId, field, value) {
        // TODO: Implement database update
    }
    async queryGDPRRequests(filters) {
        // TODO: Implement database query
        return { requests: [], total: 0 };
    }
    async assignToDataProtectionOfficer(requestId) {
        // TODO: Implement assignment logic
    }
    async compileStudentDataPortfolio(studentId) {
        // TODO: Implement data compilation
        return {};
    }
    async analyzeDataErasure(studentId) {
        // TODO: Implement erasure analysis
        return { deletableData: [], retainedData: [], retentionReasons: {} };
    }
    async deleteStudentDataCategory(studentId, category) {
        // TODO: Implement data deletion
    }
    async extractPortableData(studentId) {
        // TODO: Implement portable data extraction
        return {};
    }
    async exportDataInFormat(data, format, studentId) {
        // TODO: Implement data export
        return '';
    }
    async generateSecureDownloadUrl(filePath, email) {
        // TODO: Implement secure URL generation
        return '';
    }
    async sendErasureCompletionEmail(request, deleted, retained) {
        // TODO: Implement email sending
    }
    async sendPortabilityCompletionEmail(request, downloadUrl) {
        // TODO: Implement email sending
    }
}
exports.GDPRRightsService = GDPRRightsService;
