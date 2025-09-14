// src/app-real.ts - App builder for real database tests (NO MOCKS)

import Fastify from 'fastify';
import { ServiceFactory } from './services/service-factory';
import { connectDatabase } from './db/connection';

export async function buildRealApp() {
  // Ensure we're using the real database
  await connectDatabase();
  
  const fastify = Fastify({
    logger: {
      level: 'warn', // Reduce log noise in tests
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    },
    ignoreTrailingSlash: true,
    disableRequestLogging: false, // Enable for debugging
    trustProxy: true,
    bodyLimit: 10485760, // 10MB
  });

  // Register core services (real services, not mocks)
  fastify.decorate('services', {
    encryption: ServiceFactory.getEncryptionService(),
    email: ServiceFactory.getEmailService(),
    audit: ServiceFactory.getAuditTrailService(),
    storage: ServiceFactory.getStorageService(),
    fileSecurity: ServiceFactory.getFileSecurityService(),
    imageProcessing: ServiceFactory.getImageProcessingService()
  });

  // Register plugins with real database connections
  try {
    await fastify.register(import('./plugins/database'));
    await fastify.register(import('./plugins/auth'));
    await fastify.register(import('./plugins/validation'));
    
    console.log('✅ Real database plugins registered successfully');
  } catch (error) {
    console.error('❌ Plugin registration failed:', error);
    throw error;
  }

  // Register routes that we want to test
  try {
    await fastify.register(import('./routes/auth'), { prefix: '/api/auth' });
    await fastify.register(import('./routes/students'), { prefix: '/api/students' });
    await fastify.register(import('./routes/exercises'), { prefix: '/api/exercises' });
    
    console.log('✅ Routes registered successfully');
  } catch (error) {
    console.error('❌ Route registration failed:', error);
    throw error;
  }

  // Health check endpoint
  fastify.get('/api/health', async () => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: 'test-real-db',
      database: 'real',
      mocks: 'disabled'
    };
  });

  return fastify;
}