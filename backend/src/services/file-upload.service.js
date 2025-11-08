"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadService = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const file_type_1 = require("file-type");
const logger_1 = require("../utils/logger");
const upload_types_1 = require("../types/upload.types");
const image_processing_service_1 = require("./image-processing.service");
const storage_service_1 = require("./storage.service");
class FileUploadService {
    constructor(config = {}) {
        this.config = { ...upload_types_1.DEFAULT_UPLOAD_CONFIG, ...config };
        this.uploadPath = path_1.default.resolve(process.cwd(), this.config.uploadPath);
        this.imageProcessor = new image_processing_service_1.ImageProcessingService();
        this.storageService = new storage_service_1.StorageService();
        this.initializeStorage();
    }
    /**
     * Process uploaded files with validation and security checks
     */
    async processUpload(request, uploadedBy) {
        try {
            const response = {
                success: false,
                files: [],
                errors: [],
                warnings: [],
                processingJobs: []
            };
            // Validate upload request
            const validationResult = await this.validateUploadRequest(request);
            if (!validationResult.isValid) {
                return {
                    success: false,
                    files: [],
                    errors: validationResult.errors
                };
            }
            // Process each file
            for (const file of request.files) {
                try {
                    const uploadedFile = await this.processFile(file, request, uploadedBy);
                    response.files.push(uploadedFile);
                    // Queue background processing if needed
                    if (this.shouldProcessInBackground(uploadedFile)) {
                        const jobId = await this.queueBackgroundProcessing(uploadedFile);
                        response.processingJobs?.push(jobId);
                    }
                }
                catch (error) {
                    logger_1.logger.error('Error processing file:', {
                        filename: file.originalname,
                        error: error.message
                    });
                    response.errors?.push(`Failed to process ${file.originalname}: ${error.message}`);
                }
            }
            response.success = response.files.length > 0;
            return response;
        }
        catch (error) {
            logger_1.logger.error('Error in file upload process:', error);
            throw new Error('File upload processing failed');
        }
    }
    /**
     * Process individual file
     */
    async processFile(file, request, uploadedBy) {
        // Generate unique file ID and secure filename
        const fileId = crypto_1.default.randomUUID();
        const sanitizedName = this.sanitizeFilename(file.originalname);
        const fileExtension = path_1.default.extname(sanitizedName).toLowerCase();
        const secureFilename = `${fileId}${fileExtension}`;
        // Determine file category
        const category = request.category || this.detectFileCategory(file.mimetype);
        // Create file directory structure
        const categoryPath = path_1.default.join(this.uploadPath, category);
        const datePath = path_1.default.join(categoryPath, new Date().toISOString().split('T')[0]);
        await fs_extra_1.default.ensureDir(datePath);
        const filePath = path_1.default.join(datePath, secureFilename);
        // Security validation
        await this.validateFileContent(file.buffer);
        // Calculate checksum
        const checksum = crypto_1.default.createHash('sha256').update(file.buffer).digest('hex');
        // Check for duplicates
        const existingFile = await this.checkForDuplicate(checksum);
        if (existingFile) {
            logger_1.logger.warn('Duplicate file detected', {
                originalName: file.originalname,
                existingFileId: existingFile.id
            });
            return existingFile;
        }
        // Write file to disk
        await fs_extra_1.default.writeFile(filePath, file.buffer);
        // Get file metadata
        const metadata = await this.extractFileMetadata(file.buffer, file.mimetype);
        // Create uploaded file object
        const uploadedFile = {
            id: fileId,
            originalName: file.originalname,
            filename: secureFilename,
            mimetype: file.mimetype,
            size: file.size,
            path: filePath,
            url: this.generateFileUrl(category, datePath, secureFilename),
            metadata: {
                ...metadata,
                educationalMetadata: request.educationalMetadata
            },
            uploadedBy,
            uploadedAt: new Date(),
            category,
            isPublic: request.isPublic || false,
            status: 'ready',
            checksum,
            processedVariants: []
        };
        // Generate thumbnails for images
        if (category === 'image' && request.generateThumbnails !== false) {
            try {
                const thumbnails = await this.imageProcessor.generateThumbnails(filePath, this.config.thumbnailSizes);
                uploadedFile.processedVariants = thumbnails;
                uploadedFile.thumbnailUrl = thumbnails.find(t => t.type === 'small')?.url;
            }
            catch (error) {
                logger_1.logger.warn('Failed to generate thumbnails:', { fileId, error: error.message });
            }
        }
        // Perform security scan if enabled
        if (this.config.enableVirusScanning) {
            try {
                const scanResult = await this.performSecurityScan(filePath);
                if (!scanResult.isClean) {
                    uploadedFile.status = 'quarantined';
                    logger_1.logger.warn('File quarantined due to security scan', {
                        fileId,
                        threats: scanResult.threats
                    });
                }
            }
            catch (error) {
                logger_1.logger.error('Security scan failed:', { fileId, error: error.message });
            }
        }
        // Store file metadata in database
        await this.storageService.saveFileMetadata(uploadedFile);
        logger_1.logger.info('File uploaded successfully', {
            fileId,
            originalName: file.originalname,
            size: file.size,
            category,
            uploadedBy
        });
        return uploadedFile;
    }
    /**
     * Validate upload request
     */
    async validateUploadRequest(request) {
        const errors = [];
        // Check file count
        if (request.files.length === 0) {
            errors.push('No files provided');
        }
        if (request.files.length > this.config.maxFilesPerUpload) {
            errors.push(`Too many files. Maximum allowed: ${this.config.maxFilesPerUpload}`);
        }
        // Validate each file
        for (const file of request.files) {
            // Check file size
            const maxSize = this.getMaxFileSizeForType(file.mimetype);
            if (file.size > maxSize) {
                errors.push(`File ${file.originalname} exceeds maximum size of ${this.formatFileSize(maxSize)}`);
            }
            // Check file type
            if (!this.config.allowedMimeTypes.includes(file.mimetype)) {
                errors.push(`File type ${file.mimetype} is not allowed for ${file.originalname}`);
            }
            // Check file extension
            const extension = path_1.default.extname(file.originalname).toLowerCase();
            if (!this.config.allowedExtensions.includes(extension)) {
                errors.push(`File extension ${extension} is not allowed for ${file.originalname}`);
            }
            // Validate filename
            if (!this.isValidFilename(file.originalname)) {
                errors.push(`Invalid filename: ${file.originalname}`);
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    /**
     * Validate file content for security
     */
    async validateFileContent(buffer) {
        // Check file type from magic bytes
        const fileType = await (0, file_type_1.fileTypeFromBuffer)(buffer);
        // Check for executable files
        if (this.isExecutableFile(buffer)) {
            throw new Error('Executable files are not allowed');
        }
        // Check for suspicious patterns
        if (this.containsSuspiciousPatterns(buffer)) {
            throw new Error('File contains suspicious patterns');
        }
        // Validate file structure based on type
        if (fileType) {
            await this.validateFileStructure(buffer, fileType.mime);
        }
    }
    /**
     * Extract file metadata
     */
    async extractFileMetadata(buffer, mimetype) {
        const metadata = {};
        if (mimetype.startsWith('image/')) {
            try {
                const imageInfo = await this.imageProcessor.getImageInfo(buffer);
                metadata.width = imageInfo.width;
                metadata.height = imageInfo.height;
                metadata.format = imageInfo.format;
                metadata.colorSpace = imageInfo.space;
                metadata.hasAlpha = imageInfo.hasAlpha;
            }
            catch (error) {
                logger_1.logger.warn('Failed to extract image metadata:', error.message);
            }
        }
        return metadata;
    }
    /**
     * Security helpers
     */
    isExecutableFile(buffer) {
        const executableSignatures = [
            'MZ', // Windows PE
            '\x7fELF', // Linux ELF
            '\xfe\xed\xfa', // macOS Mach-O
            'PK\x03\x04' // ZIP (could contain executables)
        ];
        const header = buffer.toString('ascii', 0, 4);
        return executableSignatures.some(sig => header.startsWith(sig));
    }
    containsSuspiciousPatterns(buffer) {
        const suspiciousPatterns = [
            /<script[^>]*>/i,
            /javascript:/i,
            /data:.*base64/i,
            /<!--.*-->/i,
            /%3Cscript/i
        ];
        const content = buffer.toString('utf-8', 0, Math.min(1024, buffer.length));
        return suspiciousPatterns.some(pattern => pattern.test(content));
    }
    async validateFileStructure(buffer, mimetype) {
        // Basic file structure validation
        if (mimetype.startsWith('image/')) {
            try {
                await this.imageProcessor.validateImageStructure(buffer);
            }
            catch (error) {
                throw new Error(`Invalid image structure: ${error.message}`);
            }
        }
    }
    /**
     * Security scanning
     */
    async performSecurityScan(filePath) {
        // Mock implementation - replace with actual virus scanner
        return {
            isClean: true,
            threats: [],
            scanEngine: 'mock-scanner',
            scanDate: new Date(),
            quarantined: false
        };
    }
    /**
     * Utility methods
     */
    detectFileCategory(mimetype) {
        if (upload_types_1.ALLOWED_IMAGE_TYPES.includes(mimetype))
            return 'image';
        if (upload_types_1.ALLOWED_VIDEO_TYPES.includes(mimetype))
            return 'video';
        if (upload_types_1.ALLOWED_AUDIO_TYPES.includes(mimetype))
            return 'audio';
        if (upload_types_1.ALLOWED_DOCUMENT_TYPES.includes(mimetype))
            return 'document';
        return 'resource';
    }
    getMaxFileSizeForType(mimetype) {
        const category = this.detectFileCategory(mimetype);
        return upload_types_1.MAX_FILE_SIZES[category] || upload_types_1.MAX_FILE_SIZES.default;
    }
    sanitizeFilename(filename) {
        // Remove dangerous characters and normalize
        return filename
            .replace(/[^\w\s.-]/gi, '')
            .replace(/\s+/g, '_')
            .toLowerCase()
            .trim();
    }
    isValidFilename(filename) {
        // Check for valid filename patterns
        const invalidPatterns = [
            /^\.+$/, // Only dots
            /[<>:"|?*]/, // Windows reserved characters
            /\x00/, // Null bytes
            /\.(exe|bat|cmd|scr|pif|com)$/i // Executable extensions
        ];
        return !invalidPatterns.some(pattern => pattern.test(filename));
    }
    generateFileUrl(category, datePath, filename) {
        const relativePath = path_1.default.relative(this.uploadPath, path_1.default.join(datePath, filename));
        return `/uploads/${relativePath.replace(/\\/g, '/')}`;
    }
    formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unit = 0;
        while (size >= 1024 && unit < units.length - 1) {
            size /= 1024;
            unit++;
        }
        return `${size.toFixed(1)} ${units[unit]}`;
    }
    async checkForDuplicate(checksum) {
        return await this.storageService.findFileByChecksum(checksum);
    }
    shouldProcessInBackground(file) {
        return file.category === 'video' ||
            (file.category === 'image' && file.size > 5 * 1024 * 1024);
    }
    async queueBackgroundProcessing(file) {
        // Mock implementation - replace with actual job queue
        const jobId = crypto_1.default.randomUUID();
        logger_1.logger.info('Queued background processing job', { fileId: file.id, jobId });
        return jobId;
    }
    async initializeStorage() {
        try {
            await fs_extra_1.default.ensureDir(this.uploadPath);
            // Create category directories
            const categories = ['image', 'video', 'audio', 'document', 'resource'];
            for (const category of categories) {
                await fs_extra_1.default.ensureDir(path_1.default.join(this.uploadPath, category));
            }
            logger_1.logger.info('File upload storage initialized', { uploadPath: this.uploadPath });
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize upload storage:', error);
            throw new Error('Storage initialization failed');
        }
    }
    /**
     * Get file by ID
     */
    async getFile(fileId) {
        return await this.storageService.getFileById(fileId);
    }
    /**
     * Delete file
     */
    async deleteFile(fileId, userId) {
        try {
            const file = await this.getFile(fileId);
            if (!file) {
                throw new Error('File not found');
            }
            // Check permissions
            if (file.uploadedBy !== userId) {
                throw new Error('Insufficient permissions to delete file');
            }
            // Delete physical files
            await fs_extra_1.default.remove(file.path);
            // Delete thumbnails and variants
            if (file.processedVariants) {
                for (const variant of file.processedVariants) {
                    await fs_extra_1.default.remove(variant.path).catch(() => {
                        // Ignore errors for variant deletion
                    });
                }
            }
            // Update database
            await this.storageService.markFileAsDeleted(fileId);
            logger_1.logger.info('File deleted successfully', { fileId, userId });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error deleting file:', { fileId, error: error.message });
            throw error;
        }
    }
    /**
     * Get storage statistics
     */
    async getStorageStats() {
        return await this.storageService.getStorageStats();
    }
    /**
     * Cleanup expired files
     */
    async cleanupExpiredFiles(maxAge = 30) {
        return await this.storageService.cleanupExpiredFiles(maxAge);
    }
}
exports.FileUploadService = FileUploadService;
