import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildRealApp } from '../app-real';
import { disconnectDatabase } from '../db/connection';

describe('CSRF Protection', () => {
  let app: FastifyInstance;
  let csrfToken: string;
  let cookie: string;

  beforeAll(async () => {
    app = await buildRealApp();
    await app.ready();

    // Register a user
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        prenom: 'Csrf',
        nom: 'User',
        email: 'csrf.user@test.com',
        password: 'password12345',
        dateNaissance: '2015-01-01',
        niveauActuel: 'CP',
      },
    });

    // Login to get the CSRF token and cookie
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'csrf.user@test.com',
        password: 'password12345',
      },
    });

    const loginBody = JSON.parse(loginResponse.body);
    csrfToken = loginBody.data.csrfToken;

    // Extract all cookies from the response headers
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

  it('should reject a POST request without a CSRF token header', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/students/profile', // A protected route
      headers: { cookie },
      payload: { prenom: 'updated' },
    });

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.code).toBe('CSRF_VALIDATION_FAILED');
  });

  it('should reject a POST request with an invalid CSRF token', async () => {
    const response = await app.inject({
      method: 'POST',
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

  it('should reject a POST request with a valid CSRF token but missing cookie', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/students/profile',
      headers: {
        'x-csrf-token': csrfToken,
      },
      payload: { prenom: 'updated' },
    });

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.code).toBe('CSRF_VALIDATION_FAILED');
  });

  it('should accept a POST request with a valid CSRF token and cookie', async () => {
    const response = await app.inject({
      method: 'PUT', // Using PUT for profile update
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

  it('should accept a multipart/form-data POST request with a valid CSRF token in the body', async () => {
    const { default: FormData } = await import('form-data');
    const form = new FormData();
    form.append('_csrf', csrfToken);
    form.append('file', Buffer.from('test file content'), 'test.txt');

    const response = await app.inject({
      method: 'POST',
      url: '/api/upload',
      headers: {
        ...form.getHeaders(),
        cookie,
      },
      payload: form,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
  });
});
