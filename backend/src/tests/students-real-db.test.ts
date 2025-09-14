// src/tests/students-real-db.test.ts - Student tests with REAL database
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildRealApp } from '../app-real';
import type { FastifyInstance } from 'fastify';
import { connectDatabase, disconnectDatabase, db } from '../db/connection';
import { students } from '../db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

describe('Students Routes - REAL Database', () => {
  let app: FastifyInstance;
  let authToken: string;
  let testStudentId: number;
  const testStudentEmail = 'test-real-db@integration.com';

  beforeAll(async () => {
    // Connect to real database
    await connectDatabase();
    
    // Test database connection
    try {
      const [testResult] = await db.select().from(students).limit(1);
      console.log('✅ Database connection verified - found students:', testResult ? 1 : 0);
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
    }
    
    // Build app with REAL database (no mocks)
    app = await buildRealApp();
    await app.ready();
    
    console.log('✅ Real database connection established for student tests');
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    await disconnectDatabase();
  });

  beforeEach(async () => {
    // Clean up any existing test student
    await db.delete(students).where(eq(students.email, testStudentEmail));
    
    // Create a fresh test student in real database
    const hashedPassword = await bcrypt.hash('test-password-123456', 10);
    
    try {
      const insertResult = await db.insert(students).values({
        prenom: 'Alice',
        nom: 'Dupont',
        email: testStudentEmail,
        passwordHash: hashedPassword, // Schema mapping handles this
        dateNaissance: new Date('2015-05-15'),
        niveauActuel: 'CP',
        niveauScolaire: 'CP',
        totalPoints: 100,
        serieJours: 1,
        mascotteType: 'dragon'
      });
      
      testStudentId = insertResult[0].insertId as number;
      console.log(`✅ Created test student with ID: ${testStudentId}`);
      
      // Verify the student was actually created
      const verifyResult = await db.select().from(students).where(eq(students.id, testStudentId));
      console.log('✅ Verification - student exists in database:', verifyResult.length > 0);
      if (verifyResult.length > 0) {
        console.log('✅ Student data:', { 
          id: verifyResult[0].id, 
          email: verifyResult[0].email, 
          hasPassword: !!verifyResult[0].passwordHash 
        });
      }
    } catch (error) {
      console.error('❌ Failed to create test student:', error);
      throw error;
    }

    // Login with real authentication to get valid token
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: testStudentEmail,
        password: 'test-password-123456'
      }
    });

    console.log('Login response status:', loginResponse.statusCode);
    console.log('Login response body:', loginResponse.body);

    expect(loginResponse.statusCode).toBe(200);
    const loginData = JSON.parse(loginResponse.body);
    expect(loginData.success).toBe(true);
    expect(loginData.data.token).toBeDefined();
    authToken = loginData.data.token;
    
    console.log('✅ Authentication successful, token obtained');
  });

  describe('GET /api/students/:id', () => {
    it('should get real student data from database', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/students/${testStudentId}`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      console.log('Get student response status:', response.statusCode);
      console.log('Get student response body:', response.body);

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.prenom).toBe('Alice');
      expect(data.data.nom).toBe('Dupont');
      expect(data.data.id).toBe(testStudentId);
      expect(data.data.email).toBe(testStudentEmail);
    });

    it('should require authentication for real database access', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/students/${testStudentId}`
      });

      expect(response.statusCode).toBe(401);
    });

    it('should prevent access to other students in real database', async () => {
      // Try to access a different student ID (999 should not exist)
      const response = await app.inject({
        method: 'GET',
        url: '/api/students/999',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(403);
    });

    it('should validate student ID format with real database', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/students/invalid',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/students/:id/recommendations', () => {
    it('should get exercise recommendations from real database', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/students/${testStudentId}/recommendations?limit=5`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      console.log('Recommendations response status:', response.statusCode);
      console.log('Recommendations response body:', response.body);

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeLessThanOrEqual(5);
    });

    it('should handle limit parameter with real database', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/students/${testStudentId}/recommendations?limit=3`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.data.length).toBeLessThanOrEqual(3);
    });

    it('should validate limit parameter with real database', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/students/${testStudentId}/recommendations?limit=invalid`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/students/:id/attempts', () => {
    it('should submit exercise attempt to real database', async () => {
      const attempt = {
        exerciseId: 1,
        attempt: {
          reponse: 'Test answer',
          reussi: true,
          tempsSecondes: 30,
          aidesUtilisees: 0
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: `/api/students/${testStudentId}/attempts`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: attempt
      });

      console.log('Submit attempt response status:', response.statusCode);
      console.log('Submit attempt response body:', response.body);

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.pointsGagnes).toBeGreaterThanOrEqual(0);
    });

    it('should validate attempt data with real database', async () => {
      const invalidAttempt = {
        exerciseId: 1,
        attempt: {
          reponse: '',
          reussi: 'invalid',
          tempsSecondes: -1
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: `/api/students/${testStudentId}/attempts`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: invalidAttempt
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle missing required fields with real database', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/students/${testStudentId}/attempts`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {}
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/students/:id/progress', () => {
    it('should get student progress from real database', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/students/${testStudentId}/progress`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      console.log('Progress response status:', response.statusCode);
      console.log('Progress response body:', response.body);

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should filter by exercise IDs with real database', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/students/${testStudentId}/progress?exercices=1,2,3`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
    });
  });
});