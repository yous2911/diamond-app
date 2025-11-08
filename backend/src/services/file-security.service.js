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
exports.FileSecurityService = void 0;
const logger_1 = require("../utils/logger");
const upload_types_1 = require("../types/upload.types");
class FileSecurityService {
    constructor(options = {}) {
        this.options = options;
        this.dangerousExtensions = [
            '.exe', '.bat', '.cmd', '.com', '.scr', '.pif', '.vbs', '.js', '.jar',
            '.app', '.deb', '.pkg', '.dmg', '.run', '.msi', '.ps1', '.sh'
        ];
        this.suspiciousPatterns = [
            // Script injection patterns
            /<script[^>]*>/i,
            /javascript:/i,
            /data:.*base64/i,
            /vbscript:/i,
            /onclick|onload|onerror/i,
            // File inclusion patterns
            /\.\.[\/\\]/g, // Path traversal
            /\binclude\s*\(/i,
            /\brequire\s*\(/i,
            // SQL injection patterns
            /union\s+select/i,
            /\bselect\s.*from/i,
            /\bdrop\s+table/i,
            // Command injection patterns
            /\beval\s*\(/i,
            /\bexec\s*\(/i,
            /\bsystem\s*\(/i,
            // Malware signatures (simplified)
            /X5O!P%@AP\[4\\PZX54\(P\^\)7CC\)7\}\$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!\$H\+H\*/,
        ];
        this.maliciousHeaders = [
            'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR', // EICAR test file
            'MZ', // Windows PE
            '\x7fELF', // Linux ELF
            '\xfe\xed\xfa', // macOS Mach-O
            '#!/bin/sh', // Shell script
            '#!/bin/bash', // Bash script
            'PK\x03\x04' // ZIP (potential executable)
        ];
        this.defaultOptions = {
            enableVirusScanning: true,
            enableContentAnalysis: true,
            enableMetadataScanning: true,
            quarantineThreats: true,
            maxScanTimeMs: 30000 // 30 seconds
        };
        this.options = { ...this.defaultOptions, ...options };
    }
    /**
     * Comprehensive file validation
     */
    async validateFile(buffer, originalName, declaredMimeType) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };
        try {
            // 1. Basic filename validation
            this.validateFilename(originalName, result);
            // 2. File size validation
            this.validateFileSize(buffer, declaredMimeType, result);
            // 3. MIME type validation
            await this.validateMimeType(buffer, declaredMimeType, result);
            // 4. File content validation
            await this.validateFileContent(buffer, result);
            // 5. Metadata validation
            await this.validateMetadata(buffer, declaredMimeType, result);
            // 6. Security pattern scanning
            this.scanForMaliciousPatterns(buffer, result);
            // 7. File structure validation
            await this.validateFileStructure(buffer, declaredMimeType, result);
            result.isValid = result.errors.length === 0;
        }
        catch (error) {
            logger_1.logger.error('File validation error:', error);
            result.isValid = false;
            result.errors.push(`Validation failed: ${error.message}`);
        }
        return result;
    }
    /**
     * Perform comprehensive security scan
     */
    async performSecurityScan(filePath, buffer, options = {}) {
        const scanOptions = { ...this.defaultOptions, ...this.options, ...options };
        const startTime = Date.now();
        const result = {
            isClean: true,
            threats: [],
            scanEngine: 'file-security-service',
            scanDate: new Date(),
            quarantined: false
        };
        try {
            // Timeout protection
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Security scan timeout')), scanOptions.maxScanTimeMs);
            });
            const scanPromise = this.executeScan(buffer, scanOptions, result);
            await Promise.race([scanPromise, timeoutPromise]);
            // Determine if file should be quarantined
            if (result.threats.length > 0 && scanOptions.quarantineThreats) {
                result.quarantined = true;
                result.isClean = false;
            }
            const scanTime = Date.now() - startTime;
            logger_1.logger.info('Security scan completed', {
                filePath,
                scanTime,
                threats: result.threats.length,
                quarantined: result.quarantined
            });
        }
        catch (error) {
            logger_1.logger.error('Security scan failed:', error);
            result.isClean = false;
            result.threats.push(`Scan error: ${error.message}`);
        }
        return result;
    }
    /**
     * Execute the actual security scan
     */
    async executeScan(buffer, options, result) {
        // 1. Virus scanning (mock implementation)
        if (options.enableVirusScanning) {
            await this.performVirusScan(buffer, result);
        }
        // 2. Content analysis
        if (options.enableContentAnalysis) {
            this.analyzeFileContent(buffer, result);
        }
        // 3. Metadata scanning
        if (options.enableMetadataScanning) {
            await this.scanMetadata(buffer, result);
        }
        // 4. Behavioral analysis
        this.performBehavioralAnalysis(buffer, result);
    }
    /**
     * Mock virus scanning (replace with actual AV engine)
     */
    async performVirusScan(buffer, result) {
        // Check for EICAR test signature
        const content = buffer.toString('ascii', 0, Math.min(1024, buffer.length));
        if (content.includes('EICAR-STANDARD-ANTIVIRUS-TEST-FILE')) {
            result.threats.push('EICAR test virus detected');
            return;
        }
        // Check for suspicious file headers
        const header = buffer.toString('ascii', 0, Math.min(16, buffer.length));
        for (const maliciousHeader of this.maliciousHeaders) {
            if (header.startsWith(maliciousHeader)) {
                result.threats.push(`Suspicious file header: ${maliciousHeader}`);
            }
        }
        // Simulate external virus scanner call
        // In production, integrate with ClamAV, Windows Defender, or cloud AV APIs
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate scan time
    }
    /**
     * Analyze file content for threats
     */
    analyzeFileContent(buffer, result) {
        const content = buffer.toString('utf-8', 0, Math.min(10240, buffer.length)); // First 10KB
        for (const pattern of this.suspiciousPatterns) {
            if (pattern.test(content)) {
                result.threats.push(`Suspicious content pattern detected: ${pattern.source}`);
            }
        }
        // Check for embedded files or polyglots
        if (this.detectEmbeddedFiles(buffer)) {
            result.threats.push('Embedded file detected (potential polyglot attack)');
        }
        // Check for excessive entropy (could indicate encrypted/compressed malware)
        const entropy = this.calculateEntropy(buffer);
        if (entropy > 7.5) {
            result.threats.push(`High entropy detected (${entropy.toFixed(2)}) - possible encrypted content`);
        }
    }
    /**
     * Scan file metadata for threats
     */
    async scanMetadata(buffer, result) {
        try {
            const { fileTypeFromBuffer } = await Promise.resolve().then(() => __importStar(require('file-type')));
            const fileType = await fileTypeFromBuffer(buffer);
            if (fileType) {
                // Check for file type mismatch attacks
                const header = buffer.toString('hex', 0, 16);
                if (this.isFileTypeMismatch(fileType.mime, header)) {
                    result.threats.push('File type mismatch detected - potential file masquerading');
                }
                // Check for dangerous file types disguised as safe ones
                if (this.isDangerousFileTypeDisguised(fileType)) {
                    result.threats.push(`Dangerous file type disguised as ${fileType.mime}`);
                }
            }
        }
        catch (error) {
            logger_1.logger.warn('Metadata scanning failed:', error.message);
        }
    }
    /**
     * Perform behavioral analysis
     */
    performBehavioralAnalysis(buffer, result) {
        // Check for suspicious file size patterns
        if (buffer.length < 100) {
            result.threats.push('Suspiciously small file size');
        }
        // Check for null bytes (potential path traversal or injection)
        if (buffer.includes(0x00)) {
            result.threats.push('Null bytes detected in file content');
        }
        // Check for repeating patterns (could indicate padding attacks)
        if (this.hasExcessiveRepeatingPatterns(buffer)) {
            result.threats.push('Excessive repeating patterns detected');
        }
    }
    /**
     * Validation helper methods
     */
    validateFilename(filename, result) {
        // Check for dangerous extensions
        const extension = filename.toLowerCase().split('.').pop();
        if (extension && this.dangerousExtensions.includes(`.${extension}`)) {
            result.errors.push(`Dangerous file extension: .${extension}`);
        }
        // Check for suspicious filename patterns
        if (/\.(exe|bat|cmd)\.txt$/i.test(filename)) {
            result.errors.push('Suspicious filename pattern detected');
        }
        // Check for path traversal in filename
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            result.errors.push('Invalid characters in filename');
        }
        // Check filename length
        if (filename.length > 255) {
            result.errors.push('Filename too long');
        }
        // Check for non-printable characters
        if (!/^[\w\s.-]+$/.test(filename)) {
            result.warnings.push('Filename contains special characters');
        }
    }
    validateFileSize(buffer, mimetype, result) {
        const fileSize = buffer.length;
        const maxSize = this.getMaxSizeForMimeType(mimetype);
        if (fileSize > maxSize) {
            result.errors.push(`File size (${fileSize}) exceeds maximum allowed (${maxSize})`);
        }
        if (fileSize === 0) {
            result.errors.push('Empty file not allowed');
        }
    }
    async validateMimeType(buffer, declaredMimeType, result) {
        try {
            const { fileTypeFromBuffer } = await Promise.resolve().then(() => __importStar(require('file-type')));
            const detectedType = await fileTypeFromBuffer(buffer);
            if (detectedType) {
                result.detectedMimeType = detectedType.mime;
                result.actualFileType = detectedType.ext;
                // Check if declared type matches detected type
                if (declaredMimeType !== detectedType.mime) {
                    result.warnings.push(`MIME type mismatch: declared as ${declaredMimeType}, detected as ${detectedType.mime}`);
                }
                // Validate that detected type is allowed
                if (!this.isMimeTypeAllowed(detectedType.mime)) {
                    result.errors.push(`File type not allowed: ${detectedType.mime}`);
                }
            }
            else {
                result.warnings.push('Could not detect file type from content');
            }
            // Validate declared MIME type is allowed
            if (!this.isMimeTypeAllowed(declaredMimeType)) {
                result.errors.push(`Declared MIME type not allowed: ${declaredMimeType}`);
            }
        }
        catch (error) {
            result.warnings.push(`MIME type detection failed: ${error.message}`);
        }
    }
    async validateFileContent(buffer, result) {
        // Check for executable code in non-executable files
        if (this.containsExecutableCode(buffer)) {
            result.errors.push('File contains executable code');
        }
        // Check for script injections
        const content = buffer.toString('utf-8', 0, Math.min(1024, buffer.length));
        for (const pattern of this.suspiciousPatterns) {
            if (pattern.test(content)) {
                result.warnings.push(`Suspicious pattern detected: ${pattern.source.substring(0, 50)}`);
            }
        }
    }
    async validateMetadata(buffer, mimetype, result) {
        if (mimetype.startsWith('image/')) {
            await this.validateImageMetadata(buffer, result);
        }
    }
    async validateImageMetadata(buffer, result) {
        try {
            // Basic image validation would go here
            // This is a simplified check - in production, use libraries like sharp
            const header = buffer.toString('hex', 0, 16);
            // Check for valid image headers
            const validImageHeaders = [
                'ffd8ff', // JPEG
                '89504e47', // PNG
                '47494638', // GIF
                '52494646', // WEBP
            ];
            const hasValidHeader = validImageHeaders.some(validHeader => header.toLowerCase().startsWith(validHeader));
            if (!hasValidHeader) {
                result.warnings.push('Invalid image file header');
            }
        }
        catch (error) {
            result.warnings.push(`Image metadata validation failed: ${error.message}`);
        }
    }
    async validateFileStructure(buffer, mimetype, result) {
        // Validate file structure based on type
        if (mimetype.startsWith('image/')) {
            this.validateImageStructure(buffer, result);
        }
        else if (mimetype === 'application/pdf') {
            this.validatePDFStructure(buffer, result);
        }
    }
    validateImageStructure(buffer, result) {
        // Basic image structure validation
        const header = buffer.toString('hex', 0, 4);
        const footer = buffer.toString('hex', -4);
        // JPEG validation
        if (header.startsWith('ffd8') && !footer.includes('ffd9')) {
            result.warnings.push('JPEG file appears to be truncated');
        }
        // PNG validation
        if (header.startsWith('8950') && !buffer.includes(Buffer.from('IEND', 'ascii'))) {
            result.warnings.push('PNG file appears to be incomplete');
        }
    }
    validatePDFStructure(buffer, result) {
        const content = buffer.toString('ascii', 0, 1024);
        if (!content.startsWith('%PDF-')) {
            result.errors.push('Invalid PDF header');
        }
        // Check for suspicious PDF features
        if (content.includes('/JavaScript') || content.includes('/JS')) {
            result.warnings.push('PDF contains JavaScript');
        }
        if (content.includes('/Launch') || content.includes('/GoToE')) {
            result.warnings.push('PDF contains potentially dangerous actions');
        }
    }
    /**
     * Security analysis helper methods
     */
    detectEmbeddedFiles(buffer) {
        // Look for multiple file signatures in the same buffer
        const signatures = [
            'ffd8ff', // JPEG
            '89504e47', // PNG
            '504b0304', // ZIP
            '25504446', // PDF
            'ffd8ffe0' // JPEG variant
        ];
        let signatureCount = 0;
        const bufferHex = buffer.toString('hex');
        for (const sig of signatures) {
            const regex = new RegExp(sig, 'gi');
            const matches = bufferHex.match(regex);
            if (matches) {
                signatureCount += matches.length;
            }
        }
        return signatureCount > 1;
    }
    calculateEntropy(buffer) {
        const frequencies = {};
        for (let i = 0; i < buffer.length; i++) {
            const byte = buffer[i];
            frequencies[byte] = (frequencies[byte] || 0) + 1;
        }
        let entropy = 0;
        const length = buffer.length;
        for (const freq of Object.values(frequencies)) {
            const probability = freq / length;
            entropy -= probability * Math.log2(probability);
        }
        return entropy;
    }
    isFileTypeMismatch(detectedMime, header) {
        // Check for common file type spoofing attempts
        const commonMismatches = [
            { mime: 'image/jpeg', expectedHeader: 'ffd8ff' },
            { mime: 'image/png', expectedHeader: '89504e47' },
            { mime: 'application/pdf', expectedHeader: '25504446' }
        ];
        for (const mismatch of commonMismatches) {
            if (detectedMime === mismatch.mime && !header.startsWith(mismatch.expectedHeader)) {
                return true;
            }
        }
        return false;
    }
    isDangerousFileTypeDisguised(fileType) {
        // Check for dangerous file types that might be disguised
        const dangerousTypes = ['application/x-msdownload', 'application/x-executable'];
        return dangerousTypes.includes(fileType.mime);
    }
    hasExcessiveRepeatingPatterns(buffer) {
        const sampleSize = Math.min(1024, buffer.length);
        const sample = buffer.subarray(0, sampleSize);
        // Check for patterns that repeat more than 50% of the sample
        for (let patternLength = 1; patternLength <= 16; patternLength++) {
            for (let i = 0; i <= sampleSize - patternLength * 2; i++) {
                const pattern = sample.subarray(i, i + patternLength);
                let repeatCount = 1;
                for (let j = i + patternLength; j <= sampleSize - patternLength; j += patternLength) {
                    if (sample.subarray(j, j + patternLength).equals(pattern)) {
                        repeatCount++;
                    }
                    else {
                        break;
                    }
                }
                if (repeatCount * patternLength > sampleSize * 0.5) {
                    return true;
                }
            }
        }
        return false;
    }
    containsExecutableCode(buffer) {
        const executableSignatures = [
            'MZ', // Windows PE
            '\x7fELF', // Linux ELF
            '\xfe\xed\xfa', // macOS Mach-O
            '\xca\xfe\xba\xbe' // Java class file
        ];
        const header = buffer.toString('ascii', 0, 4);
        return executableSignatures.some(sig => header.startsWith(sig));
    }
    isMimeTypeAllowed(mimetype) {
        const allAllowedTypes = [
            ...upload_types_1.ALLOWED_IMAGE_TYPES,
            ...upload_types_1.ALLOWED_VIDEO_TYPES,
            ...upload_types_1.ALLOWED_AUDIO_TYPES,
            ...upload_types_1.ALLOWED_DOCUMENT_TYPES
        ];
        return allAllowedTypes.includes(mimetype);
    }
    getMaxSizeForMimeType(mimetype) {
        if (upload_types_1.ALLOWED_IMAGE_TYPES.includes(mimetype)) {
            return upload_types_1.MAX_FILE_SIZES.image;
        }
        else if (upload_types_1.ALLOWED_VIDEO_TYPES.includes(mimetype)) {
            return upload_types_1.MAX_FILE_SIZES.video;
        }
        else if (upload_types_1.ALLOWED_AUDIO_TYPES.includes(mimetype)) {
            return upload_types_1.MAX_FILE_SIZES.audio;
        }
        else if (upload_types_1.ALLOWED_DOCUMENT_TYPES.includes(mimetype)) {
            return upload_types_1.MAX_FILE_SIZES.document;
        }
        return upload_types_1.MAX_FILE_SIZES.default;
    }
    scanForMaliciousPatterns(buffer, result) {
        const content = buffer.toString('utf-8', 0, Math.min(10240, buffer.length));
        for (const pattern of this.suspiciousPatterns) {
            if (pattern.test(content)) {
                result.warnings.push(`Suspicious pattern detected: ${pattern.source.substring(0, 50)}`);
            }
        }
    }
}
exports.FileSecurityService = FileSecurityService;
