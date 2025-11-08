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
const zod_1 = require("zod");
const config_1 = require("../config/config");
const file_upload_service_1 = require("../services/file-upload.service");
const image_processing_service_1 = require("../services/image-processing.service");
const storage_service_1 = require("../services/storage.service");
const file_validation_service_1 = require("../services/file-validation.service");
const upload_types_1 = require("../types/upload.types");
const logger_1 = require("../utils/logger");
// Validation schemas
const uploadParamsSchema = zod_1.z.object({
    category: zod_1.z.enum(['image', 'video', 'audio', 'document', 'exercise', 'curriculum', 'assessment', 'resource']).optional(),
    generateThumbnails: zod_1.z.boolean().optional(),
    isPublic: zod_1.z.boolean().optional(),
    compressionLevel: zod_1.z.number().min(0).max(100).optional()
});
const educationalMetadataSchema = zod_1.z.object({
    subject: zod_1.z.string().optional(),
    gradeLevel: zod_1.z.array(zod_1.z.string()).optional(),
    difficulty: zod_1.z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    description: zod_1.z.string().max(500).optional(),
    learningObjectives: zod_1.z.array(zod_1.z.string()).optional(),
    accessibilityFeatures: zod_1.z.array(zod_1.z.string()).optional()
});
const fileIdSchema = zod_1.z.object({
    fileId: zod_1.z.string().uuid()
});
const downloadQuerySchema = zod_1.z.object({
    variant: zod_1.z.enum(['original', 'thumbnail', 'small', 'medium', 'large']).default('original'),
});
const listFilesQuerySchema = zod_1.z.object({
    category: zod_1.z.enum(['image', 'video', 'audio', 'document', 'exercise', 'curriculum', 'assessment', 'resource']).optional(),
    limit: zod_1.z.number().min(1).max(100).default(20),
    offset: zod_1.z.number().min(0).default(0),
    includePublic: zod_1.z.boolean().default(false),
});
const processImageBodySchema = zod_1.z.object({
    operation: zod_1.z.enum(['resize', 'compress', 'convert', 'watermark']),
    options: zod_1.z.object({
        width: zod_1.z.number().optional(),
        height: zod_1.z.number().optional(),
        quality: zod_1.z.number().min(1).max(100).optional(),
        format: zod_1.z.enum(['jpeg', 'png', 'webp', 'avif']).optional(),
        watermarkText: zod_1.z.string().optional(),
        watermarkPosition: zod_1.z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center']).optional(),
    }).optional(),
});
const uploadRoutes = async (fastify) => {
    const uploadService = new file_upload_service_1.FileUploadService();
    const imageProcessor = new image_processing_service_1.ImageProcessingService();
    const storageService = new storage_service_1.StorageService();
    // Import enhanced path security
    const { pathSecurity } = await Promise.resolve().then(() => __importStar(require('../security/path-security.service')));
    /**
     * Enhanced secure path validation helper
     */
    const getValidatedFilePath = async (fileId, filename, userId) => {
        // Use comprehensive path security validation
        const validation = pathSecurity.validatePath(filename, config_1.config.upload?.path);
        if (!validation.isValid) {
            logger_1.logger.warn('Path security validation failed', {
                userId,
                fileId,
                filename,
                errors: validation.errors,
                securityViolations: validation.securityViolations
            });
            return null;
        }
        // Additional file existence and access check
        const accessResult = await pathSecurity.safeFileAccess(validation.normalizedPath, 'read');
        if (!accessResult.success) {
            logger_1.logger.warn('File access validation failed', {
                userId,
                fileId,
                path: validation.normalizedPath,
                error: accessResult.error,
                securityViolations: accessResult.securityViolations
            });
            return null;
        }
        return accessResult.path;
    };
    // Register multipart support
    await fastify.register(Promise.resolve().then(() => __importStar(require('@fastify/multipart'))), {
        limits: {
            fieldNameSize: 100,
            fieldSize: 1000,
            fields: 10,
            fileSize: upload_types_1.DEFAULT_UPLOAD_CONFIG.maxFileSize,
            files: upload_types_1.DEFAULT_UPLOAD_CONFIG.maxFilesPerUpload,
            headerPairs: 2000,
            parts: 1000
        },
        attachFieldsToBody: true
    });
    /**
     * Upload files endpoint
     */
    fastify.post('/upload', {
        preValidation: fastify.csrfProtection,
        schema: {
            description: 'Upload files with metadata and processing options',
            tags: ['Upload'],
            consumes: ['multipart/form-data'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        files: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    originalName: { type: 'string' },
                                    filename: { type: 'string' },
                                    url: { type: 'string' },
                                    thumbnailUrl: { type: 'string' },
                                    size: { type: 'number' },
                                    mimetype: { type: 'string' },
                                    category: { type: 'string' },
                                    status: { type: 'string' }
                                }
                            }
                        },
                        processingJobs: { type: 'array', items: { type: 'string' } },
                        warnings: { type: 'array', items: { type: 'string' } }
                    }
                },
                400: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', default: false },
                        errors: { type: 'array', items: { type: 'string' } }
                    }
                }
            }
        },
        preHandler: [fastify.authenticate], // Require authentication
        handler: async (request, reply) => {
            const studentId = request.user?.studentId || 'anonymous';
            const data = request.body;
            const params = uploadParamsSchema.parse({
                category: data.category?.value,
                generateThumbnails: data.generateThumbnails?.value === 'true',
                isPublic: data.isPublic?.value === 'true',
                compressionLevel: data.compressionLevel?.value ? parseInt(data.compressionLevel.value, 10) : undefined,
            });
            let educationalMetadata;
            if (data.educationalMetadata?.value) {
                educationalMetadata = educationalMetadataSchema.parse(JSON.parse(data.educationalMetadata.value));
            }
            const files = [];
            const validationErrors = [];
            for await (const part of request.parts()) {
                if (part.type === 'file') {
                    const buffer = await part.toBuffer();
                    const validationResult = file_validation_service_1.FileValidationService.validateFile(buffer, part.filename, part.mimetype, upload_types_1.DEFAULT_UPLOAD_CONFIG.maxFileSize);
                    if (!validationResult.isValid) {
                        validationErrors.push(`${part.filename}: ${validationResult.errors.join(', ')}`);
                        continue;
                    }
                    // Reconstruct a multipart file object after validation
                    files.push({ ...part, data: buffer, toBuffer: async () => buffer });
                }
            }
            if (validationErrors.length > 0) {
                return reply.status(400).send({ success: false, errors: validationErrors });
            }
            const uploadRequest = {
                files,
                category: params.category || 'resource',
                isPublic: params.isPublic,
                educationalMetadata,
                generateThumbnails: params.generateThumbnails,
                compressionLevel: params.compressionLevel,
            };
            const result = await uploadService.processUpload(uploadRequest, studentId);
            return reply.send(result);
        }
    });
    /**
     * Get file information
     */
    fastify.get('/files/:fileId', {
        schema: {
            description: 'Get file information by ID',
            tags: ['Upload'],
            params: fileIdSchema,
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        file: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                originalName: { type: 'string' },
                                filename: { type: 'string' },
                                url: { type: 'string' },
                                thumbnailUrl: { type: 'string' },
                                size: { type: 'number' },
                                mimetype: { type: 'string' },
                                category: { type: 'string' },
                                status: { type: 'string' },
                                uploadedAt: { type: 'string' },
                                metadata: { type: 'object' }
                            }
                        }
                    }
                },
                404: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', default: false },
                        error: { type: 'string' }
                    }
                }
            }
        },
        preHandler: [fastify.authenticate],
        handler: async (request, reply) => {
            const { fileId } = request.params;
            const file = await uploadService.getFile(fileId);
            if (!file) {
                return reply.status(404).send({ success: false, error: 'File not found' });
            }
            const studentId = request.user?.studentId;
            if (!file.isPublic && file.uploadedBy !== studentId) {
                return reply.status(403).send({ success: false, error: 'Access denied' });
            }
            return reply.send({ success: true, file });
        },
    });
    /**
     * Download file
     */
    fastify.get('/files/:fileId/download', {
        schema: {
            description: 'Download file by ID',
            tags: ['Upload'],
            params: fileIdSchema,
            querystring: {
                type: 'object',
                properties: {
                    variant: { type: 'string', enum: ['original', 'thumbnail', 'small', 'medium', 'large'] }
                }
            }
        },
        preHandler: [fastify.authenticate],
        handler: async (request, reply) => {
            const { fileId } = request.params;
            const { variant } = request.query;
            const studentId = request.user?.studentId;
            const file = await uploadService.getFile(fileId);
            if (!file) {
                return reply.status(404).send({ success: false, error: 'File not found' });
            }
            if (!file.isPublic && file.uploadedBy !== studentId) {
                return reply.status(403).send({ success: false, error: 'Access denied' });
            }
            let filename = file.filename;
            let mimetype = file.mimetype;
            if (variant !== 'original' && file.processedVariants) {
                const requestedVariant = file.processedVariants.find(v => v.type === variant);
                if (requestedVariant) {
                    filename = requestedVariant.filename;
                    mimetype = requestedVariant.mimetype;
                }
            }
            const resolvedPath = await getValidatedFilePath(fileId, filename, studentId);
            if (!resolvedPath) {
                return reply.status(400).send({ success: false, error: 'Invalid or non-existent file path' });
            }
            reply.header('Content-Type', mimetype);
            reply.header('Content-Disposition', `attachment; filename="${filename}"`);
            const stream = fastify.fs.createReadStream(resolvedPath);
            return reply.send(stream);
        },
    });
    /**
     * Delete file
     */
    fastify.delete('/files/:fileId', {
        preValidation: fastify.csrfProtection,
        schema: {
            description: 'Delete file by ID',
            tags: ['Upload'],
            params: fileIdSchema,
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        },
        preHandler: [fastify.authenticate],
        handler: async (request, reply) => {
            const { fileId } = request.params;
            const studentId = request.user?.studentId;
            if (!studentId) {
                return reply.status(401).send({ success: false, error: 'Authentication required' });
            }
            const success = await uploadService.deleteFile(fileId, studentId);
            if (success) {
                return reply.send({ success: true, message: 'File deleted successfully' });
            }
            else {
                return reply.status(404).send({ success: false, error: 'File not found or access denied' });
            }
        },
    });
    /**
     * List user files
     */
    fastify.get('/files', {
        schema: {
            description: 'List user files with pagination and filtering',
            tags: ['Upload'],
            querystring: {
                type: 'object',
                properties: {
                    category: { type: 'string', enum: ['image', 'video', 'audio', 'document', 'exercise', 'curriculum', 'assessment', 'resource'] },
                    limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
                    offset: { type: 'number', minimum: 0, default: 0 },
                    includePublic: { type: 'boolean', default: false }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        files: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    originalName: { type: 'string' },
                                    url: { type: 'string' },
                                    thumbnailUrl: { type: 'string' },
                                    size: { type: 'number' },
                                    category: { type: 'string' },
                                    uploadedAt: { type: 'string' }
                                }
                            }
                        },
                        total: { type: 'number' },
                        limit: { type: 'number' },
                        offset: { type: 'number' }
                    }
                }
            }
        },
        preHandler: [fastify.authenticate],
        handler: async (request, reply) => {
            const studentId = request.user?.studentId;
            if (!studentId) {
                return reply.status(401).send({ success: false, error: 'Authentication required' });
            }
            const result = await storageService.getFilesByUser(studentId, request.query);
            return reply.send({ success: true, ...result });
        },
    });
    /**
     * Get storage statistics
     */
    fastify.get('/storage/stats', {
        schema: {
            description: 'Get storage usage statistics',
            tags: ['Upload'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        stats: {
                            type: 'object',
                            properties: {
                                totalFiles: { type: 'number' },
                                totalSize: { type: 'number' },
                                storageUsage: {
                                    type: 'object',
                                    properties: {
                                        used: { type: 'number' },
                                        available: { type: 'number' },
                                        percentage: { type: 'number' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        preHandler: [fastify.authenticate],
        handler: async (request, reply) => {
            try {
                const stats = await uploadService.getStorageStats();
                return reply.send({
                    success: true,
                    stats
                });
            }
            catch (error) {
                logger_1.logger.error('Error getting storage stats:', error);
                return reply.status(500).send({
                    success: false,
                    error: 'Internal server error'
                });
            }
        }
    });
    /**
     * Process image (resize, compress, convert)
     */
    fastify.post('/images/:fileId/process', {
        preValidation: fastify.csrfProtection,
        schema: {
            description: 'Process image file with various operations',
            tags: ['Upload'],
            params: fileIdSchema,
            body: {
                type: 'object',
                properties: {
                    operation: { type: 'string', enum: ['resize', 'compress', 'convert', 'watermark'] },
                    options: {
                        type: 'object',
                        properties: {
                            width: { type: 'number' },
                            height: { type: 'number' },
                            quality: { type: 'number', minimum: 1, maximum: 100 },
                            format: { type: 'string', enum: ['jpeg', 'png', 'webp', 'avif'] },
                            watermarkText: { type: 'string' },
                            watermarkPosition: { type: 'string', enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'] }
                        }
                    }
                },
                required: ['operation']
            }
        },
        preHandler: [fastify.authenticate],
        handler: async (request, reply) => {
            const { fileId } = request.params;
            const { operation, options = {} } = request.body;
            const studentId = request.user?.studentId;
            const file = await uploadService.getFile(fileId);
            if (!file) {
                return reply.status(404).send({ success: false, error: 'File not found' });
            }
            if (file.uploadedBy !== studentId) {
                return reply.status(403).send({ success: false, error: 'Access denied' });
            }
            if (!file.mimetype.startsWith('image/')) {
                return reply.status(400).send({ success: false, error: 'File is not an image' });
            }
            const resolvedPath = await getValidatedFilePath(fileId, file.filename, studentId);
            if (!resolvedPath) {
                return reply.status(400).send({ success: false, error: 'Invalid or non-existent file path for processing' });
            }
            let result;
            switch (operation) {
                case 'resize':
                    result = await imageProcessor.resizeImage(resolvedPath, { width: options.width, height: options.height, fit: 'cover' }, { quality: options.quality });
                    break;
                case 'compress':
                    result = await imageProcessor.compressImage(resolvedPath, { quality: options.quality });
                    break;
                case 'convert':
                    result = await imageProcessor.convertFormat(resolvedPath, options.format || 'webp', options.quality);
                    break;
                case 'watermark':
                    if (!options.watermarkText) {
                        return reply.status(400).send({ success: false, error: 'Watermark text is required' });
                    }
                    result = await imageProcessor.addWatermark(resolvedPath, { text: options.watermarkText, position: options.watermarkPosition });
                    break;
                default:
                    return reply.status(400).send({ success: false, error: 'Invalid operation' });
            }
            reply.header('Content-Type', `image/${options.format || 'jpeg'}`);
            return reply.send(result);
        },
    });
    /**
     * Get supported file types
     */
    fastify.get('/upload/supported-types', {
        schema: {
            description: 'Get list of supported file types and limits',
            tags: ['Upload'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        supportedTypes: {
                            type: 'object',
                            properties: {
                                images: { type: 'array', items: { type: 'string' } },
                                videos: { type: 'array', items: { type: 'string' } },
                                audio: { type: 'array', items: { type: 'string' } },
                                documents: { type: 'array', items: { type: 'string' } }
                            }
                        },
                        limits: {
                            type: 'object',
                            properties: {
                                maxFileSize: { type: 'number' },
                                maxFilesPerUpload: { type: 'number' }
                            }
                        }
                    }
                }
            }
        },
        handler: async (request, reply) => {
            return reply.send({
                success: true,
                supportedTypes: {
                    images: [...upload_types_1.ALLOWED_IMAGE_TYPES],
                    videos: [...upload_types_1.ALLOWED_VIDEO_TYPES],
                    audio: [...upload_types_1.ALLOWED_AUDIO_TYPES],
                    documents: [...upload_types_1.ALLOWED_DOCUMENT_TYPES]
                },
                limits: {
                    maxFileSize: upload_types_1.DEFAULT_UPLOAD_CONFIG.maxFileSize,
                    maxFilesPerUpload: upload_types_1.DEFAULT_UPLOAD_CONFIG.maxFilesPerUpload
                }
            });
        }
    });
};
exports.default = uploadRoutes;
