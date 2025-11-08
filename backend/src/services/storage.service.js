"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
const connection_1 = require("../db/connection");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
class StorageService {
    constructor() {
        this.uploadPath = process.env.UPLOAD_PATH || path_1.default.resolve(process.cwd(), 'uploads');
        this.maxStorageSize = parseInt(process.env.MAX_STORAGE_SIZE || '10737418240'); // 10GB default
        this.cleanupBatchSize = 100;
    }
    /**
     * Save file metadata to database
     */
    async saveFileMetadata(file) {
        try {
            const transaction = await connection_1.db.transaction(async (tx) => {
                // Generate file ID
                const newFileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                // Insert main file record
                await tx.insert(schema_1.files).values({
                    id: newFileId,
                    fileName: file.originalName,
                    filePath: file.path,
                    fileSize: file.size,
                    mimeType: file.mimetype,
                    url: file.url || null,
                    thumbnailUrl: file.thumbnailUrl || null,
                    metadata: file.metadata,
                    uploadedBy: file.uploadedBy,
                    uploadedAt: file.uploadedAt instanceof Date ? file.uploadedAt : new Date(file.uploadedAt),
                    category: file.category,
                    isPublic: file.isPublic,
                    status: file.status,
                    checksum: file.checksum
                });
                // Insert processed variants if any
                if (file.processedVariants && file.processedVariants.length > 0) {
                    const variantValues = file.processedVariants.map(variant => ({
                        id: `variant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        originalFileId: newFileId,
                        variantType: variant.type,
                        filePath: variant.path,
                        fileSize: variant.size,
                        url: variant.url || null,
                        metadata: variant.metadata
                    }));
                    await tx.insert(schema_1.fileVariants).values(variantValues);
                }
                return; // File inserted successfully
            });
            logger_1.logger.info('File metadata saved to database', { fileId: file.id });
        }
        catch (error) {
            const err = error;
            logger_1.logger.error('Error saving file metadata:', { fileId: file?.id, error: err?.message });
            throw new Error(`Failed to save file metadata: ${err?.message}`);
        }
    }
    /**
     * Get file by ID with variants
     */
    async getFileById(fileId) {
        try {
            const fileData = await connection_1.db
                .select()
                .from(schema_1.files)
                .where((0, drizzle_orm_1.eq)(schema_1.files.id, fileId))
                .limit(1);
            if (fileData.length === 0) {
                return null;
            }
            const file = fileData[0];
            // Get variants
            const variants = await connection_1.db
                .select()
                .from(schema_1.fileVariants)
                .where((0, drizzle_orm_1.eq)(schema_1.fileVariants.originalFileId, fileId));
            const processedVariants = variants.map(variant => ({
                id: variant.id.toString(),
                type: variant.variantType,
                filename: path_1.default.basename(variant.filePath),
                path: variant.filePath,
                url: variant.url || '',
                size: variant.fileSize,
                mimetype: file.mimeType,
                metadata: variant.metadata || {},
                createdAt: new Date(variant.createdAt)
            }));
            return {
                id: file.id.toString(),
                originalName: file.fileName,
                filename: file.fileName,
                mimetype: file.mimeType,
                size: file.fileSize,
                path: file.filePath,
                url: file.url || '',
                thumbnailUrl: file.thumbnailUrl || undefined,
                metadata: file.metadata || {},
                uploadedBy: file.uploadedBy,
                uploadedAt: new Date(file.uploadedAt),
                category: file.category,
                isPublic: file.isPublic,
                status: file.status,
                checksum: file.checksum || null,
                processedVariants
            };
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger_1.logger.error('Error getting file by ID:', { fileId, error: err.message });
            throw new Error(`Failed to get file: ${err.message}`);
        }
    }
    /**
     * Find file by checksum (for duplicate detection)
     */
    async findFileByChecksum(checksum) {
        try {
            const fileData = await connection_1.db
                .select()
                .from(schema_1.files)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.files.checksum, checksum), (0, drizzle_orm_1.eq)(schema_1.files.status, 'ready')))
                .limit(1);
            if (fileData.length === 0) {
                return null;
            }
            return this.getFileById(fileData[0].id.toString());
        }
        catch (error) {
            const err = error;
            logger_1.logger.error('Error finding file by checksum:', { checksum, error: err?.message });
            return null;
        }
    }
    /**
     * Get files by user with pagination
     */
    async getFilesByUser(userId, options = {}) {
        try {
            const { category, limit = 20, offset = 0, includePublic = false } = options;
            let whereConditions = (0, drizzle_orm_1.eq)(schema_1.files.uploadedBy, userId);
            if (category) {
                whereConditions = (0, drizzle_orm_1.and)(whereConditions, (0, drizzle_orm_1.eq)(schema_1.files.category, category));
            }
            if (includePublic) {
                whereConditions = (0, drizzle_orm_1.and)(whereConditions, (0, drizzle_orm_1.eq)(schema_1.files.isPublic, true));
            }
            // Get total count
            const [{ count }] = await connection_1.db
                .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
                .from(schema_1.files)
                .where(whereConditions);
            // Get files
            const fileData = await connection_1.db
                .select()
                .from(schema_1.files)
                .where(whereConditions)
                .orderBy((0, drizzle_orm_1.desc)(schema_1.files.uploadedAt))
                .limit(limit)
                .offset(offset);
            const filesList = [];
            for (const file of fileData) {
                const fullFile = await this.getFileById(file.id.toString());
                if (fullFile) {
                    filesList.push(fullFile);
                }
            }
            return { files: filesList, total: count };
        }
        catch (error) {
            const err = error;
            logger_1.logger.error('Error getting files by user:', { userId, error: err?.message });
            throw new Error(`Failed to get user files: ${err?.message}`);
        }
    }
    /**
     * Update file status
     */
    async updateFileStatus(fileId, status) {
        try {
            await connection_1.db
                .update(schema_1.files)
                .set({ status })
                .where((0, drizzle_orm_1.eq)(schema_1.files.id, fileId));
            logger_1.logger.info('File status updated', { fileId, status });
        }
        catch (error) {
            const err = error;
            logger_1.logger.error('Error updating file status:', { fileId, status, error: err?.message });
            throw new Error(`Failed to update file status: ${err?.message}`);
        }
    }
    /**
     * Mark file as deleted
     */
    async markFileAsDeleted(fileId) {
        try {
            await connection_1.db.transaction(async (tx) => {
                // Update file status
                await tx
                    .update(schema_1.files)
                    .set({
                    status: 'deleted'
                })
                    .where((0, drizzle_orm_1.eq)(schema_1.files.id, fileId));
                // Mark variants as deleted
                await tx
                    .update(schema_1.fileVariants)
                    .set({ deletedAt: new Date() })
                    .where((0, drizzle_orm_1.eq)(schema_1.fileVariants.originalFileId, fileId));
            });
            logger_1.logger.info('File marked as deleted', { fileId });
        }
        catch (error) {
            const err = error;
            logger_1.logger.error('Error marking file as deleted:', { fileId, error: err?.message });
            throw new Error(`Failed to delete file: ${err?.message}`);
        }
    }
    /**
     * Get storage statistics
     */
    async getStorageStats() {
        try {
            // Get total files and sizes
            const [totalStats] = await connection_1.db
                .select({
                totalFiles: (0, drizzle_orm_1.sql) `count(*)`,
                totalSize: (0, drizzle_orm_1.sql) `sum(${schema_1.files.fileSize})`
            })
                .from(schema_1.files)
                .where((0, drizzle_orm_1.eq)(schema_1.files.status, 'ready'));
            // Get category breakdown
            const categoryStats = await connection_1.db
                .select({
                category: schema_1.files.category,
                size: (0, drizzle_orm_1.sql) `sum(${schema_1.files.fileSize})`
            })
                .from(schema_1.files)
                .where((0, drizzle_orm_1.eq)(schema_1.files.status, 'ready'))
                .groupBy(schema_1.files.category);
            const categorySizes = {};
            for (const stat of categoryStats) {
                categorySizes[stat.category] = stat.size;
            }
            // Get recent uploads
            const recentFiles = await connection_1.db
                .select()
                .from(schema_1.files)
                .where((0, drizzle_orm_1.eq)(schema_1.files.status, 'ready'))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.files.uploadedAt))
                .limit(10);
            const recentUploads = [];
            for (const file of recentFiles) {
                const fullFile = await this.getFileById(file.id.toString());
                if (fullFile) {
                    recentUploads.push(fullFile);
                }
            }
            // Calculate storage usage
            const usedSpace = totalStats?.totalSize || 0;
            const availableSpace = this.maxStorageSize - usedSpace;
            const percentage = (usedSpace / this.maxStorageSize) * 100;
            return {
                totalFiles: totalStats?.totalFiles || 0,
                totalSize: usedSpace,
                categorySizes,
                recentUploads,
                storageUsage: {
                    used: usedSpace,
                    available: Math.max(0, availableSpace),
                    percentage: Math.min(100, percentage)
                }
            };
        }
        catch (error) {
            const err = error;
            logger_1.logger.error('Error getting storage stats:', { error: err });
            throw new Error(`Failed to get storage statistics: ${err?.message}`);
        }
    }
    /**
     * Cleanup expired files
     */
    async cleanupExpiredFiles(maxAgeDays = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
            let deletedCount = 0;
            let hasMore = true;
            while (hasMore) {
                // Get batch of expired files
                const expiredFiles = await connection_1.db
                    .select()
                    .from(schema_1.files)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.lt)(schema_1.files.uploadedAt, cutoffDate), (0, drizzle_orm_1.eq)(schema_1.files.status, 'deleted')))
                    .limit(this.cleanupBatchSize);
                if (expiredFiles.length === 0) {
                    hasMore = false;
                    break;
                }
                for (const file of expiredFiles) {
                    try {
                        // Remove physical file
                        await fs_extra_1.default.remove(file.filePath);
                        // Remove variants
                        const variants = await connection_1.db
                            .select()
                            .from(schema_1.fileVariants)
                            .where((0, drizzle_orm_1.eq)(schema_1.fileVariants.originalFileId, file.id));
                        for (const variant of variants) {
                            await fs_extra_1.default.remove(variant.filePath).catch(() => {
                                // Ignore errors for variant deletion
                            });
                        }
                        // Remove from database
                        await connection_1.db.transaction(async (tx) => {
                            await tx.delete(schema_1.fileVariants).where((0, drizzle_orm_1.eq)(schema_1.fileVariants.originalFileId, file.id));
                            await tx.delete(schema_1.files).where((0, drizzle_orm_1.eq)(schema_1.files.id, file.id));
                        });
                        deletedCount++;
                        logger_1.logger.debug('Cleaned up expired file', { fileId: file.id });
                    }
                    catch (error) {
                        const err = error;
                        logger_1.logger.warn('Failed to cleanup file:', {
                            fileId: file.id,
                            error: err?.message
                        });
                    }
                }
            }
            if (deletedCount > 0) {
                logger_1.logger.info('Cleanup completed', { deletedCount, maxAgeDays });
            }
            return deletedCount;
        }
        catch (error) {
            const err = error;
            logger_1.logger.error('Error during cleanup:', { error: err });
            throw new Error(`Cleanup failed: ${err?.message}`);
        }
    }
    /**
     * Cleanup orphaned files (files on disk not in database)
     */
    async cleanupOrphanedFiles() {
        try {
            const categories = ['image', 'video', 'audio', 'document', 'resource'];
            let cleanedCount = 0;
            for (const category of categories) {
                const categoryPath = path_1.default.join(this.uploadPath, category);
                if (!await fs_extra_1.default.pathExists(categoryPath)) {
                    continue;
                }
                const dateDirs = await fs_extra_1.default.readdir(categoryPath);
                for (const dateDir of dateDirs) {
                    const datePath = path_1.default.join(categoryPath, dateDir);
                    const stat = await fs_extra_1.default.stat(datePath);
                    if (!stat.isDirectory()) {
                        continue;
                    }
                    const diskFiles = await fs_extra_1.default.readdir(datePath);
                    for (const diskFile of diskFiles) {
                        const fullPath = path_1.default.join(datePath, diskFile);
                        // Check if file exists in database
                        const dbFile = await connection_1.db
                            .select()
                            .from(schema_1.files)
                            .where((0, drizzle_orm_1.eq)(schema_1.files.filePath, fullPath))
                            .limit(1);
                        if (dbFile.length === 0) {
                            // Orphaned file - remove it
                            await fs_extra_1.default.remove(fullPath);
                            cleanedCount++;
                            logger_1.logger.debug('Removed orphaned file', { path: fullPath });
                        }
                    }
                }
            }
            if (cleanedCount > 0) {
                logger_1.logger.info('Orphaned files cleanup completed', { cleanedCount });
            }
            return cleanedCount;
        }
        catch (error) {
            const err = error;
            logger_1.logger.error('Error cleaning orphaned files:', { error: err });
            throw new Error(`Orphaned files cleanup failed: ${err?.message}`);
        }
    }
    /**
     * Get storage health information
     */
    async getStorageHealth() {
        try {
            const stats = await this.getStorageStats();
            const issues = [];
            const recommendations = [];
            // Check disk usage
            let status = 'healthy';
            if (stats.storageUsage.percentage > 90) {
                status = 'critical';
                issues.push('Storage usage is critical (>90%)');
                recommendations.push('Immediately cleanup old files or increase storage capacity');
            }
            else if (stats.storageUsage.percentage > 75) {
                status = 'warning';
                issues.push('Storage usage is high (>75%)');
                recommendations.push('Consider cleaning up old files or increasing storage capacity');
            }
            // Check for failed uploads
            const [failedUploads] = await connection_1.db
                .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
                .from(schema_1.files)
                .where((0, drizzle_orm_1.eq)(schema_1.files.status, 'failed'));
            if (failedUploads?.count > 10) {
                issues.push(`${failedUploads.count} failed uploads detected`);
                recommendations.push('Investigate and cleanup failed uploads');
            }
            // Check for quarantined files
            const [quarantinedFiles] = await connection_1.db
                .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
                .from(schema_1.files)
                .where((0, drizzle_orm_1.eq)(schema_1.files.status, 'quarantined'));
            if (quarantinedFiles?.count > 0) {
                issues.push(`${quarantinedFiles.count} quarantined files detected`);
                recommendations.push('Review and handle quarantined files');
            }
            return {
                status,
                issues,
                recommendations,
                diskUsage: {
                    total: this.maxStorageSize,
                    used: stats.storageUsage.used,
                    available: stats.storageUsage.available,
                    percentage: stats.storageUsage.percentage
                }
            };
        }
        catch (error) {
            const err = error;
            logger_1.logger.error('Error getting storage health:', { error: err });
            return {
                status: 'critical',
                issues: ['Unable to assess storage health'],
                recommendations: ['Check storage service configuration'],
                diskUsage: {
                    total: 0,
                    used: 0,
                    available: 0,
                    percentage: 0
                }
            };
        }
    }
    /**
     * Optimize storage by compressing old files
     */
    async optimizeStorage() {
        try {
            let filesProcessed = 0;
            const spaceReclaimed = 0;
            // Find large image files older than 30 days
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 30);
            const largeFiles = await connection_1.db
                .select()
                .from(schema_1.files)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.files.category, 'image'), (0, drizzle_orm_1.eq)(schema_1.files.status, 'ready'), (0, drizzle_orm_1.lt)(schema_1.files.uploadedAt, cutoffDate), (0, drizzle_orm_1.sql) `${schema_1.files.fileSize} > 1048576` // > 1MB
            ))
                .limit(50);
            for (const file of largeFiles) {
                try {
                    const originalSize = file.fileSize;
                    // This would integrate with ImageProcessingService
                    // For now, just log what would be optimized
                    logger_1.logger.info('Would optimize file', {
                        fileId: file.id,
                        originalSize,
                        path: file.filePath
                    });
                    filesProcessed++;
                    // spaceReclaimed += (originalSize - newSize);
                }
                catch (error) {
                    const err = error;
                    logger_1.logger.warn('Failed to optimize file:', {
                        fileId: file.id,
                        error: err?.message
                    });
                }
            }
            logger_1.logger.info('Storage optimization completed', {
                filesProcessed,
                spaceReclaimed
            });
            return { filesProcessed, spaceReclaimed };
        }
        catch (error) {
            const err = error;
            logger_1.logger.error('Error optimizing storage:', { error: err });
            throw new Error(`Storage optimization failed: ${err?.message}`);
        }
    }
}
exports.StorageService = StorageService;
