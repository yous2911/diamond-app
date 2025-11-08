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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
const file_upload_service_1 = require("../services/file-upload.service");
const image_processing_service_1 = require("../services/image-processing.service");
const storage_service_1 = require("../services/storage.service");
const file_security_service_1 = require("../services/file-security.service");
const fileUploadPlugin = async (fastify, options) => {
    const { uploadPath = 'uploads', maxFileSize = 10 * 1024 * 1024, // 10MB
    enableImageProcessing = true, enableVirusScanning = true, thumbnailSizes = [
        { name: 'small', width: 150, height: 150, fit: 'cover', format: 'webp', quality: 80 },
        { name: 'medium', width: 300, height: 300, fit: 'cover', format: 'webp', quality: 85 },
        { name: 'large', width: 600, height: 600, fit: 'contain', format: 'webp', quality: 90 }
    ] } = options;
    try {
        // Initialize upload directory
        const fullUploadPath = path_1.default.resolve(process.cwd(), uploadPath);
        await fs_extra_1.default.ensureDir(fullUploadPath);
        // Create category directories
        const categories = ['image', 'video', 'audio', 'document', 'exercise', 'curriculum', 'assessment', 'resource'];
        for (const category of categories) {
            await fs_extra_1.default.ensureDir(path_1.default.join(fullUploadPath, category));
        }
        // Initialize services with configuration
        const uploadConfig = {
            maxFileSize,
            uploadPath: fullUploadPath,
            enableImageProcessing,
            enableVirusScanning,
            thumbnailSizes
        };
        const uploadService = new file_upload_service_1.FileUploadService(uploadConfig);
        const imageProcessor = new image_processing_service_1.ImageProcessingService();
        const storageService = new storage_service_1.StorageService();
        const securityService = new file_security_service_1.FileSecurityService({
            enableVirusScanning,
            enableContentAnalysis: true,
            enableMetadataScanning: true,
            quarantineThreats: true,
            maxScanTimeMs: 30000
        });
        // Register services as decorators
        fastify.decorate('uploadService', uploadService);
        fastify.decorate('imageProcessor', imageProcessor);
        fastify.decorate('storageService', storageService);
        fastify.decorate('securityService', securityService);
        fastify.decorate('fs', fs_extra_1.default);
        // Add middleware for file serving
        fastify.register(Promise.resolve().then(() => __importStar(require('@fastify/static'))), {
            root: fullUploadPath,
            prefix: '/uploads/',
            decorateReply: false,
            schemaHide: true,
            setHeaders: (res, path) => {
                // Set security headers for uploaded files
                res.setHeader('X-Content-Type-Options', 'nosniff');
                res.setHeader('X-Frame-Options', 'DENY');
                res.setHeader('Content-Security-Policy', "default-src 'none'");
                // Set cache headers
                if (path.includes('/thumbnails/')) {
                    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year for thumbnails
                }
                else {
                    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day for originals
                }
            }
        });
        // Register upload routes
        await fastify.register(Promise.resolve().then(() => __importStar(require('../routes/upload'))), { prefix: '/api' });
        // Add cleanup job (commented out until cron plugin is available)
        // if (fastify.cron) {
        //   // Daily cleanup job at 2 AM
        //   fastify.cron.createJob({
        //     cronTime: '0 2 * * *',
        //     onTick: async () => {
        //       try {
        //         logger.info('Starting scheduled file cleanup');
        //         const cleanedFiles = await storageService.cleanupExpiredFiles(30);
        //         const cleanedOrphans = await storageService.cleanupOrphanedFiles();
        //         logger.info('Scheduled cleanup completed', { 
        //           cleanedFiles, 
        //           cleanedOrphans 
        //         });
        //       } catch (error) {
        //         logger.error('Scheduled cleanup failed:', error);
        //       }
        //     },
        //     start: true
        //   });
        // }
        // Add health check endpoint
        fastify.get('/api/upload/health', {
            schema: {
                description: 'File upload system health check',
                tags: ['Upload', 'Health'],
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            status: { type: 'string' },
                            uploadPath: { type: 'string' },
                            storageHealth: { type: 'object' },
                            services: {
                                type: 'object',
                                properties: {
                                    upload: { type: 'boolean' },
                                    imageProcessing: { type: 'boolean' },
                                    storage: { type: 'boolean' },
                                    security: { type: 'boolean' }
                                }
                            }
                        }
                    }
                }
            },
            handler: async (request, reply) => {
                try {
                    const storageHealth = await storageService.getStorageHealth();
                    return reply.send({
                        status: 'healthy',
                        uploadPath: fullUploadPath,
                        storageHealth,
                        services: {
                            upload: true,
                            imageProcessing: true,
                            storage: true,
                            security: true
                        },
                        timestamp: new Date().toISOString()
                    });
                }
                catch (error) {
                    const err = error instanceof Error ? error : new Error(String(error));
                    logger_1.logger.error('Upload health check failed:', err);
                    return reply.status(500).send({
                        status: 'unhealthy',
                        error: err.message,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        });
        // Add storage optimization endpoint (admin only)
        fastify.post('/api/upload/optimize', {
            schema: {
                description: 'Optimize storage (admin only)',
                tags: ['Upload', 'Admin'],
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            filesProcessed: { type: 'number' },
                            spaceReclaimed: { type: 'number' }
                        }
                    }
                }
            },
            preHandler: [fastify.authenticateAdmin], // Admin only - storage optimization is sensitive
            handler: async (request, reply) => {
                try {
                    const result = await storageService.optimizeStorage();
                    logger_1.logger.info('Storage optimization completed', result);
                    return reply.send({
                        success: true,
                        ...result
                    });
                }
                catch (error) {
                    const err = error instanceof Error ? error : new Error(String(error));
                    logger_1.logger.error('Storage optimization failed:', err);
                    return reply.status(500).send({
                        success: false,
                        error: err.message
                    });
                }
            }
        });
        logger_1.logger.info('File upload plugin initialized', {
            uploadPath: fullUploadPath,
            maxFileSize,
            enableImageProcessing,
            enableVirusScanning,
            thumbnailSizes: thumbnailSizes.length
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize file upload plugin:', error);
        throw error;
    }
};
exports.default = (0, fastify_plugin_1.default)(fileUploadPlugin, {
    name: 'file-upload',
    dependencies: ['database', 'authentication']
});
