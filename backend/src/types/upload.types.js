"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_UPLOAD_CONFIG = exports.THUMBNAIL_SIZES = exports.MAX_FILE_SIZES = exports.ALLOWED_DOCUMENT_TYPES = exports.ALLOWED_AUDIO_TYPES = exports.ALLOWED_VIDEO_TYPES = exports.ALLOWED_IMAGE_TYPES = void 0;
// Validation schemas
exports.ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml'
];
exports.ALLOWED_VIDEO_TYPES = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo'
];
exports.ALLOWED_AUDIO_TYPES = [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp3',
    'audio/aac'
];
exports.ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv'
];
exports.MAX_FILE_SIZES = {
    image: 10 * 1024 * 1024, // 10MB
    video: 100 * 1024 * 1024, // 100MB
    audio: 50 * 1024 * 1024, // 50MB
    document: 25 * 1024 * 1024, // 25MB
    default: 10 * 1024 * 1024 // 10MB
};
exports.THUMBNAIL_SIZES = [
    { name: 'small', width: 150, height: 150, fit: 'cover', format: 'webp', quality: 80 },
    { name: 'medium', width: 300, height: 300, fit: 'cover', format: 'webp', quality: 85 },
    { name: 'large', width: 600, height: 600, fit: 'contain', format: 'webp', quality: 90 }
];
exports.DEFAULT_UPLOAD_CONFIG = {
    maxFileSize: exports.MAX_FILE_SIZES.default,
    allowedMimeTypes: [
        ...exports.ALLOWED_IMAGE_TYPES,
        ...exports.ALLOWED_VIDEO_TYPES,
        ...exports.ALLOWED_AUDIO_TYPES,
        ...exports.ALLOWED_DOCUMENT_TYPES
    ],
    allowedExtensions: [
        '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg',
        '.mp4', '.webm', '.mov', '.avi',
        '.mp3', '.wav', '.ogg', '.aac',
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv'
    ],
    uploadPath: 'uploads',
    enableImageProcessing: true,
    enableVirusScanning: true,
    requireAuthentication: true,
    maxFilesPerUpload: 10,
    thumbnailSizes: exports.THUMBNAIL_SIZES,
    compressionQuality: 85,
    watermarkEnabled: false
};
