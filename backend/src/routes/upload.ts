import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import * as path from 'path';
import * as fs from 'fs/promises';
import { z } from 'zod';
import { config, uploadConfig } from '../config/config';
import { FileUploadService } from '../services/file-upload.service';
import { ImageProcessingService } from '../services/image-processing.service';
import { StorageService } from '../services/storage.service';
import { FileValidationService } from '../services/file-validation.service';
import { 
  UploadRequest, 
  FileCategory, 
  DEFAULT_UPLOAD_CONFIG,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_AUDIO_TYPES,
  ALLOWED_DOCUMENT_TYPES 
} from '../types/upload.types';
import { logger } from '../utils/logger';

// Validation schemas
const uploadParamsSchema = z.object({
  category: z.enum(['image', 'video', 'audio', 'document', 'exercise', 'curriculum', 'assessment', 'resource']).optional(),
  generateThumbnails: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  compressionLevel: z.number().min(0).max(100).optional()
});

const educationalMetadataSchema = z.object({
  subject: z.string().optional(),
  gradeLevel: z.array(z.string()).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().max(500).optional(),
  learningObjectives: z.array(z.string()).optional(),
  accessibilityFeatures: z.array(z.string()).optional()
});

const fileIdSchema = z.object({
  fileId: z.string().uuid()
});

const downloadQuerySchema = z.object({
    variant: z.enum(['original', 'thumbnail', 'small', 'medium', 'large']).default('original'),
});

const listFilesQuerySchema = z.object({
    category: z.enum(['image', 'video', 'audio', 'document', 'exercise', 'curriculum', 'assessment', 'resource']).optional(),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0),
    includePublic: z.boolean().default(false),
});

const processImageBodySchema = z.object({
    operation: z.enum(['resize', 'compress', 'convert', 'watermark']),
    options: z.object({
        width: z.number().optional(),
        height: z.number().optional(),
        quality: z.number().min(1).max(100).optional(),
        format: z.enum(['jpeg', 'png', 'webp', 'avif']).optional(),
        watermarkText: z.string().optional(),
        watermarkPosition: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center']).optional(),
    }).optional(),
});

// Define stricter types to replace 'any'
type UploadParams = z.infer<typeof uploadParamsSchema>;
type EducationalMetadata = z.infer<typeof educationalMetadataSchema>;
type FileIdParams = z.infer<typeof fileIdSchema>;
type DownloadQuery = z.infer<typeof downloadQuerySchema>;
type ListFilesQuery = z.infer<typeof listFilesQuerySchema>;
type ProcessImageBody = z.infer<typeof processImageBodySchema>;

interface AuthenticatedUser {
  studentId: number;
  email: string;
  role: string;
}

interface AuthenticatedRequest extends FastifyRequest {
  user: AuthenticatedUser;
}

const uploadRoutes: FastifyPluginAsync = async (fastify) => {
  const uploadService = new FileUploadService();
  const imageProcessor = new ImageProcessingService();
  const storageService = new StorageService();

  // Import enhanced path security
  const { pathSecurity } = await import('../security/path-security.service');

  /**
   * Enhanced secure path validation helper
   */
  const getValidatedFilePath = async (
    fileId: string,
    filename: string,
    userId?: string
  ): Promise<string | null> => {
    // Use comprehensive path security validation
    const validation = pathSecurity.validatePath(filename, uploadConfig.uploadPath);

    if (!validation.isValid) {
      logger.warn('Path security validation failed', {
        userId,
        fileId,
        filename,
        errors: validation.errors,
        securityViolations: validation.securityViolations
      });
      return null;
    }

    // Additional file existence and access check
    const accessResult = await pathSecurity.safeFileAccess(validation.normalizedPath!, 'read');

    if (!accessResult.success) {
      logger.warn('File access validation failed', {
        userId,
        fileId,
        path: validation.normalizedPath,
        error: accessResult.error,
        securityViolations: accessResult.securityViolations
      });
      return null;
    }

    return accessResult.path!;
  };

  // Register multipart support
  await fastify.register(import('@fastify/multipart'), {
    limits: {
      fieldNameSize: 100,
      fieldSize: 1000,
      fields: 10,
      fileSize: DEFAULT_UPLOAD_CONFIG.maxFileSize,
      files: DEFAULT_UPLOAD_CONFIG.maxFilesPerUpload,
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
    preHandler: [fastify.authenticate],
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
    }
  }, async (request, reply) => {
        const user = (request as AuthenticatedRequest).user;
        const studentId = user?.studentId ? String(user.studentId) : 'anonymous';
        const data = request.body as Record<string, { value?: string; data?: Buffer; filename?: string; mimetype?: string; encoding?: string }>;

        const params: UploadParams = uploadParamsSchema.parse({
            category: data.category?.value,
            generateThumbnails: data.generateThumbnails?.value === 'true',
            isPublic: data.isPublic?.value === 'true',
            compressionLevel: data.compressionLevel?.value ? parseInt(data.compressionLevel.value, 10) : undefined,
        });

        let educationalMetadata: EducationalMetadata | undefined;
        if (data.educationalMetadata?.value) {
            educationalMetadata = educationalMetadataSchema.parse(JSON.parse(data.educationalMetadata.value));
        }

        const files: MultipartFile[] = [];
        const validationErrors: string[] = [];

        for await (const part of request.parts()) {
            if (part.type === 'file') {
                const buffer = await part.toBuffer();
                const validationResult = FileValidationService.validateFile(
                    buffer,
                    part.filename,
                    part.mimetype,
                    DEFAULT_UPLOAD_CONFIG.maxFileSize
                );

                if (!validationResult.isValid) {
                    validationErrors.push(`${part.filename}: ${validationResult.errors.join(', ')}`);
                    continue;
                }
                
                // Reconstruct a multipart file object after validation
                files.push({ ...part, data: buffer, toBuffer: async () => buffer } as MultipartFile);
            }
        }
        
        if (validationErrors.length > 0) {
            return reply.status(400).send({ success: false, errors: validationErrors });
        }

        const uploadRequest: UploadRequest = {
            files,
            category: params.category || 'resource',
            isPublic: params.isPublic,
            educationalMetadata,
            generateThumbnails: params.generateThumbnails,
            compressionLevel: params.compressionLevel,
        };

        const result = await uploadService.processUpload(uploadRequest, studentId);
        return reply.send(result);
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
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
      const { fileId } = request.params as { fileId: string };
      const file = await uploadService.getFile(fileId);

      if (!file) {
        return reply.status(404).send({ success: false, error: 'File not found' });
      }

      const user = (request as AuthenticatedRequest).user;
      const studentId = user?.studentId ? String(user.studentId) : undefined;
      if (!file.isPublic && file.uploadedBy !== studentId) {
        return reply.status(403).send({ success: false, error: 'Access denied' });
      }

      return reply.send({ success: true, file });
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
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
        const { fileId } = request.params as { fileId: string };
        const { variant } = request.query as { variant?: 'original' | 'thumbnail' | 'small' | 'medium' | 'large' };
        const user = (request as AuthenticatedRequest).user;
        const studentId = user?.studentId ? String(user.studentId) : undefined;

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
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
      const { fileId } = request.params as { fileId: string };
      const user = (request as AuthenticatedRequest).user;
      const studentId = user?.studentId ? String(user.studentId) : undefined;

      if (!studentId) {
        return reply.status(401).send({ success: false, error: 'Authentication required' });
      }

      const success = await uploadService.deleteFile(fileId, studentId);
      if (success) {
        return reply.send({ success: true, message: 'File deleted successfully' });
      } else {
        return reply.status(404).send({ success: false, error: 'File not found or access denied' });
      }
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
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
        const user = (request as AuthenticatedRequest).user;
        const studentId = user?.studentId ? String(user.studentId) : undefined;
        if (!studentId) {
            return reply.status(401).send({ success: false, error: 'Authentication required' });
        }
        
        const query = request.query as { category?: FileCategory; limit?: number; offset?: number; includePublic?: boolean };
        const result = await storageService.getFilesByUser(studentId, query);
        return reply.send({ success: true, ...result });
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
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
      try {
        const stats = await uploadService.getStorageStats();

        return reply.send({
          success: true,
          stats
        });

      } catch (error: unknown) {
        logger.error('Error getting storage stats:', { error });
        return reply.status(500).send({
          success: false,
          error: 'Internal server error'
        });
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
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
        const { fileId } = request.params as { fileId: string };
        const { operation, options } = request.body as { operation: 'resize' | 'compress' | 'convert' | 'watermark'; options?: { width?: number; height?: number; quality?: number; format?: 'jpeg' | 'png' | 'webp' | 'avif'; watermarkText?: string; watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' } };
        const user = (request as AuthenticatedRequest).user;
        const studentId = user?.studentId ? String(user.studentId) : undefined;

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

        const opts = options || {};
        let result: Buffer;
        switch (operation) {
            case 'resize':
                if (!opts.width || !opts.height) {
                    return reply.status(400).send({ success: false, error: 'Width and height are required for resize operation' });
                }
                result = await imageProcessor.resizeImage(resolvedPath, { width: opts.width, height: opts.height, fit: 'cover' }, { quality: opts.quality || 80 });
                break;
            case 'compress':
                result = await imageProcessor.compressImage(resolvedPath, { quality: opts.quality || 80 });
                break;
            case 'convert':
                result = await imageProcessor.convertFormat(resolvedPath, opts.format || 'webp', opts.quality || 80);
                break;
            case 'watermark':
                 if (!opts.watermarkText) {
                    return reply.status(400).send({ success: false, error: 'Watermark text is required' });
                }
                result = await imageProcessor.addWatermark(resolvedPath, { 
                  text: opts.watermarkText, 
                  position: opts.watermarkPosition || 'center',
                  opacity: 0.7,
                  fontSize: 24,
                  color: '#FFFFFF'
                });
                break;
            default:
                return reply.status(400).send({ success: false, error: 'Invalid operation' });
        }

        reply.header('Content-Type', `image/${opts.format || 'jpeg'}`);
        return reply.send(result);
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
    }
  }, async (request, reply) => {
      return reply.send({
        success: true,
        supportedTypes: {
          images: [...ALLOWED_IMAGE_TYPES],
          videos: [...ALLOWED_VIDEO_TYPES],
          audio: [...ALLOWED_AUDIO_TYPES],
          documents: [...ALLOWED_DOCUMENT_TYPES]
        },
        limits: {
          maxFileSize: DEFAULT_UPLOAD_CONFIG.maxFileSize,
          maxFilesPerUpload: DEFAULT_UPLOAD_CONFIG.maxFilesPerUpload
        }
      });
  });
};

export default uploadRoutes;