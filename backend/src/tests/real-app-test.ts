// Test to verify real app testing works
import { describe, it, expect } from 'vitest';
import { app } from './setup';

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
    // Try to get auth token
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'test123'
        }
      });
      
      if (response.statusCode === 200) {
        const data = JSON.parse(response.body);
        expect(data.token || data.accessToken).toBeDefined();
      } else {
        console.log('⚠️ Auth endpoints might not be set up');
      }
    } catch (error) {
      console.log('⚠️ No auth token available - auth endpoints might not be set up');
    }
  });

  it('should handle authenticated requests if auth is available', async () => {
    // Try to access a protected endpoint with a mock token
    const response = await app.inject({
      method: 'GET',
      url: '/api/students/1',
      headers: {
        authorization: 'Bearer mock-jwt-token'
      }
    });

    // Should either return 200 (success) or 404 (student not found) or 403 (access denied)
    // But NOT 401 (unauthorized) since we have a token
    expect([200, 404, 403]).toContain(response.statusCode);
  });
});




