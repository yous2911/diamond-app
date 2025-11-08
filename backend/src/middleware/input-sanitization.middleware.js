"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputSanitizationService = void 0;
const dompurify_1 = __importDefault(require("dompurify"));
const jsdom_1 = require("jsdom");
const validator_1 = __importDefault(require("validator"));
const xss_1 = __importDefault(require("xss"));
const logger_1 = require("../utils/logger");
// Initialize DOMPurify for server-side HTML sanitization
const window = new jsdom_1.JSDOM('').window;
const purify = (0, dompurify_1.default)(window);
// XSS filtering options
const xssOptions = {
    allowList: {
        a: ['href', 'title'],
        b: [],
        i: [],
        em: [],
        strong: [],
        p: [],
        br: [],
        span: ['class'],
        div: ['class'],
        h1: [], h2: [], h3: [], h4: [], h5: [], h6: [],
        ul: [], ol: [], li: [],
        blockquote: [],
        code: [],
        pre: []
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
    css: false // Disable CSS to prevent style-based attacks
};
class InputSanitizationService {
    constructor(options = {}) {
        this.options = {
            skipRoutes: [],
            skipMethods: ['GET', 'HEAD', 'OPTIONS'],
            allowHtml: false,
            maxLength: {
                string: 1000,
                email: 254,
                url: 2048,
                text: 10000
            },
            ...options
        };
    }
    /**
     * Main sanitization middleware
     */
    async sanitizationMiddleware(request, reply) {
        const sanitizedReq = request;
        sanitizedReq.sanitizationWarnings = [];
        try {
            // Skip if route is in skip list
            if (this.shouldSkipSanitization(request)) {
                return;
            }
            // Sanitize request body
            if (request.body) {
                sanitizedReq.sanitizedBody = await this.sanitizeObject(request.body, 'body', sanitizedReq.sanitizationWarnings);
            }
            // Sanitize query parameters
            if (request.query) {
                sanitizedReq.sanitizedQuery = await this.sanitizeObject(request.query, 'query', sanitizedReq.sanitizationWarnings);
            }
            // Sanitize route parameters
            if (request.params) {
                sanitizedReq.sanitizedParams = await this.sanitizeObject(request.params, 'params', sanitizedReq.sanitizationWarnings);
            }
            // Log warnings if any
            if (sanitizedReq.sanitizationWarnings.length > 0) {
                logger_1.logger.warn('Input sanitization warnings', {
                    route: request.routeOptions?.url || request.url,
                    method: request.method,
                    warnings: sanitizedReq.sanitizationWarnings,
                    userAgent: request.headers['user-agent'],
                    ip: request.ip
                });
            }
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger_1.logger.error('Input sanitization error:', err);
            // Log security incident
            logger_1.logger.warn('Potential security threat detected', {
                route: request.routeOptions?.url || request.url,
                method: request.method,
                userAgent: request.headers['user-agent'],
                ip: request.ip,
                error: err.message
            });
            return reply.status(400).send({
                error: 'Invalid input data',
                message: 'Request contains potentially harmful content'
            });
        }
    }
    /**
     * Check if sanitization should be skipped for this request
     */
    shouldSkipSanitization(request) {
        const route = request.routeOptions?.url || request.url;
        const method = request.method;
        // Skip certain methods
        if (this.options.skipMethods?.includes(method)) {
            return true;
        }
        // Skip certain routes
        if (this.options.skipRoutes?.some(skipRoute => route.includes(skipRoute))) {
            return true;
        }
        // Skip file upload routes
        if (route.includes('/upload') || route.includes('/files/')) {
            return true; // Always skip for upload routes
        }
        return false;
    }
    /**
     * Recursively sanitize an object
     */
    async sanitizeObject(obj, context, warnings, visited = new WeakSet()) {
        if (obj === null || obj === undefined) {
            return obj;
        }
        if (typeof obj === 'string') {
            return this.sanitizeString(obj, context, warnings);
        }
        if (typeof obj === 'number' || typeof obj === 'boolean') {
            return obj;
        }
        // Prevent infinite recursion with circular references
        if (typeof obj === 'object' && visited.has(obj)) {
            warnings.push(`Circular reference detected at ${context}`);
            return '[Circular Reference]';
        }
        if (Array.isArray(obj)) {
            visited.add(obj);
            const result = await Promise.all(obj.map((item, index) => this.sanitizeObject(item, `${context}[${index}]`, warnings, visited)));
            visited.delete(obj);
            return result;
        }
        if (typeof obj === 'object') {
            visited.add(obj);
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                const sanitizedKey = this.sanitizeString(key, `${context}.key`, warnings);
                sanitized[sanitizedKey] = await this.sanitizeObject(value, `${context}.${key}`, warnings, visited);
            }
            visited.delete(obj);
            return sanitized;
        }
        return obj;
    }
    /**
     * Sanitize string values with context-aware rules
     */
    sanitizeString(value, context, warnings) {
        if (!value || typeof value !== 'string') {
            return value;
        }
        let sanitized = value;
        const originalValue = value;
        try {
            // 1. Context-specific validation (do this FIRST for email normalization)
            sanitized = this.applyContextSpecificSanitization(sanitized, context, warnings);
            // 2. Length validation
            const maxLength = this.getMaxLengthForContext(context);
            if (sanitized.length > maxLength) {
                sanitized = sanitized.substring(0, maxLength);
                warnings.push(`Truncated to ${maxLength} characters`);
            }
            // 3. Basic XSS protection
            if (this.containsHtmlOrScript(sanitized)) {
                if (this.options.allowHtml && this.isHtmlContext(context)) {
                    sanitized = purify.sanitize(sanitized, {
                        ALLOWED_TAGS: Object.keys(xssOptions.allowList),
                        ALLOWED_ATTR: this.getAllowedAttributes()
                    });
                }
                else {
                    sanitized = (0, xss_1.default)(sanitized, xssOptions);
                }
                if (sanitized !== originalValue) {
                    warnings.push('HTML/Script content sanitized');
                }
            }
            // 4. SQL injection protection
            if (this.containsSqlInjection(sanitized)) {
                sanitized = this.sanitizeSqlInjection(sanitized);
                warnings.push('SQL injection patterns removed');
            }
            // 5. NoSQL injection protection
            if (this.containsNoSqlInjection(sanitized)) {
                sanitized = this.sanitizeNoSqlInjection(sanitized);
                warnings.push('NoSQL injection patterns removed');
            }
            // 6. Command injection protection
            if (this.containsCommandInjection(sanitized)) {
                sanitized = this.sanitizeCommandInjection(sanitized);
                warnings.push('command injection patterns removed');
            }
            // 7. Path traversal protection
            if (this.containsPathTraversal(sanitized)) {
                sanitized = this.sanitizePathTraversal(sanitized);
                warnings.push('Path traversal patterns removed');
            }
            // 8. Custom sanitizers
            if (this.options.customSanitizers) {
                for (const [pattern, sanitizer] of Object.entries(this.options.customSanitizers)) {
                    if (context.includes(pattern)) {
                        sanitized = sanitizer(sanitized);
                    }
                }
            }
            // 9. Final validation
            sanitized = this.finalValidation(sanitized, context, warnings);
        }
        catch (error) {
            logger_1.logger.error('String sanitization error:', { error, context, value: originalValue });
            warnings.push(`${context}: Sanitization error occurred`);
            // Return empty string as fallback for security
            return '';
        }
        return sanitized;
    }
    /**
     * Get maximum length based on context
     */
    getMaxLengthForContext(context) {
        if (context.toLowerCase().includes('email')) {
            return this.options.maxLength.email;
        }
        if (context.toLowerCase().includes('url') || context.toLowerCase().includes('link')) {
            return this.options.maxLength.url;
        }
        if (context.toLowerCase().includes('text') || context.toLowerCase().includes('description')) {
            return this.options.maxLength.text;
        }
        return this.options.maxLength.string;
    }
    /**
     * Check if content contains HTML or script tags
     */
    containsHtmlOrScript(value) {
        const htmlRegex = /<[^>]*>/;
        const scriptRegex = /<script[^>]*>.*?<\/script>/gi;
        const eventRegex = /on\w+\s*=/i;
        const jsRegex = /javascript:/i;
        return htmlRegex.test(value) ||
            scriptRegex.test(value) ||
            eventRegex.test(value) ||
            jsRegex.test(value);
    }
    /**
     * Check if context allows HTML
     */
    isHtmlContext(context) {
        const htmlContexts = ['description', 'content', 'message', 'html'];
        return htmlContexts.some(ctx => context.toLowerCase().includes(ctx));
    }
    /**
     * Get allowed HTML attributes
     */
    getAllowedAttributes() {
        return Object.values(xssOptions.allowList).flat();
    }
    /**
     * Check for SQL injection patterns
     */
    containsSqlInjection(value) {
        const sqlPatterns = [
            /(\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bunion\b|\balter\b)/i,
            /(\bor\b|\band\b)\s+[\w\s]*\s*=\s*[\w\s]*/i,
            /(\bor\b|\band\b)\s+\d+\s*=\s*\d+/i,
            /'[^']*'(\s*;\s*|\s+or\s+|\s+and\s+)/i,
            /(\bexec\b|\bexecute\b)\s*\(/i,
            /\bconcat\s*\(/i,
            /\bchar\s*\(/i,
            /0x[0-9a-f]+/i,
            /\bdeclare\s+@/i,
            /\bcast\s*\(/i
        ];
        return sqlPatterns.some(pattern => pattern.test(value));
    }
    /**
     * Sanitize SQL injection patterns
     */
    sanitizeSqlInjection(value) {
        // Remove common SQL injection patterns
        return value
            .replace(/(\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bunion\b|\balter\b)/gi, '')
            .replace(/(\bor\b|\band\b)\s+[\w\s]*\s*=\s*[\w\s]*/gi, '')
            .replace(/(\bor\b|\band\b)\s+\d+\s*=\s*\d+/gi, '')
            .replace(/'[^']*'(\s*;\s*|\s+or\s+|\s+and\s+)/gi, '')
            .replace(/(\bexec\b|\bexecute\b)\s*\(/gi, '')
            .replace(/\bconcat\s*\(/gi, '')
            .replace(/\bchar\s*\(/gi, '')
            .replace(/0x[0-9a-f]+/gi, '')
            .replace(/\bdeclare\s+@/gi, '')
            .replace(/\bcast\s*\(/gi, '');
    }
    /**
     * Check for NoSQL injection patterns
     */
    containsNoSqlInjection(value) {
        const noSqlPatterns = [
            /\$where\s*:/i,
            /\$regex\s*:/i,
            /\$ne\s*:/i,
            /\$gt\s*:/i,
            /\$lt\s*:/i,
            /\$in\s*:/i,
            /\$nin\s*:/i,
            /\$exists\s*:/i,
            /\$or\s*:/i,
            /\$and\s*:/i,
            /\$not\s*:/i,
            /\$nor\s*:/i,
            /\$all\s*:/i,
            /\$elemMatch\s*:/i,
            // Also check for JSON format patterns
            /\$where/i,
            /\$regex/i,
            /\$ne/i,
            /\$gt/i,
            /\$lt/i,
            /\$in/i,
            /\$nin/i
        ];
        return noSqlPatterns.some(pattern => pattern.test(value));
    }
    /**
     * Sanitize NoSQL injection patterns
     */
    sanitizeNoSqlInjection(value) {
        return value
            .replace(/\$where\s*:/gi, '')
            .replace(/\$regex\s*:/gi, '')
            .replace(/\$ne\s*:/gi, '')
            .replace(/\$gt\s*:/gi, '')
            .replace(/\$lt\s*:/gi, '')
            .replace(/\$in\s*:/gi, '')
            .replace(/\$nin\s*:/gi, '')
            .replace(/\$exists\s*:/gi, '')
            .replace(/\$or\s*:/gi, '')
            .replace(/\$and\s*:/gi, '')
            .replace(/\$not\s*:/gi, '')
            .replace(/\$nor\s*:/gi, '')
            .replace(/\$all\s*:/gi, '')
            .replace(/\$elemMatch\s*:/gi, '')
            // Also handle JSON format patterns
            .replace(/\$where/gi, '')
            .replace(/\$regex/gi, '')
            .replace(/\$ne/gi, '')
            .replace(/\$gt/gi, '')
            .replace(/\$lt/gi, '')
            .replace(/\$in/gi, '')
            .replace(/\$nin/gi, '');
    }
    /**
     * Check for command injection patterns
     */
    containsCommandInjection(value) {
        const cmdPatterns = [
            /(\||&|;|`|\$\(|\$\{)/,
            /(\bcat\b|\bls\b|\bps\b|\bwhoami\b|\bpwd\b|\becho\b)/i,
            /(\brm\b|\bmv\b|\bcp\b|\bchmod\b|\bchown\b)/i,
            /(\bcurl\b|\bwget\b|\bnc\b|\bnetcat\b)/i,
            /(\beval\b|\bexec\b|\bsystem\b|\bshell_exec\b)/i,
            /(\bpassthru\b|\bpopen\b|\bproc_open\b)/i
        ];
        return cmdPatterns.some(pattern => pattern.test(value));
    }
    /**
     * Sanitize command injection patterns
     */
    sanitizeCommandInjection(value) {
        return value
            .replace(/(\||&|;|`|\$\(|\$\{)/g, '')
            .replace(/(\bcat\b|\bls\b|\bps\b|\bwhoami\b|\bpwd\b|\becho\b)/gi, '')
            .replace(/(\brm\b|\bmv\b|\bcp\b|\bchmod\b|\bchown\b)/gi, '')
            .replace(/(\bcurl\b|\bwget\b|\bnc\b|\bnetcat\b)/gi, '')
            .replace(/(\beval\b|\bexec\b|\bsystem\b|\bshell_exec\b)/gi, '')
            .replace(/(\bpassthru\b|\bpopen\b|\bproc_open\b)/gi, '');
    }
    /**
     * Check for path traversal patterns
     */
    containsPathTraversal(value) {
        const pathPatterns = [
            /\.\.[\/\\]/,
            /[\/\\]\.\.[\/\\]/,
            /%2e%2e[\/\\]/i,
            /%252e%252e/i,
            /\.\.\x2f/,
            /\.\.\x5c/,
            // Handle the specific test cases
            /\.\.\//,
            /%2e%2e/i
        ];
        return pathPatterns.some(pattern => pattern.test(value));
    }
    /**
     * Sanitize path traversal patterns
     */
    sanitizePathTraversal(value) {
        return value
            .replace(/\.\.[/\\]/g, '')
            .replace(/[/\\]\.\.[/\\]/g, '')
            .replace(/%2e%2e[/\\]/gi, '')
            .replace(/%252e%252e/gi, '')
            .replace(/\.\.\x2f/g, '')
            .replace(/\.\.\x5c/g, '')
            // Handle the specific test cases
            .replace(/\.\.\//g, '')
            .replace(/%2e%2e/gi, '');
    }
    /**
     * Apply context-specific sanitization
     */
    applyContextSpecificSanitization(value, context, warnings) {
        const lowerContext = context.toLowerCase();
        // Email validation
        if (lowerContext.includes('email')) {
            if (!validator_1.default.isEmail(value)) {
                warnings.push('Invalid email format');
                // Return sanitized version if possible
                const emailParts = value.split('@');
                if (emailParts.length === 2) {
                    return `${validator_1.default.escape(emailParts[0])}@${validator_1.default.escape(emailParts[1])}`;
                }
                return '';
            }
            // Force lowercase for email normalization
            return (validator_1.default.normalizeEmail(value) || value).toLowerCase();
        }
        // URL validation
        if (lowerContext.includes('url') || lowerContext.includes('link')) {
            if (value && !validator_1.default.isURL(value, { protocols: ['http', 'https'] })) {
                warnings.push('Invalid URL format');
                return '';
            }
            return value;
        }
        // Phone number validation
        if (lowerContext.includes('phone') || lowerContext.includes('tel')) {
            // Clean phone number but preserve format
            return value
                .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                .replace(/\s*ext\.?\s*/i, ' ') // Replace "ext." with space
                .trim();
        }
        // ID validation (numeric only)
        if (lowerContext.includes('id') && lowerContext !== 'studentId') {
            if (!validator_1.default.isAlphanumeric(value)) {
                return value.replace(/[^a-zA-Z0-9\-_]/g, '');
            }
        }
        // Name validation (letters, spaces, hyphens only)
        if (lowerContext.includes('name') || lowerContext.includes('nom') || lowerContext.includes('prenom')) {
            return value.replace(/[^a-zA-ZÀ-ÿ\s\-']/g, '');
        }
        return value;
    }
    /**
     * Final validation step
     */
    finalValidation(value, context, warnings) {
        // Remove null bytes
        if (value.includes('\0')) {
            value = value.replace(/\0/g, '');
            warnings.push(`${context}: Null bytes removed`);
        }
        // Remove control characters except newlines and tabs
        const controlCharsRegex = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
        if (controlCharsRegex.test(value)) {
            value = value.replace(controlCharsRegex, '');
            warnings.push(`${context}: Control characters removed`);
        }
        // Normalize Unicode
        value = value.normalize('NFC');
        // Trim whitespace
        value = value.trim();
        return value;
    }
    /**
     * Get sanitized values from request
     */
    static getSanitizedData(request) {
        const sanitizedReq = request;
        return {
            body: sanitizedReq.sanitizedBody || request.body,
            query: sanitizedReq.sanitizedQuery || request.query,
            params: sanitizedReq.sanitizedParams || request.params
        };
    }
    /**
     * Check if request has sanitization warnings
     */
    static hasWarnings(request) {
        const sanitizedReq = request;
        return (sanitizedReq.sanitizationWarnings?.length || 0) > 0;
    }
    /**
     * Get sanitization warnings
     */
    static getWarnings(request) {
        const sanitizedReq = request;
        return sanitizedReq.sanitizationWarnings || [];
    }
}
exports.InputSanitizationService = InputSanitizationService;
