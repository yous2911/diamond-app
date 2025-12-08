// src/services/consent.service.ts
import { eq, and } from 'drizzle-orm';
import { getDatabase } from '../db/connection';
import { gdprConsentRequests, type NewGdprConsentRequest, type GdprConsentRequest } from '../db/schema';
import crypto from 'crypto';

class ConsentService {
  private db = getDatabase();

  async submitConsentRequest(data: {
    studentId: number;
    requestType: 'DATA_ACCESS' | 'DATA_DELETION' | 'DATA_PORTABILITY' | 'CONSENT_WITHDRAWAL';
    parentEmail: string;
    requestDetails?: Record<string, any>;
  }): Promise<GdprConsentRequest> {
    const requestToken = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Expire dans 30 jours

    const newRequest: NewGdprConsentRequest = {
      studentId: data.studentId,
      consentType: data.requestType,
      requestType: data.requestType,
      requestToken,
      expiresAt: expiresAt,
      status: 'PENDING',
      createdAt: new Date()
    };

    await this.db.insert(gdprConsentRequests).values(newRequest);
    // For MySQL, we need to fetch the inserted record separately
    const result = await this.db.select().from(gdprConsentRequests).where(eq(gdprConsentRequests.requestToken, requestToken)).limit(1);
    const consent = result[0];
    if (!consent) {
      throw new Error('Failed to create consent request');
    }
    return consent;
  }

  async findConsentByToken(token: string): Promise<GdprConsentRequest | null> {
    const results = await this.db
      .select()
      .from(gdprConsentRequests)
      .where(eq(gdprConsentRequests.requestToken, token))
      .limit(1);

    if (results.length === 0) return null;
    
    const consent = results[0];
    if (!consent) return null;
    const now = new Date();
    const expiresAt = consent.expiresAt ? new Date(consent.expiresAt) : new Date(0);
    
    // Check if token is expired
    if (expiresAt < now) return null;
    
    return consent;
  }

  async updateConsentStatus(requestId: number, status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'): Promise<void> {
    await this.db
      .update(gdprConsentRequests)
      .set({ 
        status, 
        processedAt: new Date()
      })
      .where(eq(gdprConsentRequests.id, requestId));
  }

  async getConsentsByStudent(studentId: number): Promise<GdprConsentRequest[]> {
    return await this.db
      .select()
      .from(gdprConsentRequests)
      .where(eq(gdprConsentRequests.studentId, studentId))
      .orderBy(gdprConsentRequests.createdAt);
  }

  async cleanupExpiredRequests(): Promise<number> {
    // Get all pending requests
    const pendingRequests = await this.db
      .select()
      .from(gdprConsentRequests)
      .where(eq(gdprConsentRequests.status, 'PENDING'));
    
    const now = new Date();
    let deletedCount = 0;
    
    // Check each request and delete if expired
    for (const request of pendingRequests) {
      const expiresAt = request.expiresAt ? new Date(request.expiresAt) : new Date(0);
      if (expiresAt < now) {
        await this.db
          .delete(gdprConsentRequests)
          .where(eq(gdprConsentRequests.id, request.id));
        deletedCount++;
      }
    }
    
    return deletedCount;
  }
}

export const consentService = new ConsentService(); 