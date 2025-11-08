"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.consentService = void 0;
// src/services/consent.service.ts
const drizzle_orm_1 = require("drizzle-orm");
const connection_1 = require("../db/connection");
const schema_1 = require("../db/schema");
const crypto_1 = __importDefault(require("crypto"));
class ConsentService {
    constructor() {
        this.db = (0, connection_1.getDatabase)();
    }
    async submitConsentRequest(data) {
        const requestToken = crypto_1.default.randomBytes(64).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // Expire dans 30 jours
        const newRequest = {
            studentId: data.studentId,
            consentType: data.requestType,
            requestType: data.requestType,
            requestToken,
            expiresAt: expiresAt,
            status: 'PENDING',
            createdAt: new Date()
        };
        await this.db.insert(schema_1.gdprConsentRequests).values(newRequest);
        // For MySQL, we need to fetch the inserted record separately
        const result = await this.db.select().from(schema_1.gdprConsentRequests).where((0, drizzle_orm_1.eq)(schema_1.gdprConsentRequests.requestToken, requestToken)).limit(1);
        return result[0];
    }
    async findConsentByToken(token) {
        const results = await this.db
            .select()
            .from(schema_1.gdprConsentRequests)
            .where((0, drizzle_orm_1.eq)(schema_1.gdprConsentRequests.requestToken, token))
            .limit(1);
        if (results.length === 0)
            return null;
        const consent = results[0];
        const now = new Date();
        const expiresAt = new Date(consent.expiresAt);
        // Check if token is expired
        if (expiresAt < now)
            return null;
        return consent;
    }
    async updateConsentStatus(requestId, status) {
        await this.db
            .update(schema_1.gdprConsentRequests)
            .set({
            status,
            processedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.gdprConsentRequests.id, requestId));
    }
    async getConsentsByStudent(studentId) {
        return await this.db
            .select()
            .from(schema_1.gdprConsentRequests)
            .where((0, drizzle_orm_1.eq)(schema_1.gdprConsentRequests.studentId, studentId))
            .orderBy(schema_1.gdprConsentRequests.createdAt);
    }
    async cleanupExpiredRequests() {
        // Get all pending requests
        const pendingRequests = await this.db
            .select()
            .from(schema_1.gdprConsentRequests)
            .where((0, drizzle_orm_1.eq)(schema_1.gdprConsentRequests.status, 'PENDING'));
        const now = new Date();
        let deletedCount = 0;
        // Check each request and delete if expired
        for (const request of pendingRequests) {
            const expiresAt = new Date(request.expiresAt);
            if (expiresAt < now) {
                await this.db
                    .delete(schema_1.gdprConsentRequests)
                    .where((0, drizzle_orm_1.eq)(schema_1.gdprConsentRequests.id, request.id));
                deletedCount++;
            }
        }
        return deletedCount;
    }
}
exports.consentService = new ConsentService();
