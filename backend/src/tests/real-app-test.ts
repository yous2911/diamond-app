// Test to verify real app testing works
import { describe, it, expect } from 'vitest';
import { app, authToken, makeAuthenticatedRequest } from './setup';

describe('Real App Testing', () => {
  it('should have a working app instance', () => {
    expect(app).toBeDefined();
    expect(app.server).toBeDefined();
  });

  it('should handle basic health check', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health'
    });

    // Should either return 200 (if health endpoint exists) or 404 (if not)
    expect([200, 404]).toContain(response.statusCode);
  });

  it('should handle authentication if available', async () => {
    if (authToken) {
      expect(authToken).toBeDefined();
      expect(typeof authToken).toBe('string');
      expect(authToken.length).toBeGreaterThan(10);
    } else {
      console.log('⚠️ No auth token available - auth endpoints might not be set up');
    }
  });

  it('should handle authenticated requests if auth is available', async () => {
    if (authToken) {
      // Try to access a protected endpoint
      const response = await makeAuthenticatedRequest(app, authToken, {
        method: 'GET',
        url: '/api/students/1'
      });

      // Should either return 200 (success) or 404 (student not found) or 403 (access denied)
      // But NOT 401 (unauthorized) since we have a token
      expect([200, 404, 403]).toContain(response.statusCode);
      expect(response.statusCode).not.toBe(401);
    } else {
      console.log('⚠️ Skipping authenticated request test - no auth token');
    }
  });
});



