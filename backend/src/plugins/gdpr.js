"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const config_1 = require("../config/config");
const audit_trail_service_1 = require("../services/audit-trail.service");
const encryption_service_1 = require("../services/encryption.service");
const email_service_1 = require("../services/email.service");
const gdpr_rights_service_1 = require("../services/gdpr-rights.service");
const parental_consent_service_1 = require("../services/parental-consent.service");
const data_retention_service_1 = require("../services/data-retention.service");
const data_anonymization_service_1 = require("../services/data-anonymization.service");
const gdprPlugin = async (fastify, options = {}) => {
    const opts = {
        enabled: config_1.gdprConfig.enabled,
        autoInitialize: true,
        auditMiddleware: true,
        ...options
    };
    if (!opts.enabled) {
        fastify.log.info('⚠️ GDPR plugin disabled via configuration');
        return;
    }
    fastify.log.info('🔄 Initializing GDPR plugin...');
    try {
        // Initialisation des services RGPD
        const auditService = new audit_trail_service_1.AuditTrailService();
        const encryptionService = new encryption_service_1.EncryptionService();
        const emailService = new email_service_1.EmailService();
        const gdprService = new gdpr_rights_service_1.GDPRRightsService();
        const consentService = new parental_consent_service_1.ParentalConsentService();
        const retentionService = new data_retention_service_1.DataRetentionService();
        const anonymizationService = new data_anonymization_service_1.DataAnonymizationService();
        // Décoration des services sur l'instance Fastify
        fastify.decorate('auditService', auditService);
        fastify.decorate('encryptionService', encryptionService);
        fastify.decorate('emailService', emailService);
        fastify.decorate('gdprService', gdprService);
        fastify.decorate('consentService', consentService);
        fastify.decorate('retentionService', retentionService);
        fastify.decorate('anonymizationService', anonymizationService);
        // Middleware d'audit automatique
        if (opts.auditMiddleware) {
            fastify.decorate('gdprAuditMiddleware', async (request, reply) => {
                try {
                    // Capturer les informations de la requête
                    const auditData = {
                        entityType: request.routerPath?.includes('/students') ? 'student' : 'user_session',
                        entityId: request.params?.id || request.user?.studentId?.toString() || 'anonymous',
                        action: request.method.toLowerCase() === 'get' ? 'read' :
                            request.method.toLowerCase() === 'post' ? 'create' :
                                request.method.toLowerCase() === 'put' ? 'update' :
                                    request.method.toLowerCase() === 'delete' ? 'delete' : 'read',
                        userId: request.user?.studentId?.toString() || null,
                        studentId: request.params?.id ? parseInt(request.params.id) : request.user?.studentId,
                        details: {
                            method: request.method,
                            url: request.url,
                            route: request.routerPath,
                            userAgent: request.headers['user-agent'] || '',
                            timestamp: new Date().toISOString()
                        },
                        ipAddress: request.ip,
                        userAgent: request.headers['user-agent'] || '',
                        timestamp: new Date(),
                        severity: 'low',
                        category: request.routerPath?.includes('/auth') ? 'user_behavior' : 'data_access'
                    };
                    // Log de l'audit de manière asynchrone pour ne pas bloquer la requête
                    setImmediate(async () => {
                        try {
                            await auditService.logAction(auditData);
                        }
                        catch (auditError) {
                            fastify.log.warn('Audit logging failed:', auditError);
                        }
                    });
                }
                catch (error) {
                    fastify.log.warn('GDPR audit middleware error:', error);
                    // Ne pas faire échouer la requête si l'audit échoue
                }
            });
            // Hook pour l'audit automatique sur toutes les routes
            fastify.addHook('preHandler', async (request, reply) => {
                // Appliquer l'audit uniquement sur les routes API sensibles
                if (request.url.startsWith('/api/') && !request.url.includes('/health')) {
                    await fastify.gdprAuditMiddleware(request, reply);
                }
            });
        }
        // Helpers pour chiffrement/déchiffrement
        fastify.decorate('gdprDataEncryption', async (data, usage = 'student_data') => {
            return await encryptionService.encryptStudentData(data);
        });
        fastify.decorate('gdprDataDecryption', async (encryptedData) => {
            return await encryptionService.decryptStudentData(encryptedData);
        });
        // Hook pour la vérification du consentement parental sur les routes étudiants
        if (config_1.gdprConfig.parentalConsentRequired) {
            fastify.addHook('preHandler', async (request, reply) => {
                // Vérifier le consentement uniquement pour les routes d'étudiants
                if (request.url.startsWith('/api/students') && request.method !== 'GET') {
                    const studentId = request.params?.id || request.user?.studentId;
                    if (studentId) {
                        try {
                            const hasConsent = await consentService.isConsentValidForProcessing(studentId.toString(), 'data_processing');
                            if (!hasConsent) {
                                return reply.status(403).send({
                                    success: false,
                                    error: {
                                        message: 'Consentement parental requis pour cette action',
                                        code: 'PARENTAL_CONSENT_REQUIRED'
                                    }
                                });
                            }
                        }
                        catch (error) {
                            fastify.log.warn('Consent verification failed:', error);
                            // En cas d'erreur, permettre l'accès mais logger l'incident
                            await auditService.logAction({
                                entityType: 'parental_consent',
                                entityId: studentId.toString(),
                                action: 'read',
                                userId: null, // request.user not available in this context
                                details: {
                                    error: 'consent_verification_failed',
                                    route: request.url
                                },
                                ipAddress: request.ip,
                                userAgent: request.headers['user-agent'] || '',
                                timestamp: new Date(),
                                severity: 'medium',
                                category: 'consent_management'
                            });
                        }
                    }
                }
                // Explicit return for all code paths
                return;
            });
        }
        // Tâches de maintenance RGPD en arrière-plan
        if (opts.autoInitialize) {
            // Nettoyage automatique des clés expirées (toutes les 24h)
            setInterval(async () => {
                try {
                    await encryptionService.cleanupExpiredKeys();
                    fastify.log.info('🧹 Cleaned up expired encryption keys');
                }
                catch (error) {
                    fastify.log.error('Error cleaning up expired keys:', error);
                }
            }, 24 * 60 * 60 * 1000); // 24 heures
            // Application des politiques de rétention (toutes les 6h)
            setInterval(async () => {
                try {
                    await retentionService.executeRetentionPolicies();
                    fastify.log.debug('✅ Retention policies applied');
                }
                catch (error) {
                    fastify.log.error('Error applying retention policies:', error);
                }
            }, 6 * 60 * 60 * 1000); // 6 heures
            fastify.log.info('⏰ GDPR maintenance tasks scheduled');
        }
        // Hook de fermeture pour nettoyage propre
        fastify.addHook('onClose', async () => {
            fastify.log.info('🔄 Shutting down GDPR services...');
            // Ici on pourrait ajouter du nettoyage si nécessaire
            return; // Explicit return for all code paths
        });
        fastify.log.info('✅ GDPR plugin initialized successfully');
        fastify.log.info(`📊 GDPR Configuration: 
      - Parental consent required: ${config_1.gdprConfig.parentalConsentRequired}
      - Data retention: ${config_1.gdprConfig.dataRetentionDays} days
      - Key rotation: ${config_1.gdprConfig.encryptionKeyRotationDays} days
      - Audit retention: ${config_1.gdprConfig.auditLogRetentionDays} days`);
    }
    catch (error) {
        fastify.log.error('❌ Failed to initialize GDPR plugin:', error);
        throw error;
    }
};
exports.default = (0, fastify_plugin_1.default)(gdprPlugin, {
    name: 'gdpr',
    dependencies: ['database'] // S'assurer que la DB est prête
});
