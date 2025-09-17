import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { connectDatabase, disconnectDatabase } from '../db/connection';

describe('CSRF Protection (Simplified)', () => {
  let app: ReturnType<typeof Fastify>;
  let csrfToken: string;
  let cookie: string;

  beforeAll(async () => {
    // Create simple Fastify app with only necessary plugins
    app = Fastify({
      logger: { level: 'warn' },
      ignoreTrailingSlash: true,
      trustProxy: true,
    });

    // Connect to database
    await connectDatabase();

    // Register minimal required plugins in correct order
    await app.register(import('../plugins/database'));
    await app.register(import('../plugins/cors'));
    await app.register(import('../plugins/csrf'));
    await app.register(import('../plugins/auth'));

    // Register only the routes we need for testing
    await app.register(import('../routes/auth'), { prefix: '/api/auth' });
    await app.register(import('../routes/students'), { prefix: '/api/students' });

    await app.ready();

    // Register a user
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        prenom: 'Csrf',
        nom: 'User',
        email: 'csrf.simple@test.com',
        dateNaissance: '2015-01-01',
        niveauActuel: 'CP',
        password: 'password12345',
      },
    });

    // Login to get the CSRF token and cookie
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'csrf.simple@test.com',
        password: 'password12345',
      },
    });

    const loginBody = JSON.parse(loginResponse.body);
    csrfToken = loginBody.data.csrfToken;

    // Extract cookies from the response headers
    const cookies = loginResponse.headers['set-cookie'];
    if (Array.isArray(cookies)) {
      cookie = cookies.join('; ');
    } else {
      cookie = cookies as string;
    }
  });

  afterAll(async () => {
    await app.close();
    await disconnectDatabase();
  });

  it('should reject a PUT request without a CSRF token header', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/students/profile',
      headers: { cookie },
      payload: { prenom: 'updated' },
    });

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.code).toBe('CSRF_VALIDATION_FAILED');
  });

  it('should reject a PUT request with an invalid CSRF token', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/students/profile',
      headers: {
        cookie,
        'x-csrf-token': 'invalid-token',
      },
      payload: { prenom: 'updated' },
    });

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.code).toBe('CSRF_VALIDATION_FAILED');
  });

  it('should accept a PUT request with a valid CSRF token and cookie', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/students/profile',
      headers: {
        cookie,
        'x-csrf-token': csrfToken,
      },
      payload: { prenom: 'UpdatedName' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.student.prenom).toBe('UpdatedName');
  });
});