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
exports.EmailService = void 0;
const nodemailer = __importStar(require("nodemailer"));
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
const audit_trail_service_1 = require("./audit-trail.service");
class EmailService {
    constructor() {
        // Use fake transporter for testing
        if (config_1.config.NODE_ENV === 'test') {
            this.transporter = nodemailer.createTransport({
                streamTransport: true,
                newline: 'unix',
                buffer: true
            });
        }
        else {
            // Utiliser la configuration email centralisée
            this.transporter = nodemailer.createTransport({
                host: config_1.emailConfig.host,
                port: config_1.emailConfig.port,
                secure: config_1.emailConfig.port === 465,
                auth: config_1.emailConfig.user ? {
                    user: config_1.emailConfig.user,
                    pass: config_1.emailConfig.pass
                } : undefined,
                // Configuration de sécurité renforcée
                connectionTimeout: 60000,
                greetingTimeout: 30000,
                socketTimeout: 60000,
                logger: config_1.config.NODE_ENV === 'development',
                debug: config_1.config.NODE_ENV === 'development'
            });
        }
        this.auditService = new audit_trail_service_1.AuditTrailService();
        // Vérifier la connexion au démarrage (skip in test mode)
        if (config_1.config.NODE_ENV !== 'test') {
            this.verifyConnection();
        }
    }
    async sendEmail(options) {
        try {
            const html = this.renderTemplate(options.template, options.variables);
            const mailOptions = {
                from: config_1.emailConfig.from,
                to: options.to,
                subject: options.subject,
                html,
                attachments: options.attachments,
                // Headers de sécurité
                headers: {
                    'X-Priority': '1',
                    'X-MSMail-Priority': 'High',
                    'X-Mailer': 'RevEd Kids Platform',
                    'X-Auto-Response-Suppress': 'All'
                }
            };
            // In test mode, just log the email instead of sending
            let result;
            if (config_1.config.NODE_ENV === 'test') {
                logger_1.logger.info('📧 Email would be sent:', {
                    to: options.to,
                    subject: options.subject,
                    template: options.template
                });
                result = { messageId: 'test-message-id', accepted: [options.to], rejected: [] };
            }
            else {
                result = await this.transporter.sendMail(mailOptions);
            }
            // Audit log pour l'envoi d'email
            await this.auditService.logAction({
                entityType: 'user_session',
                entityId: options.to,
                action: 'create',
                userId: null,
                details: {
                    emailType: 'gdpr_notification',
                    template: options.template,
                    to: options.to,
                    subject: options.subject,
                    messageId: result.messageId,
                    accepted: result.accepted,
                    rejected: result.rejected
                },
                severity: 'low',
                category: 'compliance'
            });
            logger_1.logger.info('Email sent successfully', {
                to: options.to,
                subject: options.subject,
                template: options.template,
                messageId: result.messageId
            });
        }
        catch (error) {
            logger_1.logger.error('Error sending email:', error);
            throw new Error('Failed to send email');
        }
    }
    renderTemplate(template, variables) {
        const templates = {
            // =================================
            // USER REGISTRATION TEMPLATES
            // =================================
            'user-registration-welcome': `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #3B82F6;">Bienvenue sur RevEd Kids !</h2>
          <p>Bonjour ${variables.userName},</p>
          <p>Votre compte a été créé avec succès sur la plateforme RevEd Kids.</p>
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Identifiant :</strong> ${variables.username}</p>
            <p><strong>Email :</strong> ${variables.email}</p>
            <p><strong>Date de création :</strong> ${variables.createdAt}</p>
          </div>
          <p>Pour commencer à utiliser la plateforme :</p>
          <p><a href="${variables.loginUrl}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Se connecter maintenant</a></p>
          <p>Si vous n'avez pas créé ce compte, contactez-nous immédiatement à ${config_1.emailConfig.supportEmail}</p>
          <p>Cordialement,<br>L'équipe RevEd Kids</p>
        </div>
      `,
            'user-registration-verification': `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #3B82F6;">Vérification de votre compte RevEd Kids</h2>
          <p>Bonjour ${variables.userName},</p>
          <p>Merci de vous être inscrit sur RevEd Kids ! Pour finaliser votre inscription, veuillez vérifier votre adresse email.</p>
          <p><a href="${variables.verificationUrl}" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Vérifier mon email</a></p>
          <div style="background: #FEF3C7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0;"><strong>⏰ Important :</strong> Ce lien expire le ${variables.expiryDate}</p>
          </div>
          <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
          <p style="word-break: break-all; background: #F3F4F6; padding: 10px; border-radius: 4px; font-family: monospace;">${variables.verificationUrl}</p>
          <p>Si vous n'avez pas créé ce compte, ignorez cet email.</p>
          <p>Cordialement,<br>L'équipe RevEd Kids</p>
        </div>
      `,
            // =================================
            // PASSWORD RESET TEMPLATES
            // =================================
            'password-reset-request': `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #EF4444;">Réinitialisation de votre mot de passe</h2>
          <p>Bonjour ${variables.userName},</p>
          <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte.</p>
          <div style="background: #FEE2E2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>🔒 Demande de réinitialisation</strong></p>
            <p><strong>Date :</strong> ${variables.requestDate}</p>
            <p><strong>Adresse IP :</strong> ${variables.ipAddress}</p>
            <p><strong>Navigateur :</strong> ${variables.userAgent}</p>
          </div>
          <p>Pour réinitialiser votre mot de passe, cliquez sur le bouton ci-dessous :</p>
          <p><a href="${variables.resetUrl}" style="background: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Réinitialiser mon mot de passe</a></p>
          <div style="background: #FEF3C7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0;"><strong>⏰ Important :</strong> Ce lien expire dans ${variables.expiryTime}</p>
          </div>
          <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe actuel reste inchangé.</p>
          <p>Pour votre sécurité, ne partagez jamais ce lien avec personne d'autre.</p>
          <p>Cordialement,<br>L'équipe RevEd Kids</p>
        </div>
      `,
            'password-reset-confirmation': `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #10B981;">Mot de passe réinitialisé avec succès</h2>
          <p>Bonjour ${variables.userName},</p>
          <p>Votre mot de passe a été réinitialisé avec succès.</p>
          <div style="background: #D1FAE5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>✅ Confirmation de modification</strong></p>
            <p><strong>Date :</strong> ${variables.resetDate}</p>
            <p><strong>Adresse IP :</strong> ${variables.ipAddress}</p>
          </div>
          <p>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe :</p>
          <p><a href="${variables.loginUrl}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Se connecter</a></p>
          <p>Si vous n'avez pas effectué cette modification, contactez immédiatement notre support à ${config_1.emailConfig.supportEmail}</p>
          <p>Cordialement,<br>L'équipe RevEd Kids</p>
        </div>
      `,
            // =================================
            // NOTIFICATION TEMPLATES
            // =================================
            'student-progress-report': `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #3B82F6;">Rapport de progression - ${variables.studentName}</h2>
          <p>Bonjour ${variables.parentName},</p>
          <p>Voici le rapport de progression hebdomadaire de ${variables.studentName} :</p>
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📊 Statistiques de la semaine</h3>
            <p><strong>Exercices complétés :</strong> ${variables.exercisesCompleted}</p>
            <p><strong>Temps d'étude :</strong> ${variables.studyTime}</p>
            <p><strong>Score moyen :</strong> ${variables.averageScore}%</p>
            <p><strong>Matières étudiées :</strong> ${variables.subjects}</p>
          </div>
          <p><a href="${variables.dashboardUrl}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Voir le tableau de bord</a></p>
          <p>Cordialement,<br>L'équipe RevEd Kids</p>
        </div>
      `,
            'achievement-notification': `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #F59E0B;">🏆 Nouveau succès débloqué !</h2>
          <p>Félicitations ${variables.studentName} !</p>
          <p>Tu viens de débloquer un nouveau succès :</p>
          <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="margin: 0; color: #F59E0B;">🏆 ${variables.achievementTitle}</h3>
            <p style="margin: 10px 0 0 0;">${variables.achievementDescription}</p>
          </div>
          <p>Continue comme ça, tu fais un excellent travail !</p>
          <p><a href="${variables.achievementsUrl}" style="background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Voir tous mes succès</a></p>
          <p>Cordialement,<br>L'équipe RevEd Kids</p>
        </div>
      `,
            'system-maintenance': `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #F59E0B;">⚠️ Maintenance programmée</h2>
          <p>Cher utilisateur,</p>
          <p>Nous vous informons qu'une maintenance est programmée sur la plateforme RevEd Kids.</p>
          <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>📅 Date :</strong> ${variables.maintenanceDate}</p>
            <p><strong>⏰ Horaire :</strong> ${variables.maintenanceTime}</p>
            <p><strong>⏱️ Durée estimée :</strong> ${variables.duration}</p>
            <p><strong>🎯 Objectif :</strong> ${variables.purpose}</p>
          </div>
          <p>Pendant cette période, la plateforme sera temporairement inaccessible.</p>
          <p>Nous nous excusons pour la gêne occasionnée et vous remercions de votre compréhension.</p>
          <p>Cordialement,<br>L'équipe technique RevEd Kids</p>
        </div>
      `,
            'security-alert': `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #EF4444;">🔒 Alerte de sécurité</h2>
          <p>Bonjour ${variables.userName},</p>
          <p>Nous avons détecté une activité inhabituelle sur votre compte :</p>
          <div style="background: #FEE2E2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>🚨 Type d'alerte :</strong> ${variables.alertType}</p>
            <p><strong>📅 Date :</strong> ${variables.alertDate}</p>
            <p><strong>🌍 Localisation :</strong> ${variables.location}</p>
            <p><strong>💻 Appareil :</strong> ${variables.device}</p>
          </div>
          <p>Si c'était vous, aucune action n'est requise.</p>
          <p>Si ce n'était pas vous, sécurisez immédiatement votre compte :</p>
          <p><a href="${variables.securityUrl}" style="background: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Sécuriser mon compte</a></p>
          <p>En cas de doute, contactez notre support : ${config_1.emailConfig.supportEmail}</p>
          <p>Cordialement,<br>L'équipe sécurité RevEd Kids</p>
        </div>
      `,
            // =================================
            // GDPR TEMPLATES (Enhanced)
            // =================================
            'parental-consent-first': `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #3B82F6;">Confirmation de consentement parental - RevEd Kids (1/2)</h2>
          <p>Bonjour ${variables.parentName},</p>
          <p>Nous avons reçu une demande de création de compte pour votre enfant <strong>${variables.childName}</strong>.</p>
          <p>Pour finaliser la création du compte, veuillez confirmer votre consentement en cliquant sur le lien ci-dessous :</p>
          <p><a href="${variables.verificationUrl}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Confirmer le consentement (1/2)</a></p>
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Types de consentement :</strong></p>
            <ul style="margin: 10px 0;">${variables.consentTypes}</ul>
          </div>
          <div style="background: #FEF3C7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0;"><strong>⏰ Ce lien expire le ${variables.expiryDate}</strong></p>
          </div>
          <p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
          <p>Cordialement,<br>L'équipe RevEd Kids</p>
        </div>
      `,
            'parental-consent-second': `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #059669;">Confirmation finale - RevEd Kids (2/2)</h2>
          <p>Bonjour ${variables.parentName},</p>
          <p>Merci pour votre première confirmation. Pour finaliser complètement le processus, veuillez confirmer une seconde fois :</p>
          <p><a href="${variables.verificationUrl}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Confirmation finale (2/2)</a></p>
          <div style="background: #FEF3C7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0;"><strong>⏰ Ce lien expire le ${variables.expiryDate}</strong></p>
          </div>
          <p>Une fois confirmé, le compte de ${variables.childName} sera activé.</p>
          <p>Cordialement,<br>L'équipe RevEd Kids</p>
        </div>
      `,
            'student-account-created': `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #10B981;">Compte élève créé avec succès !</h2>
          <p>Bonjour ${variables.parentName},</p>
          <p>Le compte de votre enfant <strong>${variables.childName}</strong> a été créé avec succès !</p>
          <div style="background: #D1FAE5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Identifiant élève :</strong> ${variables.studentId}</p>
            <p><strong>Nom d'utilisateur :</strong> ${variables.username}</p>
          </div>
          <p>Vous pouvez maintenant accéder à la plateforme :</p>
          <p><a href="${variables.loginUrl}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accéder à la plateforme</a></p>
          <p>Pour toute question : ${config_1.emailConfig.supportEmail}</p>
          <p>Cordialement,<br>L'équipe RevEd Kids</p>
        </div>
      `,
            'gdpr-verification': `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #DC2626;">Vérification de votre demande RGPD</h2>
          <p>Bonjour ${variables.requesterName},</p>
          <p>Nous avons reçu votre demande de <strong>${variables.requestType}</strong>.</p>
          <div style="background: #FEE2E2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Numéro de demande :</strong> ${variables.requestId}</p>
            <p><strong>Type :</strong> ${variables.requestType}</p>
            <p><strong>Date :</strong> ${variables.requestDate}</p>
          </div>
          <p>Pour des raisons de sécurité, veuillez vérifier votre identité :</p>
          <p><a href="${variables.verificationUrl}" style="background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Vérifier mon identité</a></p>
          <div style="background: #FEF3C7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0;"><strong>⏰ Ce lien expire dans ${variables.expiryTime}</strong></p>
          </div>
          <p>Cordialement,<br>L'équipe RevEd Kids</p>
        </div>
      `,
            'gdpr-confirmation': `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #10B981;">Confirmation de votre demande RGPD</h2>
          <p>Bonjour ${variables.requesterName},</p>
          <p>Votre demande de <strong>${variables.requestType}</strong> a été enregistrée avec succès.</p>
          <div style="background: #D1FAE5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Numéro de demande :</strong> ${variables.requestId}</p>
            <p><strong>Priorité :</strong> ${variables.priority}</p>
            <p><strong>Échéance de traitement :</strong> ${variables.dueDate}</p>
            <p><strong>Statut :</strong> En cours de traitement</p>
          </div>
          <p>Nous vous tiendrons informé de l'avancement de votre demande.</p>
          <p>Cordialement,<br>L'équipe RevEd Kids</p>
        </div>
      `,
            'test': `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #3B82F6;">Test de Configuration Email - RevEd Kids</h2>
          <p>Ce message confirme que la configuration email fonctionne correctement.</p>
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Timestamp :</strong> ${variables.timestamp}</p>
            <p><strong>Environnement :</strong> ${variables.environment}</p>
            <p><strong>Version :</strong> ${variables.version || '1.0.0'}</p>
          </div>
          <p>Si vous recevez ce message, le service email est opérationnel.</p>
          <p>Cordialement,<br>L'équipe technique RevEd Kids</p>
        </div>
      `,
            // =================================
            // DATA RETENTION TEMPLATES
            // =================================
            'retention-warning': `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #F59E0B;">⚠️ Alerte de Rétention de Données</h2>
          <p>Une action de rétention de données est programmée et nécessite votre attention.</p>
          
          <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📊 Détails de l'Entité</h3>
            <p><strong>ID de l'entité :</strong> ${variables.entityId}</p>
            <p><strong>Type d'entité :</strong> ${variables.entityType}</p>
            <p><strong>Politique :</strong> ${variables.policyName}</p>
          </div>
          
          <div style="background: #FEE2E2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">🎯 Action Requise</h3>
            <p><strong>Action :</strong> ${variables.action}</p>
            <p><strong>Période de rétention :</strong> ${variables.retentionPeriod} jours</p>
            <p><strong>Date d'action :</strong> ${variables.actionDate}</p>
            <p><strong>Préavis :</strong> ${variables.warningDays} jour(s)</p>
          </div>
          
          <div style="background: #DBEAFE; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📋 Actions Recommandées</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Vérifier la conformité de la politique de rétention</li>
              <li>Confirmer que l'action programmée est appropriée</li>
              <li>Sauvegarder les données si nécessaire avant l'action</li>
              <li>Documenter l'action dans le journal d'audit</li>
            </ul>
          </div>
          
          <p>Cette notification est générée automatiquement par le système de rétention des données pour assurer la conformité RGPD.</p>
          <p>Cordialement,<br>Système de Rétention RevEd Kids</p>
        </div>
      `
        };
        return templates[template] || `<div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;"><h2 style="color: #EF4444;">Template Error</h2><p>Template "${template}" not found. Available templates: ${Object.keys(templates).join(', ')}</p></div>`;
    }
    /**
     * Vérifier la connexion SMTP au démarrage
     */
    async verifyConnection() {
        try {
            if (!config_1.emailConfig.user || !config_1.emailConfig.host) {
                logger_1.logger.warn('⚠️ Email service: SMTP configuration incomplete, emails will be mocked');
                return;
            }
            await this.transporter.verify();
            logger_1.logger.info('✅ Email service: SMTP connection verified');
        }
        catch (error) {
            logger_1.logger.warn('⚠️ Email service: SMTP verification failed, emails will be logged only', error);
        }
    }
    /**
     * Enhanced email sending with improved retry logic and fallback mechanisms
     */
    async sendEmailWithRetry(options, maxRetries = 3) {
        let lastError = null;
        const startTime = Date.now();
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Check email service health before sending
                if (attempt > 1) {
                    await this.checkEmailServiceHealth();
                }
                await this.sendEmail(options);
                // Log successful retry
                if (attempt > 1) {
                    logger_1.logger.info(`Email sent successfully on attempt ${attempt}/${maxRetries}`, {
                        to: options.to,
                        template: options.template,
                        totalTime: Date.now() - startTime
                    });
                }
                return; // Success
            }
            catch (error) {
                lastError = error;
                logger_1.logger.warn(`Email sending attempt ${attempt}/${maxRetries} failed:`, {
                    error: error.message,
                    to: options.to,
                    template: options.template,
                    attempt
                });
                if (attempt < maxRetries) {
                    // Enhanced exponential backoff with jitter
                    const baseDelay = Math.pow(2, attempt) * 1000;
                    const jitter = Math.random() * 0.1 * baseDelay;
                    const delay = Math.min(baseDelay + jitter, 30000); // Max 30s delay
                    logger_1.logger.info(`Retrying email send in ${Math.round(delay)}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        // All attempts failed - enhanced error handling
        const totalTime = Date.now() - startTime;
        logger_1.logger.error(`Failed to send email after ${maxRetries} attempts (${totalTime}ms):`, {
            error: lastError?.message,
            to: options.to,
            template: options.template,
            totalTime
        });
        // Enhanced audit log for failures
        await this.auditService.logAction({
            entityType: 'admin_action',
            entityId: options.to,
            action: 'access_denied',
            userId: null,
            details: {
                emailType: 'failed_notification',
                template: options.template,
                to: options.to,
                subject: options.subject,
                error: lastError?.message,
                attempts: maxRetries,
                totalTime,
                errorStack: lastError?.stack
            },
            severity: 'high',
            category: 'system'
        });
        // Create detailed error for different failure types
        if (lastError?.message.includes('ENOTFOUND') || lastError?.message.includes('ECONNREFUSED')) {
            throw new Error(`Email service connection failed: ${lastError.message}. Check SMTP configuration.`);
        }
        else if (lastError?.message.includes('Invalid login')) {
            throw new Error(`Email authentication failed: Invalid SMTP credentials.`);
        }
        else if (lastError?.message.includes('timeout')) {
            throw new Error(`Email service timeout: ${lastError.message}. Service may be overloaded.`);
        }
        else {
            throw lastError || new Error('Failed to send email after retries');
        }
    }
    /**
     * Check email service health
     */
    async checkEmailServiceHealth() {
        try {
            if (config_1.emailConfig.user && config_1.emailConfig.host) {
                await this.transporter.verify();
            }
        }
        catch (error) {
            logger_1.logger.warn('Email service health check failed:', error);
            throw new Error(`Email service health check failed: ${error.message}`);
        }
    }
    /**
     * Validate email configuration
     */
    validateEmailConfig() {
        const errors = [];
        if (!config_1.emailConfig.host) {
            errors.push('SMTP host is not configured');
        }
        if (!config_1.emailConfig.port || config_1.emailConfig.port < 1 || config_1.emailConfig.port > 65535) {
            errors.push('SMTP port is invalid or not configured');
        }
        if (!config_1.emailConfig.from) {
            errors.push('From email address is not configured');
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (config_1.emailConfig.from && !emailRegex.test(config_1.emailConfig.from)) {
            errors.push('From email address has invalid format');
        }
        if (config_1.emailConfig.supportEmail && !emailRegex.test(config_1.emailConfig.supportEmail)) {
            errors.push('Support email address has invalid format');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    /**
     * Get email service status and configuration
     */
    async getEmailServiceStatus() {
        const validation = this.validateEmailConfig();
        const status = {
            status: 'unhealthy',
            config: {
                host: config_1.emailConfig.host,
                port: config_1.emailConfig.port,
                from: config_1.emailConfig.from,
                supportEmail: config_1.emailConfig.supportEmail,
                hasAuth: !!(config_1.emailConfig.user && config_1.emailConfig.pass)
            },
            validation
        };
        if (!validation.isValid) {
            return status;
        }
        try {
            if (config_1.emailConfig.user && config_1.emailConfig.host) {
                await this.transporter.verify();
                status.status = 'unhealthy';
                return { ...status, connectionTest: true };
            }
            else {
                status.status = 'unhealthy'; // Config valid but no auth
                return { ...status, connectionTest: false };
            }
        }
        catch (error) {
            logger_1.logger.warn('Email service connection test failed:', error);
            return { ...status, connectionTest: false };
        }
    }
    /**
     * Envoyer un email de consentement parental
     */
    async sendParentalConsentEmail(parentEmail, parentName, childName, verificationUrl, consentTypes, step = 'first') {
        const template = step === 'first' ? 'parental-consent-first' : 'parental-consent-second';
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + config_1.gdprConfig.consentTokenExpiryHours);
        await this.sendEmailWithRetry({
            to: parentEmail,
            subject: `Consentement parental RevEd Kids - ${step === 'first' ? 'Étape 1/2' : 'Confirmation finale'}`,
            template,
            variables: {
                parentName,
                childName,
                verificationUrl,
                consentTypes: consentTypes.join(', '),
                expiryDate: expiryDate.toLocaleDateString('fr-FR')
            }
        });
    }
    /**
     * Envoyer un email de vérification RGPD
     */
    async sendGDPRVerificationEmail(requesterEmail, requesterName, requestType, requestId, verificationUrl) {
        await this.sendEmailWithRetry({
            to: requesterEmail,
            subject: `Vérification demande RGPD - ${requestId}`,
            template: 'gdpr-verification',
            variables: {
                requesterName,
                requestType,
                requestId,
                verificationUrl,
                expiryTime: '24 heures'
            }
        });
    }
    /**
     * Envoyer un email de confirmation RGPD
     */
    async sendGDPRConfirmationEmail(requesterEmail, requesterName, requestType, requestId, priority, dueDate) {
        await this.sendEmailWithRetry({
            to: requesterEmail,
            subject: `Confirmation demande RGPD - ${requestId}`,
            template: 'gdpr-confirmation',
            variables: {
                requesterName,
                requestType,
                requestId,
                priority,
                dueDate: dueDate.toLocaleDateString('fr-FR')
            }
        });
    }
    /**
     * Test de l'envoi d'email (pour la configuration)
     */
    async sendTestEmail(toEmail) {
        try {
            await this.sendEmail({
                to: toEmail,
                subject: 'Test RevEd Kids - Configuration Email',
                template: 'test',
                variables: {
                    timestamp: new Date().toISOString(),
                    environment: config_1.config.NODE_ENV,
                    version: '1.0.0'
                }
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Test email failed:', error);
            return false;
        }
    }
    // =================================
    // USER REGISTRATION EMAIL METHODS
    // =================================
    /**
     * Send welcome email after user registration
     */
    async sendUserRegistrationWelcome(userEmail, userName, username, loginUrl = 'http://localhost:3000/login') {
        await this.sendEmailWithRetry({
            to: userEmail,
            subject: 'Bienvenue sur RevEd Kids - Votre compte a été créé !',
            template: 'user-registration-welcome',
            variables: {
                userName,
                username,
                email: userEmail,
                createdAt: new Date().toLocaleDateString('fr-FR'),
                loginUrl
            }
        });
    }
    /**
     * Send email verification for new user registration
     */
    async sendUserRegistrationVerification(userEmail, userName, verificationUrl, expiryHours = 24) {
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + expiryHours);
        await this.sendEmailWithRetry({
            to: userEmail,
            subject: 'Vérifiez votre compte RevEd Kids',
            template: 'user-registration-verification',
            variables: {
                userName,
                verificationUrl,
                expiryDate: expiryDate.toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            }
        });
    }
    // =================================
    // PASSWORD RESET EMAIL METHODS
    // =================================
    /**
     * Send password reset request email
     */
    async sendPasswordResetRequest(userEmail, userName, resetUrl, ipAddress = 'Unknown', userAgent = 'Unknown', expiryTime = '1 heure') {
        await this.sendEmailWithRetry({
            to: userEmail,
            subject: 'Réinitialisation de votre mot de passe RevEd Kids',
            template: 'password-reset-request',
            variables: {
                userName,
                resetUrl,
                requestDate: new Date().toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                ipAddress,
                userAgent: userAgent.substring(0, 100), // Truncate long user agents
                expiryTime
            }
        });
    }
    /**
     * Send password reset confirmation email
     */
    async sendPasswordResetConfirmation(userEmail, userName, ipAddress = 'Unknown', loginUrl = 'http://localhost:3000/login') {
        await this.sendEmailWithRetry({
            to: userEmail,
            subject: 'Mot de passe modifié avec succès - RevEd Kids',
            template: 'password-reset-confirmation',
            variables: {
                userName,
                resetDate: new Date().toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                ipAddress,
                loginUrl
            }
        });
    }
    // =================================
    // NOTIFICATION EMAIL METHODS
    // =================================
    /**
     * Send student progress report to parents
     */
    async sendStudentProgressReport(parentEmail, parentName, studentName, progressData, dashboardUrl = 'http://localhost:3000/dashboard') {
        await this.sendEmailWithRetry({
            to: parentEmail,
            subject: `Rapport de progression hebdomadaire - ${studentName}`,
            template: 'student-progress-report',
            variables: {
                parentName,
                studentName,
                exercisesCompleted: progressData.exercisesCompleted,
                studyTime: progressData.studyTime,
                averageScore: progressData.averageScore,
                subjects: progressData.subjects.join(', '),
                dashboardUrl
            }
        });
    }
    /**
     * Send achievement notification to student
     */
    async sendAchievementNotification(studentEmail, studentName, achievement, achievementsUrl = 'http://localhost:3000/achievements') {
        await this.sendEmailWithRetry({
            to: studentEmail,
            subject: `🏆 Nouveau succès débloqué - ${achievement.title}`,
            template: 'achievement-notification',
            variables: {
                studentName,
                achievementTitle: achievement.title,
                achievementDescription: achievement.description,
                achievementsUrl
            }
        });
    }
    /**
     * Send system maintenance notification
     */
    async sendMaintenanceNotification(userEmail, maintenanceInfo) {
        await this.sendEmailWithRetry({
            to: userEmail,
            subject: '⚠️ Maintenance programmée - RevEd Kids',
            template: 'system-maintenance',
            variables: {
                maintenanceDate: maintenanceInfo.date,
                maintenanceTime: maintenanceInfo.time,
                duration: maintenanceInfo.duration,
                purpose: maintenanceInfo.purpose
            }
        });
    }
    /**
     * Send security alert notification
     */
    async sendSecurityAlert(userEmail, userName, alertInfo, securityUrl = 'http://localhost:3000/security') {
        await this.sendEmailWithRetry({
            to: userEmail,
            subject: '🔒 Alerte de sécurité - RevEd Kids',
            template: 'security-alert',
            variables: {
                userName,
                alertType: alertInfo.type,
                alertDate: new Date().toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                location: alertInfo.location,
                device: alertInfo.device,
                securityUrl
            }
        });
    }
    // =================================
    // BULK EMAIL METHODS
    // =================================
    /**
     * Send emails to multiple recipients with rate limiting
     */
    async sendBulkEmails(emails, batchSize = 10, delayBetweenBatches = 1000) {
        const results = {
            sent: 0,
            failed: 0,
            errors: []
        };
        // Process emails in batches to avoid overwhelming SMTP server
        for (let i = 0; i < emails.length; i += batchSize) {
            const batch = emails.slice(i, i + batchSize);
            const batchPromises = batch.map(async (emailData) => {
                try {
                    await this.sendEmailWithRetry({
                        to: emailData.to,
                        subject: emailData.subject,
                        template: emailData.template,
                        variables: emailData.variables
                    });
                    results.sent++;
                }
                catch (error) {
                    results.failed++;
                    results.errors.push({
                        email: emailData.to,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                    logger_1.logger.error(`Failed to send bulk email to ${emailData.to}:`, error);
                }
            });
            await Promise.allSettled(batchPromises);
            // Delay between batches if there are more emails to process
            if (i + batchSize < emails.length) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
        }
        logger_1.logger.info(`Bulk email completed: ${results.sent} sent, ${results.failed} failed`);
        return results;
    }
    // =================================
    // TEMPLATE VALIDATION AND HELPERS
    // =================================
    /**
     * Get list of available email templates
     */
    getAvailableTemplates() {
        return [
            'user-registration-welcome',
            'user-registration-verification',
            'password-reset-request',
            'password-reset-confirmation',
            'student-progress-report',
            'achievement-notification',
            'system-maintenance',
            'security-alert',
            'parental-consent-first',
            'parental-consent-second',
            'student-account-created',
            'gdpr-verification',
            'gdpr-confirmation',
            'test',
            'retention-warning'
        ];
    }
    /**
     * Validate template variables
     */
    validateTemplateVariables(template, variables) {
        const requiredVars = {
            'user-registration-welcome': ['userName', 'username', 'email', 'createdAt', 'loginUrl'],
            'user-registration-verification': ['userName', 'verificationUrl', 'expiryDate'],
            'password-reset-request': ['userName', 'resetUrl', 'requestDate', 'ipAddress', 'userAgent', 'expiryTime'],
            'password-reset-confirmation': ['userName', 'resetDate', 'ipAddress', 'loginUrl'],
            'student-progress-report': ['parentName', 'studentName', 'exercisesCompleted', 'studyTime', 'averageScore', 'subjects', 'dashboardUrl'],
            'achievement-notification': ['studentName', 'achievementTitle', 'achievementDescription', 'achievementsUrl'],
            'system-maintenance': ['maintenanceDate', 'maintenanceTime', 'duration', 'purpose'],
            'security-alert': ['userName', 'alertType', 'alertDate', 'location', 'device', 'securityUrl'],
            'retention-warning': ['entityId', 'entityType', 'policyName', 'action', 'retentionPeriod', 'actionDate', 'warningDays']
        };
        const required = requiredVars[template] || [];
        const provided = Object.keys(variables);
        const missingVars = required.filter(varName => !provided.includes(varName));
        return {
            isValid: missingVars.length === 0,
            missingVars
        };
    }
    /**
     * Send data retention warning notification
     */
    async sendRetentionWarning(entity, policy) {
        // For student data, send notification to admin/compliance team
        const notificationEmail = config_1.emailConfig.supportEmail || 'admin@revedkids.com';
        const actionDate = new Date();
        actionDate.setDate(actionDate.getDate() + policy.notificationDays);
        await this.sendEmailWithRetry({
            to: notificationEmail,
            subject: `Alerte de rétention de données - Action requise`,
            template: 'retention-warning',
            variables: {
                entityId: entity.id,
                entityType: entity.type,
                policyName: policy.policyName,
                action: policy.action,
                retentionPeriod: policy.retentionPeriodDays,
                actionDate: actionDate.toLocaleDateString('fr-FR'),
                warningDays: policy.notificationDays
            }
        });
    }
}
exports.EmailService = EmailService;
