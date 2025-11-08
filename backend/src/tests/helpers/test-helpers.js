"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestHelpers = void 0;
// Test helpers for consistent mocking and setup
const vitest_1 = require("vitest");
class TestHelpers {
    /**
     * Create standardized service mocks
     */
    static createServiceMocks() {
        return {
            auditService: {
                logAction: vitest_1.vi.fn().mockResolvedValue('audit-log-id'),
                queryLogs: vitest_1.vi.fn().mockResolvedValue([]),
                archiveLogs: vitest_1.vi.fn().mockResolvedValue(undefined)
            },
            emailService: {
                sendEmail: vitest_1.vi.fn().mockResolvedValue(undefined),
                sendParentalConsentEmail: vitest_1.vi.fn().mockResolvedValue(undefined),
                sendGDPRVerificationEmail: vitest_1.vi.fn().mockResolvedValue(undefined),
                sendDataExportEmail: vitest_1.vi.fn().mockResolvedValue(undefined),
                verifyConnection: vitest_1.vi.fn().mockResolvedValue(true)
            },
            encryptionService: {
                encryptSensitiveData: vitest_1.vi.fn().mockReturnValue({
                    encrypted: 'encrypted-data',
                    iv: 'iv-value',
                    tag: 'tag-value'
                }),
                decryptSensitiveData: vitest_1.vi.fn().mockReturnValue('decrypted-data'),
                encryptStudentData: vitest_1.vi.fn().mockResolvedValue({
                    encryptedData: 'encrypted-data',
                    iv: 'iv-value',
                    authTag: 'auth-tag',
                    keyId: 'key-id',
                    algorithm: 'aes-256-gcm',
                    version: 1
                }),
                decryptStudentData: vitest_1.vi.fn().mockResolvedValue({}),
                generateSecureToken: vitest_1.vi.fn().mockReturnValue('secure-token-123'),
                generateSHA256Hash: vitest_1.vi.fn().mockReturnValue('hash-value'),
                hashPersonalData: vitest_1.vi.fn().mockReturnValue('hashed-data'),
                generateAnonymousId: vitest_1.vi.fn().mockReturnValue('anon-id'),
                cleanupExpiredKeys: vitest_1.vi.fn().mockResolvedValue(undefined)
            },
            storageService: {
                uploadFile: vitest_1.vi.fn().mockResolvedValue({
                    id: 'file-id',
                    url: 'http://example.com/file.jpg',
                    path: '/uploads/file.jpg'
                }),
                deleteFile: vitest_1.vi.fn().mockResolvedValue(undefined),
                getFileMetadata: vitest_1.vi.fn().mockResolvedValue({}),
                createVariant: vitest_1.vi.fn().mockResolvedValue({})
            },
            fileSecurityService: {
                scanFile: vitest_1.vi.fn().mockResolvedValue({
                    isClean: true,
                    threats: [],
                    scanEngine: 'test-scanner'
                }),
                quarantineFile: vitest_1.vi.fn().mockResolvedValue(undefined),
                validateFileType: vitest_1.vi.fn().mockReturnValue(true),
                checkFileSize: vitest_1.vi.fn().mockReturnValue(true)
            },
            imageProcessingService: {
                processImage: vitest_1.vi.fn().mockResolvedValue({
                    processed: true,
                    variants: []
                }),
                createThumbnail: vitest_1.vi.fn().mockResolvedValue({
                    path: '/thumbnails/thumb.jpg',
                    size: { width: 150, height: 150 }
                }),
                optimizeImage: vitest_1.vi.fn().mockResolvedValue({
                    path: '/optimized/image.jpg',
                    sizeDiff: 50
                })
            }
        };
    }
    /**
     * Create mock database connection
     */
    static createMockDatabase() {
        return {
            select: vitest_1.vi.fn().mockReturnValue({
                from: vitest_1.vi.fn().mockReturnValue({
                    where: vitest_1.vi.fn().mockResolvedValue([])
                })
            }),
            insert: vitest_1.vi.fn().mockReturnValue({
                values: vitest_1.vi.fn().mockResolvedValue([{ id: 1 }])
            }),
            update: vitest_1.vi.fn().mockReturnValue({
                set: vitest_1.vi.fn().mockReturnValue({
                    where: vitest_1.vi.fn().mockResolvedValue([{ id: 1 }])
                })
            }),
            delete: vitest_1.vi.fn().mockReturnValue({
                where: vitest_1.vi.fn().mockResolvedValue([])
            }),
            run: vitest_1.vi.fn().mockResolvedValue(undefined)
        };
    }
    /**
     * Create standardized test data
     */
    static createTestData() {
        return {
            student: {
                id: 1,
                prenom: 'Alice',
                nom: 'Dupont',
                dateNaissance: '2015-03-15',
                niveauActuel: 'CP',
                totalPoints: 150,
                serieJours: 5,
                mascotteType: 'dragon',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            exercise: {
                id: 1,
                titre: 'Addition simple',
                description: 'Apprendre à additionner',
                type: 'CALCUL',
                difficulte: 'FACILE',
                xp: 10,
                configuration: JSON.stringify({ question: '2+3=?', answer: '5' }),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            consentRequest: {
                parentEmail: 'parent@example.com',
                parentName: 'John Parent',
                childName: 'Alice Child',
                childAge: 8,
                consentTypes: ['data_processing', 'educational_tracking'],
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0'
            },
            file: {
                id: 'file-123',
                originalName: 'test-image.jpg',
                filename: 'processed-image.jpg',
                mimetype: 'image/jpeg',
                size: 1024000,
                path: '/uploads/test-image.jpg',
                url: 'http://example.com/uploads/test-image.jpg',
                uploadedBy: 'user-123',
                category: 'image',
                status: 'ready',
                checksum: 'abc123',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        };
    }
    /**
     * Reset all mocks
     */
    static resetMocks() {
        vitest_1.vi.clearAllMocks();
    }
}
exports.TestHelpers = TestHelpers;
