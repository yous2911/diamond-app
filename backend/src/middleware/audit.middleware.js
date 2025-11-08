"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditMiddleware = void 0;
class AuditMiddleware {
    constructor(auditService, options = {}) {
        this.auditService = auditService;
        this.options = {
            excludePaths: ['/api/health', '/docs', '/favicon.ico'],
            excludeMethods: [],
            sensitiveRoutes: ['/api/students', '/api/gdpr', '/api/auth/login'],
            logLevel: 'detailed',
            asyncLogging: true,
            ...options
        };
    }
    /**
     * Middleware principal d'audit pour Fastify
     */
    createMiddleware() {
        return async (request, reply) => {
            try {
                // Vérifier si cette route doit être exclue
                if (this.shouldExcludeRoute(request)) {
                    return;
                }
                // Préparer les données d'audit
                const auditData = this.prepareAuditData(request);
                // Logger de manière asynchrone ou synchrone selon la configuration
                if (this.options.asyncLogging) {
                    // Log asynchrone pour ne pas impacter les performances
                    setImmediate(async () => {
                        try {
                            await this.auditService.logAction(auditData);
                        }
                        catch (error) {
                            console.warn('Async audit logging failed:', error);
                        }
                    });
                }
                else {
                    // Log synchrone pour assurer la trace avant la réponse
                    await this.auditService.logAction(auditData);
                }
            }
            catch (error) {
                // L'audit ne doit jamais faire échouer une requête
                console.warn('Audit middleware error:', error);
            }
        };
    }
    /**
     * Middleware spécialisé pour les routes sensibles
     */
    createSensitiveRouteMiddleware() {
        return async (request, reply) => {
            try {
                const auditData = this.prepareSensitiveAuditData(request);
                // Log synchrone pour les routes sensibles
                await this.auditService.logAction(auditData);
                // Ajouter des headers de sécurité spécifiques
                reply.header('X-Audit-Logged', 'true');
                reply.header('X-Security-Level', 'high');
            }
            catch (error) {
                console.warn('Sensitive route audit failed:', error);
                // Pour les routes sensibles, on peut choisir de rejeter la requête
                if (request.url.includes('/gdpr/') || request.url.includes('/auth/')) {
                    return reply.status(500).send({
                        success: false,
                        error: {
                            message: 'Audit requis pour cette action',
                            code: 'AUDIT_REQUIRED'
                        }
                    });
                }
            }
            return; // Explicit return for all code paths
        };
    }
    /**
     * Middleware pour capturer les réponses d'erreur
     */
    createErrorAuditMiddleware() {
        return async (request, reply, error) => {
            try {
                const auditData = {
                    entityType: 'user_session',
                    entityId: request.ip || 'unknown',
                    action: 'access_denied',
                    userId: request.user?.studentId?.toString() || null,
                    details: {
                        error: error.message,
                        statusCode: reply.statusCode,
                        method: request.method,
                        url: request.url,
                        userAgent: request.headers['user-agent'] || '',
                        timestamp: new Date().toISOString()
                    },
                    ipAddress: request.ip,
                    userAgent: request.headers['user-agent'] || '',
                    timestamp: new Date(),
                    severity: reply.statusCode >= 500 ? 'high' : 'medium',
                    category: 'security'
                };
                await this.auditService.logAction(auditData);
            }
            catch (auditError) {
                console.warn('Error audit logging failed:', auditError);
            }
            return; // Explicit return for all code paths
        };
    }
    /**
     * Préparer les données d'audit standard
     */
    prepareAuditData(request) {
        const entityType = this.determineEntityType(request);
        const action = this.determineAction(request);
        const severity = this.determineSeverity(request);
        const category = this.determineCategory(request);
        return {
            entityType,
            entityId: this.extractEntityId(request),
            action,
            userId: request.user?.studentId?.toString() || null,
            studentId: this.extractStudentId(request),
            details: this.extractDetails(request),
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'] || '',
            timestamp: new Date(),
            severity,
            category
        };
    }
    /**
     * Préparer les données d'audit pour routes sensibles
     */
    prepareSensitiveAuditData(request) {
        const baseData = this.prepareAuditData(request);
        return {
            ...baseData,
            timestamp: new Date(),
            severity: 'high',
            details: {
                ...baseData.details,
                sensitiveRoute: true,
                timestamp: new Date().toISOString(),
                headers: this.options.logLevel === 'full' ? request.headers : undefined
            }
        };
    }
    /**
     * Déterminer si la route doit être exclue de l'audit
     */
    shouldExcludeRoute(request) {
        // Exclure par chemin
        if (this.options.excludePaths.some(path => request.url.startsWith(path))) {
            return true;
        }
        // Exclure par méthode
        if (this.options.excludeMethods.includes(request.method.toUpperCase())) {
            return true;
        }
        return false;
    }
    /**
     * Déterminer le type d'entité basé sur la route
     */
    determineEntityType(request) {
        const url = request.url.toLowerCase();
        if (url.includes('/students'))
            return 'student';
        if (url.includes('/exercises'))
            return 'exercise';
        if (url.includes('/progress'))
            return 'progress';
        if (url.includes('/gdpr'))
            return 'gdpr_request';
        if (url.includes('/auth'))
            return 'user_session';
        if (url.includes('/consent'))
            return 'parental_consent';
        return 'user_session';
    }
    /**
     * Déterminer l'action basée sur la méthode HTTP
     */
    determineAction(request) {
        switch (request.method.toUpperCase()) {
            case 'GET': return 'read';
            case 'POST': return 'create';
            case 'PUT':
            case 'PATCH': return 'update';
            case 'DELETE': return 'delete';
            default: return 'read';
        }
    }
    /**
     * Déterminer la sévérité basée sur la route et méthode
     */
    determineSeverity(request) {
        const url = request.url.toLowerCase();
        // Routes hautement sensibles
        if (url.includes('/gdpr') || url.includes('/consent') || url.includes('/admin')) {
            return 'high';
        }
        // Actions de modification de données
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method.toUpperCase())) {
            return 'medium';
        }
        return 'low';
    }
    /**
     * Déterminer la catégorie d'audit
     */
    determineCategory(request) {
        const url = request.url.toLowerCase();
        if (url.includes('/auth') || url.includes('/login'))
            return 'user_behavior';
        if (url.includes('/gdpr') || url.includes('/consent'))
            return 'consent_management';
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method.toUpperCase()))
            return 'data_modification';
        if (request.method.toUpperCase() === 'GET')
            return 'data_access';
        return 'system';
    }
    /**
     * Extraire l'ID de l'entité depuis les paramètres
     */
    extractEntityId(request) {
        const params = request.params;
        return params?.id || params?.studentId || request.ip || 'unknown';
    }
    /**
     * Extraire l'ID de l'étudiant
     */
    extractStudentId(request) {
        const params = request.params;
        const user = request.user;
        const studentId = params?.id || params?.studentId || user?.studentId;
        return studentId ? studentId.toString() : undefined;
    }
    /**
     * Extraire les détails selon le niveau de log configuré
     */
    extractDetails(request) {
        const baseDetails = {
            method: request.method,
            url: request.url,
            timestamp: new Date().toISOString()
        };
        switch (this.options.logLevel) {
            case 'minimal':
                return baseDetails;
            case 'detailed':
                return {
                    ...baseDetails,
                    route: request.routeOptions?.url || request.url,
                    params: request.params,
                    query: request.query,
                    userAgent: request.headers['user-agent']
                };
            case 'full':
                return {
                    ...baseDetails,
                    route: request.routeOptions?.url || request.url,
                    params: request.params,
                    query: request.query,
                    headers: request.headers,
                    body: this.sanitizeBody(request.body)
                };
            default:
                return baseDetails;
        }
    }
    /**
     * Nettoyer les données sensibles du body avant l'audit
     */
    sanitizeBody(body) {
        if (!body || typeof body !== 'object')
            return body;
        const sensitiveFields = ['password', 'motDePasse', 'token', 'secret', 'key'];
        const sanitized = { ...body };
        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        }
        return sanitized;
    }
}
exports.AuditMiddleware = AuditMiddleware;
