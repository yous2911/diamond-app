// Authentication helper for real app testing
import { FastifyInstance, InjectOptions } from 'fastify';

export interface TestUserCredentials {
  identifiant: string;
  motDePasse: string;
}

export async function getAuthToken(app: FastifyInstance, userCredentials: TestUserCredentials): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: userCredentials,
  });

  if (response.statusCode !== 200) {
    throw new Error(`Failed to log in test user. Status: ${response.statusCode}, Body: ${response.body}`);
  }

  const loginData = JSON.parse(response.body);
  if (!loginData.token) {
    throw new Error('No token returned from login response');
  }

  return loginData.token;
}

export async function createTestUser(app: FastifyInstance, userData: any): Promise<any> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: userData,
  });

  if (response.statusCode === 201) {
    return JSON.parse(response.body);
  }

  // If registration fails, the user might already exist
  throw new Error(`Failed to create test user. Status: ${response.statusCode}, Body: ${response.body}`);
}

export async function makeAuthenticatedRequest(
  app: FastifyInstance, 
  token: string, 
  options: {
    method: InjectOptions['method'];
    url: string;
    payload?: any;
    headers?: Record<string, string>;
  }
) {
  return await app.inject({
    method: options.method,
    url: options.url,
    payload: options.payload,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}




