// MINIMAL TEST SETUP - Only mock external dependencies
// This allows tests to run against real application logic

import { vi } from 'vitest';

// Only mock external file system operations
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  unlink: vi.fn(),
  mkdir: vi.fn(),
  access: vi.fn()
}));

// Only mock external HTTP requests
vi.mock('node-fetch', () => ({
  default: vi.fn()
}));

// Only mock external email service (if using external provider)
vi.mock('nodemailer', () => ({
  createTransport: vi.fn(() => ({
    sendMail: vi.fn().mockResolvedValue({ messageId: 'mock-message-id' })
  }))
}));

// Only mock external image processing (if using external service)
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    png: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-image-data')),
    toFile: vi.fn().mockResolvedValue({ size: 1024 })
  }))
}));

// Only mock external crypto operations that require system-level access
vi.mock('crypto', () => ({
  ...vi.importActual('crypto'),
  randomBytes: vi.fn(() => Buffer.from('mock-random-bytes')),
  createHash: vi.fn(() => ({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn(() => 'mock-hash')
  }))
}));

// Export test utilities
export const createTestApp = async () => {
  const { build } = await import('../app-test');
  return await build();
};

export const createTestUser = async (app: any) => {
  // Create a real test user in the database
  const userData = {
    prenom: 'Test',
    nom: 'User',
    email: 'test@example.com',
    motDePasse: 'password123',
    niveauActuel: 'CP'
  };
  
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: userData
  });
  
  if (response.statusCode === 201) {
    const user = JSON.parse(response.body);
    return user;
  }
  
  // If registration fails, try to login
  const loginResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      identifiant: userData.email,
      motDePasse: userData.motDePasse
    }
  });
  
  if (loginResponse.statusCode === 200) {
    return JSON.parse(loginResponse.body);
  }
  
  throw new Error('Failed to create test user');
};

export const authenticateRequest = async (app: any, user: any) => {
  const loginResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      identifiant: user.email,
      motDePasse: 'password123'
    }
  });
  
  if (loginResponse.statusCode === 200) {
    const loginData = JSON.parse(loginResponse.body);
    return loginData.token;
  }
  
  throw new Error('Failed to authenticate user');
};



